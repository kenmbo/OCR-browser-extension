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

  // --- Viewport Selection Canvas ---

  function initSelectionMode() {
    // Reset previous selection instance if re-triggered
    teardownSelectionCanvas();

    selectionCanvas = document.createElement('canvas');
    selectionCanvas.id = 'ocr-selection-overlay';
    Object.assign(selectionCanvas.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      zIndex: '2147483646',
      cursor: 'crosshair'
    });

    selectionCanvas.width = window.innerWidth * window.devicePixelRatio;
    selectionCanvas.height = window.innerHeight * window.devicePixelRatio;

    const ctx = selectionCanvas.getContext('2d');
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    selectionCanvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('keydown', onSelectionKeyDown, true);

    document.documentElement.appendChild(selectionCanvas);
  }

  function teardownSelectionCanvas() {
    if (!selectionCanvas) return;
    selectionCanvas.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    window.removeEventListener('keydown', onSelectionKeyDown, true);
    selectionCanvas.remove();
    selectionCanvas = null;
    isSelecting = false;
  }

  function onSelectionKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      teardownSelectionCanvas();
    }
  }

  function onMouseDown(e) {
    if (e.button !== 0) return;
    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;
  }

  function onMouseMove(e) {
    if (!isSelecting || !selectionCanvas) return;

    const currentX = e.clientX;
    const currentY = e.clientY;
    const width = currentX - startX;
    const height = currentY - startY;

    const ctx = selectionCanvas.getContext('2d');
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // Dim background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    // Clear active selection rectangle
    ctx.clearRect(startX, startY, width, height);

    // Bounding border
    ctx.strokeStyle = '#0066FF';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, startY, width, height);
  }

  async function onMouseUp(e) {
    if (!isSelecting) return;
    isSelecting = false;

    const endX = e.clientX;
    const endY = e.clientY;

    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);

    teardownSelectionCanvas();

    // Minimum size check (10x10 CSS px)
    if (width < MIN_SELECTION_SIZE || height < MIN_SELECTION_SIZE) {
      return; // Treat as accidental click / dismissal
    }

    ensurePort();

    // Request capture of visible tab and crop to selection bounds
    const dpr = window.devicePixelRatio;
    const cropBox = {
      x: Math.round(x * dpr),
      y: Math.round(y * dpr),
      w: Math.round(width * dpr),
      h: Math.round(height * dpr)
    };

    cropVisibleViewport(cropBox);
  }

  function cropVisibleViewport(cropBox) {
    // Message background to capture visible viewport, then crop locally
    browser.runtime.sendMessage({ type: 'CAPTURE_AND_ENQUEUE' });

    // Store crop box for when capture stream initializes
    window._pendingOcrCrop = cropBox;
  }

  // --- Shadow DOM Result Overlay ---

  let panelInstance = null;

  function getOrCreateResultPanel() {
    if (panelInstance && document.getElementById('ocr-shadow-host')) {
      return panelInstance;
    }

    const existingHost = document.getElementById('ocr-shadow-host');
    if (existingHost) existingHost.remove();

    const host = document.createElement('div');
    host.id = 'ocr-shadow-host';
    Object.assign(host.style, {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: '2147483647'
    });

    const shadowRoot = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      :host {
        all: initial;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      .panel {
        width: 360px;
        max-height: 480px;
        background: #1E1E24;
        color: #F4F4F6;
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid #33333F;
      }
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 14px;
        background: #282832;
        border-bottom: 1px solid #33333F;
      }
      .title {
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.3px;
      }
      .close-btn {
        background: transparent;
        border: none;
        color: #9E9EA8;
        cursor: pointer;
        font-size: 16px;
        padding: 2px 6px;
        border-radius: 4px;
      }
      .close-btn:hover {
        background: #3A3A48;
        color: #FFF;
      }
      .body {
        padding: 12px 14px;
        overflow-y: auto;
        font-size: 13px;
        line-height: 1.5;
        flex: 1;
      }
      .status {
        color: #9E9EA8;
        font-style: italic;
      }
      .progress-bar-bg {
        height: 6px;
        background: #33333F;
        border-radius: 3px;
        overflow: hidden;
        margin-top: 8px;
      }
      .progress-bar-fill {
        height: 100%;
        background: #0066FF;
        width: 0%;
        transition: width 0.15s ease-out;
      }
      .ocr-output {
        white-space: pre-wrap;
        word-break: break-word;
        margin: 0;
        font-family: inherit;
      }
      .footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 14px;
        background: #282832;
        border-top: 1px solid #33333F;
        font-size: 11px;
        color: #9E9EA8;
      }
      .copy-btn {
        background: #0066FF;
        color: #FFF;
        border: none;
        padding: 4px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
      }
      .copy-btn:hover {
        background: #0052CC;
      }
    `;

    const container = document.createElement('div');
    container.className = 'panel';

    container.innerHTML = `
      <div class="header">
        <span class="title">Local OCR</span>
        <button class="close-btn" title="Close (Esc)">✕</button>
      </div>
      <div class="body">
        <div class="status-view">
          <div class="status-text">Initializing OCR Engine...</div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill"></div>
          </div>
        </div>
        <pre class="ocr-output" style="display: none;"></pre>
      </div>
      <div class="footer" style="display: none;">
        <span class="confidence-badge">Confidence: --%</span>
        <button class="copy-btn">Copy Text</button>
      </div>
    `;

    shadowRoot.appendChild(style);
    shadowRoot.appendChild(container);
    document.documentElement.appendChild(host);

    const closeBtn = container.querySelector('.close-btn');
    const copyBtn = container.querySelector('.copy-btn');
    const statusText = container.querySelector('.status-text');
    const progressBar = container.querySelector('.progress-bar-fill');
    const statusView = container.querySelector('.status-view');
    const ocrOutput = container.querySelector('.ocr-output');
    const footer = container.querySelector('.footer');
    const confidenceBadge = container.querySelector('.confidence-badge');

    function dismiss() {
      browser.runtime.sendMessage({ type: 'CANCEL_ACTIVE_JOB' });
      host.remove();
      panelInstance = null;
    }

    closeBtn.addEventListener('click', dismiss);

    // Esc key listener scoped to dismiss panel without propagating to host page
    function onPanelKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        dismiss();
      }
    }
    window.addEventListener('keydown', onPanelKeyDown, true);

    copyBtn.addEventListener('click', async () => {
      const textToCopy = ocrOutput.textContent || '';
      try {
        await browser.runtime.sendMessage({ type: 'WRITE_CLIPBOARD', text: textToCopy });
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy Text'; }, 2000);
      } catch (err) {
        copyBtn.textContent = 'Failed';
      }
    });

    panelInstance = {
      showQueued(position) {
        statusView.style.display = 'block';
        ocrOutput.style.display = 'none';
        footer.style.display = 'none';
        statusText.textContent = `Queued (Position #${position})...`;
        progressBar.style.width = '0%';
      },
      showProcessing() {
        statusView.style.display = 'block';
        ocrOutput.style.display = 'none';
        footer.style.display = 'none';
        statusText.textContent = 'Processing OCR (WASM)...';
        progressBar.style.width = '5%';
      },
      updateProgress(percent) {
        statusView.style.display = 'block';
        statusText.textContent = `Recognizing text (${percent}%)...`;
        progressBar.style.width = `${percent}%`;
      },
      showResult(text, confidence) {
        statusView.style.display = 'none';
        ocrOutput.style.display = 'block';
        footer.style.display = 'flex';
        ocrOutput.textContent = text || '[No text detected]';
        confidenceBadge.textContent = `Confidence: ${confidence}%`;
      },
      showError(errMsg) {
        statusView.style.display = 'block';
        ocrOutput.style.display = 'none';
        footer.style.display = 'none';
        statusText.textContent = `Error: ${errMsg}`;
        progressBar.style.width = '0%';
      },
      destroy() {
        window.removeEventListener('keydown', onPanelKeyDown, true);
        host.remove();
        panelInstance = null;
      }
    };

    return panelInstance;
  }
})();
