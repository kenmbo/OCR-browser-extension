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

// --- Runtime Message Listener ---

  browser.runtime.onMessage.addListener((msg) => {
    handlePipelineMessage(msg);
  });

  function handlePipelineMessage(msg) {
    switch (msg.type) {
      case 'START_SELECTION':
        initSelectionMode();
        break;
      case 'PROCESS_CONTEXT_IMAGE':
        processContextImage(msg.srcUrl);
        break;
      case 'OCR_QUEUED':
        ensurePort();
        getOrCreateResultPanel().showQueued(msg.queuePosition);
        break;
      case 'OCR_START':
        getOrCreateResultPanel().showProcessing();
        break;
      case 'OCR_PROGRESS':
        getOrCreateResultPanel().updateProgress(msg.progress);
        break;
      case 'OCR_COMPLETE':
        getOrCreateResultPanel().showResult(msg.text, msg.confidence);
        break;
      case 'OCR_ERROR':
        getOrCreateResultPanel().showError(msg.error);
        break;
    }
  }

// --- Context Menu Image Extraction ---

  async function processContextImage(srcUrl) {
    ensurePort();
    const img = lastRightClickedElement instanceof HTMLImageElement ? lastRightClickedElement : null;

    if (img && img.src === srcUrl && img.complete && img.naturalWidth > 0) {
      // Calculate visible intersection with viewport
      const rect = img.getBoundingClientRect();
      const visibleX = Math.max(0, rect.left);
      const visibleY = Math.max(0, rect.top);
      const visibleRight = Math.min(window.innerWidth, rect.right);
      const visibleBottom = Math.min(window.innerHeight, rect.bottom);

      const visibleW = visibleRight - visibleX;
      const visibleH = visibleBottom - visibleY;

      if (visibleW > MIN_SELECTION_SIZE && visibleH > MIN_SELECTION_SIZE) {
        // Image partially/fully in view: extract via offscreen canvas
        const canvas = document.createElement('canvas');
        canvas.width = visibleW;
        canvas.height = visibleH;
        const ctx = canvas.getContext('2d');

        const sourceX = (visibleX - rect.left) * (img.naturalWidth / rect.width);
        const sourceY = (visibleY - rect.top) * (img.naturalHeight / rect.height);
        const sourceW = visibleW * (img.naturalWidth / rect.width);
        const sourceH = visibleH * (img.naturalHeight / rect.height);

        try {
          ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, 0, 0, visibleW, visibleH);
          const dataUrl = canvas.toDataURL('image/png');
          browser.runtime.sendMessage({ type: 'ENQUEUE_DIRECT_IMAGE', imagePayload: dataUrl });
          return;
        } catch {
          // Fallback to fetch if canvas is tainted by CORS
        }
      }
    }

    // Direct page fetch fallback to avoid host permissions
    try {
      const response = await fetch(srcUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        browser.runtime.sendMessage({ type: 'ENQUEUE_DIRECT_IMAGE', imagePayload: reader.result });
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      getOrCreateResultPanel().showError('Failed to extract image source: ' + err.message);
    }
  }

})();
