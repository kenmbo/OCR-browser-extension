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

