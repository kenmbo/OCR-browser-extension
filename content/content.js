/**
 * Local OCR WebExtension - Content Script (Selection & UI Isolation)
 */

(() => {
  const MIN_SELECTION_SIZE = 10; // CSS pixels
  let keepAlivePort = null;
  let selectionCanvas = null;
  let isSelecting = false;
  let startX = 0;
  let startY = 0;
  let lastRightClickedElement = null;

  // Track right-clicked elements for context-menu extraction
  document.addEventListener('contextmenu', (e) => {
    lastRightClickedElement = e.target;
  }, true);

  // --- Long-Lived Port for SW Keep-Alive & Streaming ---

  function ensurePort() {
    if (keepAlivePort) return keepAlivePort;

    keepAlivePort = browser.runtime.connect({ name: 'ocr-keepalive' });
    
    keepAlivePort.onMessage.addListener((msg) => {
      handlePipelineMessage(msg);
    });

    keepAlivePort.onDisconnect.addListener(() => {
      keepAlivePort = null;
    });

    return keepAlivePort;
  }
})();
