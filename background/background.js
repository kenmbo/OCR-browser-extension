/**
 * Local OCR WebExtension - Background Queue & Worker Lifecycle
 */

const RESTRICTED_SCHEMES = ['chrome:', 'about:', 'edge:', 'chrome-extension:', 'moz-extension:'];
const RESTRICTED_HOSTS = ['chromewebstore.google.com', 'addons.mozilla.org'];
const MAX_QUEUE_CAPACITY = 8; // 1 active + 7 queued

let tesseractWorker = null;
let isProcessing = false;
let activeJob = null;
const activePorts = new Map(); // tabId -> Port

// --- Initialization & Context Menus ---

browser.runtime.onInstalled.addListener(async () => {
  await browser.storage.session.set({ ocrQueue: [] });
  
  browser.contextMenus.create({
    id: 'ocr-image-context',
    title: 'Extract Text from Image (Local OCR)',
    contexts: ['image']
  });
});

// --- Tab-Level Guard & Context Handling ---

function isRestrictedUrl(url) {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    if (RESTRICTED_SCHEMES.includes(parsed.protocol)) return true;
    if (RESTRICTED_HOSTS.some(host => parsed.hostname.includes(host))) return true;
    return false;
  } catch {
    return true;
  }
}

function notifyRestricted(tabId) {
  browser.notifications.create({
    type: 'basic',
    iconUrl: browser.runtime.getURL('icons/icon-48.png'),
    title: 'OCR Unavailable',
    message: 'Local OCR cannot run on internal browser or web store pages.'
  });
}

browser.action.onClicked.addListener(async (tab) => {
  if (isRestrictedUrl(tab.url)) {
    notifyRestricted(tab.id);
    return;
  }
  try {
    await browser.tabs.sendMessage(tab.id, { type: 'START_SELECTION' });
  } catch (err) {
    console.error('Failed to trigger selection mode:', err);
  }
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'ocr-image-context' && tab) {
    if (isRestrictedUrl(tab.url)) {
      notifyRestricted(tab.id);
      return;
    }
    try {
      await browser.tabs.sendMessage(tab.id, {
        type: 'PROCESS_CONTEXT_IMAGE',
        srcUrl: info.srcUrl
      });
    } catch (err) {
      console.error('Failed to dispatch context menu OCR:', err);
    }
  }
});

// --- Keep-Alive Port Connections ---

browser.runtime.onConnect.addListener((port) => {
  if (port.name !== 'ocr-keepalive') return;

  const tabId = port.sender?.tab?.id;
  if (!tabId) return;

  activePorts.set(tabId, port);

  port.onDisconnect.addListener(() => {
    activePorts.delete(tabId);
  });
});

// --- Worker Lifecycle Management ---

async function getWorker() {
  if (tesseractWorker) return tesseractWorker;

  // Import local Tesseract scripts inside service worker/background context
  if (typeof importScripts === 'function') {
    importScripts(
      browser.runtime.getURL('vendor/browser-polyfill.min.js'),
      browser.runtime.getURL('vendor/tesseract.min.js')
    );
  }

  const worker = await Tesseract.createWorker('eng', 1, {
    workerPath: browser.runtime.getURL('vendor/worker.min.js'),
    corePath: browser.runtime.getURL('vendor/tesseract-core.wasm.js'),
    langPath: browser.runtime.getURL('tessdata'),
    gzip: false,
    logger: (m) => handleWorkerProgress(m)
  });

  tesseractWorker = worker;
  return tesseractWorker;
}

async function terminateWorker() {
  if (tesseractWorker) {
    try {
      await tesseractWorker.terminate();
    } catch (err) {
      console.warn('Error during worker termination:', err);
    }
    tesseractWorker = null;
  }
}

function handleWorkerProgress(progressEvent) {
  if (!activeJob) return;
  
  if (progressEvent.status === 'recognizing text') {
    const progress = Math.round((progressEvent.progress || 0) * 100);
    notifyTab(activeJob.tabId, {
      type: 'OCR_PROGRESS',
      jobId: activeJob.id,
      progress
    });
  }
}

// --- Text Normalization Pipeline ---

function normalizeOcrText(rawText) {
  if (!rawText) return '';
  return rawText
    .replace(/\r\n|\r/g, '\n')       // CRLF/CR -> LF
    .replace(/[ \t]+$/gm, '')        // Strip trailing line whitespace
    .replace(/\n{3,}/g, '\n\n')      // Collapse >= 3 newlines to 2
    .trim();                         // Trim leading/trailing overall whitespace
}

// --- FIFO Queue Processor ---

async function enqueueJob(job) {
  const { ocrQueue = [] } = await browser.storage.session.get('ocrQueue');
  ocrQueue.push(job);
  await browser.storage.session.set({ ocrQueue });

  notifyTab(job.tabId, {
    type: 'OCR_QUEUED',
    jobId: job.id,
    queuePosition: ocrQueue.length
  });

  processNextJob();
}

async function processNextJob() {
  if (isProcessing) return;

  const { ocrQueue = [] } = await browser.storage.session.get('ocrQueue');
  if (ocrQueue.length === 0) {
    activeJob = null;
    return;
  }

  isProcessing = true;
  activeJob = ocrQueue.shift();
  await browser.storage.session.set({ ocrQueue });

  notifyTab(activeJob.tabId, {
    type: 'OCR_START',
    jobId: activeJob.id
  });

  try {
    const worker = await getWorker();
    const result = await worker.recognize(activeJob.imagePayload);

    const formattedText = normalizeOcrText(result.data.text);
    const confidence = Math.round(result.data.confidence || 0);

    notifyTab(activeJob.tabId, {
      type: 'OCR_COMPLETE',
      jobId: activeJob.id,
      text: formattedText,
      confidence
    });
  } catch (error) {
    if (activeJob) {
      notifyTab(activeJob.tabId, {
        type: 'OCR_ERROR',
        jobId: activeJob.id,
        error: error.message || 'Recognition failed.'
      });
    }
  } finally {
    isProcessing = false;
    activeJob = null;
    processNextJob();
  }
}

function notifyTab(tabId, message) {
  const port = activePorts.get(tabId);
  if (port) {
    try {
      port.postMessage(message);
      return;
    } catch {
      activePorts.delete(tabId);
    }
  }
  browser.tabs.sendMessage(tabId, message).catch(() => {
    // Tab may be closed or unloaded
  });
}

// --- Cancellation & Queue Pruning ---

async function cancelTabJobs(targetTabId) {
  const { ocrQueue = [] } = await browser.storage.session.get('ocrQueue');
  const filteredQueue = ocrQueue.filter(job => job.tabId !== targetTabId);
  await browser.storage.session.set({ ocrQueue: filteredQueue });

  // If the active job belongs to the canceled tab, hard-kill the worker to abort execution
  if (activeJob && activeJob.tabId === targetTabId) {
    await terminateWorker();
    activeJob = null;
    isProcessing = false;
    processNextJob();
  }
}

// Clean up when tabs close
browser.tabs.onRemoved.addListener((closedTabId) => {
  activePorts.delete(closedTabId);
  cancelTabJobs(closedTabId);
});

// --- Message Router ---

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender?.tab?.id;

  switch (message.type) {
    case 'CAPTURE_AND_ENQUEUE': {
      browser.tabs.captureVisibleTab(null, { format: 'png' }).then((dataUrl) => {
        const job = {
          id: crypto.randomUUID(),
          tabId: tabId,
          imagePayload: message.imagePayload || dataUrl,
          timestamp: Date.now()
        };
        enqueueJob(job);
      }).catch(err => {
        notifyTab(tabId, { type: 'OCR_ERROR', error: 'Viewport capture failed: ' + err.message });
      });
      break;
    }

    case 'ENQUEUE_DIRECT_IMAGE': {
      const job = {
        id: crypto.randomUUID(),
        tabId: tabId,
        imagePayload: message.imagePayload,
        timestamp: Date.now()
      };
      enqueueJob(job);
      break;
    }

    case 'CANCEL_ACTIVE_JOB': {
      if (tabId) cancelTabJobs(tabId);
      break;
    }

    case 'WRITE_CLIPBOARD': {
      // Delegate clipboard write to background context
      navigator.clipboard.writeText(message.text)
        .then(() => sendResponse({ success: true }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true; // Keep message channel open for async response
    }
  }
});

// -- Capacity Guard

async function canAcceptJob() {
  const { ocrQueue = [] } = await browser.storage.session.get('ocrQueue');
  const currentTotal = ocrQueue.length + (isProcessing ? 1 : 0);
  return currentTotal < MAX_QUEUE_CAPACITY;
}

// Pre-flight check before triggering screenshot selection
browser.action.onClicked.addListener(async (tab) => {
  if (isRestrictedUrl(tab.url)) {
    notifyRestricted(tab.id);
    return;
  }

  const hasCapacity = await canAcceptJob();
  if (!hasCapacity) {
    notifyQueueFull(tab.id);
    return;
  }

  browser.tabs.sendMessage(tab.id, { type: 'START_SELECTION' });
});

// Guard context-menu ingestion
browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'ocr-image-context' && tab) {
    if (isRestrictedUrl(tab.url)) {
      notifyRestricted(tab.id);
      return;
    }

    const hasCapacity = await canAcceptJob();
    if (!hasCapacity) {
      notifyQueueFull(tab.id);
      return;
    }

    browser.tabs.sendMessage(tab.id, {
      type: 'PROCESS_CONTEXT_IMAGE',
      srcUrl: info.srcUrl
    });
  }
});

function notifyQueueFull(tabId) {
  // Option A: Push notification to the tab's Shadow DOM overlay
  notifyTab(tabId, {
    type: 'OCR_ERROR',
    error: 'OCR queue is full (maximum 8 jobs). Please wait for active tasks to finish.'
  });

  // Option B: Native browser notification fallback if content script isn't active
  browser.notifications.create({
    type: 'basic',
    iconUrl: browser.runtime.getURL('icons/icon-48.png'),
    title: 'Queue Full',
    message: 'OCR queue is at capacity (8/8). Please wait for existing jobs to finish.'
  });
}
