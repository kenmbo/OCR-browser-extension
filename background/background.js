/**
 * Local OCR WebExtension - Background Queue & Worker Lifecycle
 */

const RESTRICTED_SCHEMES = ['chrome:', 'about:', 'edge:', 'chrome-extension:', 'moz-extension:'];
const RESTRICTED_HOSTS = ['chromewebstore.google.com', 'addons.mozilla.org'];

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
