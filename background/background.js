**
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
