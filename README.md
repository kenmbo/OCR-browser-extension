# OCR Web Extension

This is a local Optical Character Recognition (OCR) WebExtension for Firefox and Chrome (Chromium).
This extension complies with Manifest V3 (MV3).

##  Core Engine & Dependencies 

* **Engine:** Tesseract.js running locally via WebAssembly (WASM).

* **Zero Remote Code:** All scripts, WASM binaries (`tesseract-core.wasm.js`, `worker.min.js`), and trained language data (`tessdata/eng.traineddata`) must be bundled locally inside the extension package to comply with strict MV3 CSP.

* **Manifest CSP:** `"wasm-unsafe-eval"` included in `content_security_policy` for WebAssembly execution.

* **Supported Browsers:** Firefox v140+, Chrome/Chromium v116+.

* **Cross-Browser Polyfill:** Use Mozilla's `webextension-polyfill` (`browser.*` namespace).


# Project Directory Layout

```plaintext
OCR-browser-extension/
├── manifest.chrome.json          # Chrome MV3 configuration (Service Worker)
├── manifest.firefox.json         # Firefox MV3 configuration (Event/Background Page)
├── background/
│   └── background.js             # FIFO Queue, Worker orchestrator, storage sync
├── content/
│   └── content.js                # Selection canvas, Shadow DOM UI, coordinates math
├── offscreen/                    # Chrome Offscreen document (Canvas/Worker bridge)
│   ├── offscreen.html
│   └── offscreen.js
├── vendor/
│   ├── browser-polyfill.min.js   # Mozilla WebExtension polyfill
│   ├── tesseract.min.js          # Tesseract.js v5+ local distribution
│   ├── worker.min.js             # Tesseract Web Worker
│   └── tesseract-core.wasm.js    # WASM runtime wrapper
├── tessdata/
│   └── eng.traineddata           # Local bundled English OCR model
├── tests/fixtures/
│   ├── synthetic/
│   ├── geometry/
│   ├── adversial/
│   ├── pages/
│   └── storage/
└── icons/
    ├── icon-16.png
    ├── icon-48.png
    └── icon-128.png
```

# Permisssions
Copying uses an in-frame three-stage fallback (navigator.clipboard.writeText via iframe allow="clipboard-write", gesture-bound execCommand("copy"), and focusable selectable plaintext).

# Testing
Planned testing::
* OCR validation
* Resource-ceiling testing
* CI testing
 - Online Lane
 - Offline Lane
