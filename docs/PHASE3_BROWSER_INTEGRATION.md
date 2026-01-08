# Phase 3: Browser Integration with ONNX Runtime Web

## Overview
Integrate your trained YOLO11 rooftop detector into the Chrome extension using ONNX Runtime Web for optimal browser performance. This replaces the current TensorFlow.js implementation.

---

## Prerequisites

✅ Completed Phase 2: Trained YOLO11 model exported to ONNX
✅ Model file: `best.onnx` (~5-10 MB)
✅ Extension source code in `~/Board-Explorer`

---

## Step 1: Install Dependencies

### 1.1 Add ONNX Runtime Web

```bash
cd ~/Board-Explorer

# Install ONNX Runtime Web
npm install onnxruntime-web@latest

# Verify installation
npm list onnxruntime-web
```

### 1.2 Update package.json

Your `package.json` should now include:

```json
{
  "dependencies": {
    "@tensorflow/tfjs": "^3.12.0",  // Keep for now, can remove later
    "onnxruntime-web": "^1.23.2",   // New!
    "chess.js": "^0.12.0",
    "chessboard-element": "^1.2.0",
    "chessground": "^8.1.9",
    "webpack": "^5.65.0",
    "webpack-cli": "^4.9.1"
  }
}
```

---

## Step 2: Add Model to Extension

### 2.1 Copy ONNX Model

```bash
# Create model directory if it doesn't exist
mkdir -p build/model

# Copy your trained model
cp ~/workspace/yolo11_rooftop_training/runs/rooftop/yolo11n_rooftop/weights/best.onnx \
   build/model/rooftop-detector.onnx

# Verify
ls -lh build/model/rooftop-detector.onnx
# Should show ~5-10 MB file
```

### 2.2 Update Manifest

Edit `build/manifest.json` to include the model:

```json
{
  "manifest_version": 3,
  "name": "Board Explorer",
  "version": "2.0.0",
  "description": "Detect and analyze rooftops in browser content",

  "permissions": [
    "activeTab",
    "scripting",
    "tabs"
  ],

  "host_permissions": [
    "<all_urls>"
  ],

  "web_accessible_resources": [{
    "resources": [
      "model/*",
      "scripts/*",
      "images/*"
    ],
    "matches": ["<all_urls>"]
  }],

  "background": {
    "service_worker": "scripts/background.js",
    "type": "module"
  },

  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["scripts/content-script.js"],
    "css": ["styles/chessground.css"],
    "run_at": "document_idle"
  }],

  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "images/icons/icon16.png",
      "48": "images/icons/icon48.png",
      "128": "images/icons/icon128.png"
    }
  }
}
```

---

## Step 3: Create ONNX Model Loader

### 3.1 Create `src/onnx-detector.ts`

This replaces the TensorFlow.js model loading logic:

```typescript
// src/onnx-detector.ts

import * as ort from 'onnxruntime-web';

// YOLO11 configuration
const MODEL_INPUT_SIZE = 640;
const CONFIDENCE_THRESHOLD = 0.25;
const IOU_THRESHOLD = 0.45;
const NUM_CLASSES = 1; // Only 'rooftop' class

interface Detection {
    bbox: [number, number, number, number]; // [x, y, width, height]
    score: number;
    class: number;
    label: string;
}

export class OnnxRooftopDetector {
    private session: ort.InferenceSession | null = null;
    private modelPath: string;

    constructor(modelPath: string = 'model/rooftop-detector.onnx') {
        this.modelPath = chrome.runtime.getURL(modelPath);
    }

    /**
     * Load the ONNX model
     */
    async loadModel(): Promise<void> {
        console.log('Loading ONNX model from:', this.modelPath);

        try {
            // Configure ONNX Runtime Web
            ort.env.wasm.wasmPaths = chrome.runtime.getURL('node_modules/onnxruntime-web/dist/');

            // Use WebGL backend for GPU acceleration (or 'wasm' for CPU)
            this.session = await ort.InferenceSession.create(this.modelPath, {
                executionProviders: ['webgl', 'wasm'],
                graphOptimizationLevel: 'all'
            });

            console.log('✅ ONNX model loaded successfully!');
            console.log('Input names:', this.session.inputNames);
            console.log('Output names:', this.session.outputNames);
        } catch (error) {
            console.error('❌ Failed to load ONNX model:', error);
            throw error;
        }
    }

    /**
     * Preprocess image for YOLO11 inference
     */
    private preprocessImage(imageData: ImageData): ort.Tensor {
        const { width, height, data } = imageData;

        // Create canvas for resizing
        const canvas = document.createElement('canvas');
        canvas.width = MODEL_INPUT_SIZE;
        canvas.height = MODEL_INPUT_SIZE;
        const ctx = canvas.getContext('2d')!;

        // Draw original image scaled to model input size
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d')!;
        tempCtx.putImageData(imageData, 0, 0);

        ctx.drawImage(tempCanvas, 0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);

        // Get resized image data
        const resizedData = ctx.getImageData(0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);

        // Convert to NCHW format: [1, 3, 640, 640]
        // Normalize to [0, 1] by dividing by 255
        const float32Data = new Float32Array(1 * 3 * MODEL_INPUT_SIZE * MODEL_INPUT_SIZE);

        for (let i = 0; i < resizedData.data.length; i += 4) {
            const pixelIndex = i / 4;
            const y = Math.floor(pixelIndex / MODEL_INPUT_SIZE);
            const x = pixelIndex % MODEL_INPUT_SIZE;

            // RGB channels
            const rIndex = 0 * MODEL_INPUT_SIZE * MODEL_INPUT_SIZE + y * MODEL_INPUT_SIZE + x;
            const gIndex = 1 * MODEL_INPUT_SIZE * MODEL_INPUT_SIZE + y * MODEL_INPUT_SIZE + x;
            const bIndex = 2 * MODEL_INPUT_SIZE * MODEL_INPUT_SIZE + y * MODEL_INPUT_SIZE + x;

            // Normalize to [0, 1]
            float32Data[rIndex] = resizedData.data[i] / 255.0;
            float32Data[gIndex] = resizedData.data[i + 1] / 255.0;
            float32Data[bIndex] = resizedData.data[i + 2] / 255.0;
        }

        // Create tensor
        return new ort.Tensor('float32', float32Data, [1, 3, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE]);
    }

    /**
     * Non-Maximum Suppression (NMS)
     */
    private nms(boxes: Detection[]): Detection[] {
        // Sort by confidence
        boxes.sort((a, b) => b.score - a.score);

        const selected: Detection[] = [];

        while (boxes.length > 0) {
            const current = boxes.shift()!;
            selected.push(current);

            boxes = boxes.filter(box => {
                const iou = this.calculateIoU(current.bbox, box.bbox);
                return iou < IOU_THRESHOLD;
            });
        }

        return selected;
    }

    /**
     * Calculate Intersection over Union (IoU)
     */
    private calculateIoU(box1: [number, number, number, number], box2: [number, number, number, number]): number {
        const [x1, y1, w1, h1] = box1;
        const [x2, y2, w2, h2] = box2;

        const x1_min = x1 - w1 / 2;
        const y1_min = y1 - h1 / 2;
        const x1_max = x1 + w1 / 2;
        const y1_max = y1 + h1 / 2;

        const x2_min = x2 - w2 / 2;
        const y2_min = y2 - h2 / 2;
        const x2_max = x2 + w2 / 2;
        const y2_max = y2 + h2 / 2;

        const intersect_w = Math.max(0, Math.min(x1_max, x2_max) - Math.max(x1_min, x2_min));
        const intersect_h = Math.max(0, Math.min(y1_max, y2_max) - Math.max(y1_min, y2_min));
        const intersect_area = intersect_w * intersect_h;

        const box1_area = w1 * h1;
        const box2_area = w2 * h2;
        const union_area = box1_area + box2_area - intersect_area;

        return union_area > 0 ? intersect_area / union_area : 0;
    }

    /**
     * Post-process YOLO11 output
     */
    private postprocess(output: ort.Tensor, originalWidth: number, originalHeight: number): Detection[] {
        const outputData = output.data as Float32Array;
        const detections: Detection[] = [];

        // YOLO11 output format: [1, 84, 8400]
        // 84 = 4 (bbox) + 80 (COCO classes, but we only use 1)
        // 8400 = number of anchors

        const numAnchors = 8400;
        const stride = 84;

        for (let i = 0; i < numAnchors; i++) {
            const offset = i;

            // Extract bbox (x_center, y_center, width, height)
            const x = outputData[offset];
            const y = outputData[offset + numAnchors];
            const w = outputData[offset + numAnchors * 2];
            const h = outputData[offset + numAnchors * 3];

            // Extract class scores (we only have 1 class: rooftop)
            const classScore = outputData[offset + numAnchors * 4];

            // Filter by confidence
            if (classScore >= CONFIDENCE_THRESHOLD) {
                // Scale bbox to original image size
                const scaleX = originalWidth / MODEL_INPUT_SIZE;
                const scaleY = originalHeight / MODEL_INPUT_SIZE;

                detections.push({
                    bbox: [x * scaleX, y * scaleY, w * scaleX, h * scaleY],
                    score: classScore,
                    class: 0,
                    label: 'rooftop'
                });
            }
        }

        // Apply NMS
        return this.nms(detections);
    }

    /**
     * Run detection on image
     */
    async detect(imageData: ImageData): Promise<Detection[]> {
        if (!this.session) {
            throw new Error('Model not loaded. Call loadModel() first.');
        }

        console.log('Running inference on image:', imageData.width, 'x', imageData.height);

        const startTime = performance.now();

        // Preprocess
        const inputTensor = this.preprocessImage(imageData);
        console.log('Input tensor shape:', inputTensor.dims);

        // Run inference
        const feeds: Record<string, ort.Tensor> = {};
        feeds[this.session.inputNames[0]] = inputTensor;

        const results = await this.session.run(feeds);
        const output = results[this.session.outputNames[0]];

        // Postprocess
        const detections = this.postprocess(output, imageData.width, imageData.height);

        const endTime = performance.now();
        console.log(`✅ Inference complete in ${(endTime - startTime).toFixed(2)}ms`);
        console.log(`Found ${detections.length} rooftop(s)`);

        return detections;
    }

    /**
     * Detect rooftops from screen capture
     */
    async detectFromScreen(stream: MediaStream): Promise<Detection[]> {
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();

        // Wait for video to be ready
        await new Promise(resolve => {
            video.onloadedmetadata = resolve;
        });

        // Capture frame
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(video, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Stop stream
        stream.getTracks().forEach(track => track.stop());

        // Run detection
        return this.detect(imageData);
    }

    /**
     * Dispose of resources
     */
    dispose(): void {
        if (this.session) {
            console.log('Disposing ONNX session...');
            this.session = null;
        }
    }
}

export { Detection };
```

---

## Step 4: Update Background Script

### 4.1 Edit `src/background.ts`

Replace the TensorFlow.js model loading with ONNX:

```typescript
// src/background.ts

import { OnnxRooftopDetector, Detection } from './onnx-detector';

// Global detector instance
let detector: OnnxRooftopDetector | null = null;

// Load model on extension startup
chrome.runtime.onInstalled.addListener(async () => {
    console.log('Board Explorer v2.0 - Rooftop Detector');
    await initializeDetector();
});

/**
 * Initialize the ONNX detector
 */
async function initializeDetector(): Promise<void> {
    try {
        console.log('Initializing rooftop detector...');
        detector = new OnnxRooftopDetector('model/rooftop-detector.onnx');
        await detector.loadModel();
        console.log('✅ Detector ready!');
    } catch (error) {
        console.error('❌ Failed to initialize detector:', error);
    }
}

/**
 * Handle detection requests from content script
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'detect') {
        handleDetection(request.imageData)
            .then(detections => {
                sendResponse({ success: true, detections });
            })
            .catch(error => {
                console.error('Detection error:', error);
                sendResponse({ success: false, error: error.message });
            });

        // Return true to indicate async response
        return true;
    }

    if (request.action === 'getStatus') {
        sendResponse({
            ready: detector !== null,
            version: '2.0.0'
        });
    }
});

/**
 * Run detection on image data
 */
async function handleDetection(imageData: ImageData): Promise<Detection[]> {
    if (!detector) {
        await initializeDetector();
    }

    if (!detector) {
        throw new Error('Detector not initialized');
    }

    return detector.detect(imageData);
}

/**
 * Screen capture and detection
 */
async function captureAndDetect(): Promise<Detection[]> {
    const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' as any }
    });

    if (!detector) {
        await initializeDetector();
    }

    if (!detector) {
        throw new Error('Detector not initialized');
    }

    return detector.detectFromScreen(stream);
}
```

---

## Step 5: Update Content Script

### 5.1 Edit `src/content-script.ts`

Update the UI to display rooftop detections:

```typescript
// src/content-script.ts

import { Detection } from './onnx-detector';

let detectionsOverlay: HTMLDivElement | null = null;
let isDetectionActive = false;

/**
 * Initialize detection overlay
 */
function initOverlay(): void {
    if (detectionsOverlay) return;

    detectionsOverlay = document.createElement('div');
    detectionsOverlay.id = 'rooftop-detections-overlay';
    detectionsOverlay.style.position = 'fixed';
    detectionsOverlay.style.top = '0';
    detectionsOverlay.style.left = '0';
    detectionsOverlay.style.width = '100%';
    detectionsOverlay.style.height = '100%';
    detectionsOverlay.style.pointerEvents = 'none';
    detectionsOverlay.style.zIndex = '999999';
    document.body.appendChild(detectionsOverlay);
}

/**
 * Draw detection boxes on overlay
 */
function drawDetections(detections: Detection[]): void {
    if (!detectionsOverlay) {
        initOverlay();
    }

    // Clear previous detections
    detectionsOverlay!.innerHTML = '';

    detections.forEach((detection, index) => {
        const [x, y, width, height] = detection.bbox;

        // Create bounding box
        const box = document.createElement('div');
        box.className = 'rooftop-detection-box';
        box.style.position = 'absolute';
        box.style.left = `${x - width / 2}px`;
        box.style.top = `${y - height / 2}px`;
        box.style.width = `${width}px`;
        box.style.height = `${height}px`;
        box.style.border = '3px solid #00ff00';
        box.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.5)';
        box.style.borderRadius = '4px';

        // Create label
        const label = document.createElement('div');
        label.className = 'rooftop-detection-label';
        label.textContent = `Rooftop ${(detection.score * 100).toFixed(1)}%`;
        label.style.position = 'absolute';
        label.style.top = '-25px';
        label.style.left = '0';
        label.style.padding = '2px 6px';
        label.style.backgroundColor = 'rgba(0, 255, 0, 0.8)';
        label.style.color = 'black';
        label.style.fontSize = '12px';
        label.style.fontWeight = 'bold';
        label.style.borderRadius = '3px';
        label.style.whiteSpace = 'nowrap';

        box.appendChild(label);
        detectionsOverlay!.appendChild(box);
    });

    console.log(`Drew ${detections.length} detection(s)`);
}

/**
 * Capture screen and detect rooftops
 */
async function runDetection(): Promise<void> {
    try {
        // Get screen capture
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: { mediaSource: 'screen' as any }
        });

        const video = document.createElement('video');
        video.srcObject = stream;
        await video.play();

        // Wait for video ready
        await new Promise(resolve => {
            video.onloadedmetadata = resolve;
        });

        // Capture frame
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(video, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Stop stream
        stream.getTracks().forEach(track => track.stop());

        // Send to background for detection
        const response = await chrome.runtime.sendMessage({
            action: 'detect',
            imageData: imageData
        });

        if (response.success) {
            drawDetections(response.detections);
        } else {
            console.error('Detection failed:', response.error);
        }
    } catch (error) {
        console.error('Error during detection:', error);
    }
}

/**
 * Toggle detection on/off
 */
function toggleDetection(): void {
    isDetectionActive = !isDetectionActive;

    if (isDetectionActive) {
        console.log('✅ Rooftop detection activated');
        runDetection();
    } else {
        console.log('⏸️ Rooftop detection paused');
        if (detectionsOverlay) {
            detectionsOverlay.innerHTML = '';
        }
    }
}

/**
 * Listen for messages from popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleDetection') {
        toggleDetection();
        sendResponse({ active: isDetectionActive });
    }

    if (request.action === 'runDetection') {
        runDetection().then(() => {
            sendResponse({ success: true });
        });
        return true; // Async response
    }
});

// Initialize overlay on load
initOverlay();
console.log('🏠 Rooftop Detector Content Script Loaded');
```

---

## Step 6: Build and Test

### 6.1 Build Extension

```bash
cd ~/Board-Explorer

# Build
npm run build

# Verify output
ls -la build/scripts/
ls -lh build/model/rooftop-detector.onnx
```

### 6.2 Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `build/` directory
5. Verify extension loads without errors

### 6.3 Test Detection

1. Click extension icon
2. Navigate to a website with rooftop images (Google Maps, real estate sites)
3. Click "Detect Rooftops" button
4. Grant screen capture permission
5. Verify detection boxes appear over rooftops

---

## Step 7: Performance Optimization

### 7.1 Enable WebGPU (Chrome 113+)

Update `onnx-detector.ts`:

```typescript
this.session = await ort.InferenceSession.create(this.modelPath, {
    executionProviders: ['webgpu', 'webgl', 'wasm'], // Try WebGPU first
    graphOptimizationLevel: 'all'
});
```

### 7.2 Use Web Worker for Inference

Create `src/detector-worker.ts`:

```typescript
// src/detector-worker.ts

import { OnnxRooftopDetector } from './onnx-detector';

let detector: OnnxRooftopDetector | null = null;

self.onmessage = async (e) => {
    const { action, data } = e.data;

    if (action === 'init') {
        detector = new OnnxRooftopDetector();
        await detector.loadModel();
        self.postMessage({ action: 'ready' });
    }

    if (action === 'detect') {
        if (!detector) {
            self.postMessage({ action: 'error', error: 'Detector not initialized' });
            return;
        }

        const detections = await detector.detect(data.imageData);
        self.postMessage({ action: 'detections', detections });
    }
};
```

---

## Expected Performance

| Metric | Target | Excellent |
|--------|--------|-----------|
| Model load time | < 2s | < 1s |
| Inference time (WebGL) | 20-50ms | 10-20ms |
| Inference time (WebGPU) | 10-30ms | 5-10ms |
| Inference time (WASM) | 30-80ms | 20-30ms |
| Model size | ~5-10 MB | ~3-5 MB |
| Memory usage | < 200 MB | < 100 MB |

---

## Troubleshooting

### Issue: Model won't load

**Solutions:**
1. Check model path in manifest `web_accessible_resources`
2. Verify ONNX file is in `build/model/`
3. Check browser console for CORS errors
4. Ensure WASM files are accessible

### Issue: Slow inference

**Solutions:**
1. Enable WebGPU backend
2. Use smaller model (export with `imgsz=416`)
3. Reduce image resolution before inference
4. Use Web Worker to avoid blocking main thread

### Issue: No detections

**Solutions:**
1. Lower confidence threshold: `CONFIDENCE_THRESHOLD = 0.1`
2. Check if rooftops are visible in captured frame
3. Verify model was trained correctly
4. Test with known good rooftop images

---

## Next Steps

✅ **ONNX model integrated into extension!**

**Next:** Proceed to [PHASE4_EXTENSION_UPDATES.md](PHASE4_EXTENSION_UPDATES.md) to update the UI and finalize the extension.
