# Testing and Debugging Guide

## Overview
Comprehensive testing procedures and debugging techniques for the Rooftop Detector extension.

---

## Table of Contents
1. [Unit Testing](#unit-testing)
2. [Integration Testing](#integration-testing)
3. [End-to-End Testing](#e2e-testing)
4. [Performance Testing](#performance-testing)
5. [Debugging Tools](#debugging-tools)
6. [Common Issues](#common-issues)
7. [Test Websites](#test-websites)

---

## Unit Testing

### Test ONNX Model Loading

Create `tests/test-model-loading.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Model Loading Test</title>
    <script src="../node_modules/onnxruntime-web/dist/ort.min.js"></script>
</head>
<body>
    <h1>ONNX Model Loading Test</h1>
    <div id="status">Testing...</div>
    <pre id="log"></pre>

    <script>
        const log = document.getElementById('log');
        const status = document.getElementById('status');

        function addLog(message) {
            log.textContent += `[${new Date().toISOString()}] ${message}\n`;
            console.log(message);
        }

        async function testModelLoading() {
            try {
                addLog('Starting model load test...');

                // Test 1: Load model
                addLog('Test 1: Loading ONNX model...');
                const session = await ort.InferenceSession.create(
                    '../build/model/rooftop-detector.onnx',
                    {
                        executionProviders: ['webgl', 'wasm'],
                        graphOptimizationLevel: 'all'
                    }
                );
                addLog('✅ Model loaded successfully!');

                // Test 2: Check inputs/outputs
                addLog('\nTest 2: Checking model I/O...');
                addLog(`Input names: ${session.inputNames.join(', ')}`);
                addLog(`Output names: ${session.outputNames.join(', ')}`);
                addLog('✅ I/O check passed');

                // Test 3: Create dummy input
                addLog('\nTest 3: Creating dummy input tensor...');
                const dummyInput = new Float32Array(1 * 3 * 640 * 640).fill(0.5);
                const inputTensor = new ort.Tensor('float32', dummyInput, [1, 3, 640, 640]);
                addLog('✅ Input tensor created');

                // Test 4: Run inference
                addLog('\nTest 4: Running inference...');
                const startTime = performance.now();
                const feeds = {};
                feeds[session.inputNames[0]] = inputTensor;
                const results = await session.run(feeds);
                const endTime = performance.now();

                addLog(`✅ Inference completed in ${(endTime - startTime).toFixed(2)}ms`);
                addLog(`Output shape: ${results[session.outputNames[0]].dims.join(' x ')}`);

                // Test 5: Verify output
                addLog('\nTest 5: Verifying output...');
                const output = results[session.outputNames[0]];
                if (output.data.length > 0) {
                    addLog(`✅ Output contains ${output.data.length} values`);
                } else {
                    throw new Error('Output is empty');
                }

                status.textContent = '✅ All tests passed!';
                status.style.color = 'green';

            } catch (error) {
                addLog(`\n❌ Test failed: ${error.message}`);
                addLog(`Stack: ${error.stack}`);
                status.textContent = '❌ Tests failed';
                status.style.color = 'red';
            }
        }

        // Run tests
        testModelLoading();
    </script>
</body>
</html>
```

Run test:
```bash
cd ~/Board-Explorer
python3 -m http.server 8000
# Open: http://localhost:8000/tests/test-model-loading.html
```

---

### Test Image Preprocessing

Create `tests/test-preprocessing.ts`:

```typescript
// test-preprocessing.ts

import { OnnxRooftopDetector } from '../src/onnx-detector';

async function testPreprocessing() {
    console.log('=== Preprocessing Test ===\n');

    // Create test image (640x640, solid red)
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 640;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgb(255, 0, 0)';
    ctx.fillRect(0, 0, 640, 640);

    const imageData = ctx.getImageData(0, 0, 640, 640);
    console.log(`Input image: ${imageData.width}x${imageData.height}`);
    console.log(`Pixel count: ${imageData.data.length / 4}`);

    // Test preprocessing
    const detector = new OnnxRooftopDetector();
    const tensor = (detector as any).preprocessImage(imageData);

    console.log(`\nTensor shape: ${tensor.dims.join(' x ')}`);
    console.log(`Tensor size: ${tensor.data.length}`);
    console.log(`Expected size: ${1 * 3 * 640 * 640} = ${1 * 3 * 640 * 640}`);

    // Verify NCHW format
    const data = tensor.data as Float32Array;
    const sampleR = data[0]; // First pixel R channel
    const sampleG = data[640 * 640]; // First pixel G channel
    const sampleB = data[640 * 640 * 2]; // First pixel B channel

    console.log(`\nSample pixel (should be [1.0, 0.0, 0.0] for red):`);
    console.log(`R: ${sampleR.toFixed(4)}`);
    console.log(`G: ${sampleG.toFixed(4)}`);
    console.log(`B: ${sampleB.toFixed(4)}`);

    if (Math.abs(sampleR - 1.0) < 0.01 &&
        Math.abs(sampleG - 0.0) < 0.01 &&
        Math.abs(sampleB - 0.0) < 0.01) {
        console.log('\n✅ Preprocessing test PASSED');
    } else {
        console.log('\n❌ Preprocessing test FAILED');
    }
}

testPreprocessing();
```

---

### Test NMS Algorithm

Create `tests/test-nms.ts`:

```typescript
// test-nms.ts

import { OnnxRooftopDetector, Detection } from '../src/onnx-detector';

function testNMS() {
    console.log('=== NMS Test ===\n');

    const detector = new OnnxRooftopDetector();

    // Create overlapping detections
    const detections: Detection[] = [
        { bbox: [100, 100, 50, 50], score: 0.9, class: 0, label: 'rooftop' },
        { bbox: [105, 105, 50, 50], score: 0.85, class: 0, label: 'rooftop' }, // Overlaps with first
        { bbox: [200, 200, 60, 60], score: 0.95, class: 0, label: 'rooftop' },
        { bbox: [110, 110, 50, 50], score: 0.8, class: 0, label: 'rooftop' }, // Overlaps with first
        { bbox: [300, 300, 40, 40], score: 0.7, class: 0, label: 'rooftop' },
    ];

    console.log(`Input: ${detections.length} detections`);
    detections.forEach((det, i) => {
        console.log(`  ${i + 1}. [${det.bbox.join(', ')}] score=${det.score}`);
    });

    // Apply NMS
    const filtered = (detector as any).nms(detections);

    console.log(`\nOutput: ${filtered.length} detections after NMS`);
    filtered.forEach((det, i) => {
        console.log(`  ${i + 1}. [${det.bbox.join(', ')}] score=${det.score}`);
    });

    // Verify: Should keep highest scoring detection in each cluster
    const expectedCount = 3; // One from [100,100] cluster, one at [200,200], one at [300,300]
    if (filtered.length === expectedCount) {
        console.log(`\n✅ NMS test PASSED (expected ${expectedCount}, got ${filtered.length})`);
    } else {
        console.log(`\n❌ NMS test FAILED (expected ${expectedCount}, got ${filtered.length})`);
    }
}

testNMS();
```

---

## Integration Testing

### Test Full Detection Pipeline

Create `tests/test-full-pipeline.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Full Pipeline Test</title>
</head>
<body>
    <h1>Full Detection Pipeline Test</h1>
    <canvas id="testCanvas" width="640" height="640"></canvas>
    <div id="status">Initializing...</div>
    <pre id="log"></pre>

    <script type="module">
        import { OnnxRooftopDetector } from '../build/scripts/onnx-detector.js';

        const canvas = document.getElementById('testCanvas');
        const ctx = canvas.getContext('2d');
        const log = document.getElementById('log');
        const status = document.getElementById('status');

        function addLog(message) {
            log.textContent += `${message}\n`;
            console.log(message);
        }

        async function runFullTest() {
            try {
                // Draw test image with rectangles (simulating rooftops)
                addLog('Creating test image with rooftop-like shapes...');
                ctx.fillStyle = '#87CEEB'; // Sky blue background
                ctx.fillRect(0, 0, 640, 640);

                // Draw "rooftops"
                ctx.fillStyle = '#8B4513'; // Brown
                ctx.fillRect(100, 100, 150, 120);
                ctx.fillRect(300, 200, 180, 140);
                ctx.fillRect(150, 400, 200, 160);

                const imageData = ctx.getImageData(0, 0, 640, 640);
                addLog(`✅ Test image created (${imageData.width}x${imageData.height})`);

                // Load detector
                addLog('\nLoading ONNX detector...');
                const detector = new OnnxRooftopDetector('../model/rooftop-detector.onnx');
                await detector.loadModel();
                addLog('✅ Detector loaded');

                // Run detection
                addLog('\nRunning detection...');
                const startTime = performance.now();
                const detections = await detector.detect(imageData);
                const endTime = performance.now();

                addLog(`✅ Detection complete in ${(endTime - startTime).toFixed(2)}ms`);
                addLog(`Found ${detections.length} rooftop(s)`);

                // Display detections
                detections.forEach((det, i) => {
                    const [x, y, w, h] = det.bbox;
                    addLog(`  ${i + 1}. Position: (${x.toFixed(0)}, ${y.toFixed(0)}), ` +
                           `Size: ${w.toFixed(0)}x${h.toFixed(0)}, ` +
                           `Confidence: ${(det.score * 100).toFixed(1)}%`);

                    // Draw detection on canvas
                    ctx.strokeStyle = '#00ff00';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(x - w/2, y - h/2, w, h);
                });

                status.textContent = `✅ Test complete! Found ${detections.length} rooftop(s)`;
                status.style.color = 'green';

            } catch (error) {
                addLog(`\n❌ Test failed: ${error.message}`);
                addLog(error.stack);
                status.textContent = '❌ Test failed';
                status.style.color = 'red';
            }
        }

        runFullTest();
    </script>
</body>
</html>
```

---

## E2E Testing

### Test Extension in Browser

**Manual Test Procedure:**

1. **Load Extension**
```bash
# Build extension
cd ~/Board-Explorer
npm run build

# Load in Chrome
# 1. chrome://extensions/
# 2. Developer mode ON
# 3. Load unpacked: build/
```

2. **Test on Real Websites**

Navigate to these test sites:

| Website | Expected Detections | Notes |
|---------|---------------------|-------|
| Google Maps (satellite view) | 5-20 rooftops | Zoom into residential area |
| Zillow.com (aerial photos) | 1-5 rooftops | Property listings with aerial views |
| Google Earth | 10-50 rooftops | Zoom into cities |
| Real estate sites | 1-10 rooftops | Aerial property photos |

3. **Run Detection Tests**

For each website:
- [ ] Click extension icon
- [ ] Click "Detect Once"
- [ ] Grant screen capture permission
- [ ] Verify green boxes appear over rooftops
- [ ] Check detection count in popup
- [ ] Verify inference time <100ms
- [ ] Click "Clear Overlays"
- [ ] Verify boxes disappear

4. **Test Continuous Mode**
- [ ] Click "Start Detection"
- [ ] Scroll page
- [ ] Verify detections update every 2s
- [ ] Click "Stop Detection"
- [ ] Verify updates stop

5. **Test Confidence Threshold**
- [ ] Set slider to 10%
- [ ] Run detection → More detections
- [ ] Set slider to 80%
- [ ] Run detection → Fewer detections

---

## Performance Testing

### Benchmark Script

Create `tests/benchmark.ts`:

```typescript
// benchmark.ts

import { OnnxRooftopDetector } from '../src/onnx-detector';

interface BenchmarkResult {
    min: number;
    max: number;
    avg: number;
    median: number;
}

async function benchmark() {
    console.log('=== Performance Benchmark ===\n');

    // Create test image
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 640;
    const ctx = canvas.getContext('2d')!;

    // Load test image or create synthetic one
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, 640, 640);
    ctx.fillStyle = '#8B4513';
    for (let i = 0; i < 10; i++) {
        const x = Math.random() * 500;
        const y = Math.random() * 500;
        const w = 50 + Math.random() * 100;
        const h = 50 + Math.random() * 100;
        ctx.fillRect(x, y, w, h);
    }

    const imageData = ctx.getImageData(0, 0, 640, 640);

    // Load detector
    console.log('Loading detector...');
    const detector = new OnnxRooftopDetector();
    await detector.loadModel();
    console.log('✅ Loaded\n');

    // Warm-up runs
    console.log('Warming up (5 runs)...');
    for (let i = 0; i < 5; i++) {
        await detector.detect(imageData);
    }
    console.log('✅ Warm-up complete\n');

    // Benchmark runs
    console.log('Running benchmark (50 iterations)...');
    const times: number[] = [];

    for (let i = 0; i < 50; i++) {
        const start = performance.now();
        await detector.detect(imageData);
        const end = performance.now();
        times.push(end - start);

        if ((i + 1) % 10 === 0) {
            console.log(`  ${i + 1}/50 completed...`);
        }
    }

    // Calculate statistics
    times.sort((a, b) => a - b);
    const result: BenchmarkResult = {
        min: times[0],
        max: times[times.length - 1],
        avg: times.reduce((a, b) => a + b, 0) / times.length,
        median: times[Math.floor(times.length / 2)]
    };

    console.log('\n=== Results ===');
    console.log(`Min:    ${result.min.toFixed(2)}ms`);
    console.log(`Max:    ${result.max.toFixed(2)}ms`);
    console.log(`Avg:    ${result.avg.toFixed(2)}ms`);
    console.log(`Median: ${result.median.toFixed(2)}ms`);

    // Performance rating
    console.log('\n=== Performance Rating ===');
    if (result.avg < 20) {
        console.log('⭐⭐⭐⭐⭐ Excellent!');
    } else if (result.avg < 50) {
        console.log('⭐⭐⭐⭐ Very Good');
    } else if (result.avg < 100) {
        console.log('⭐⭐⭐ Good');
    } else {
        console.log('⭐⭐ Needs Optimization');
    }
}

benchmark();
```

---

## Debugging Tools

### Chrome DevTools Setup

**Background Script Debugging:**
```
1. chrome://extensions/
2. Find "Rooftop Detector"
3. Click "service worker" link
4. DevTools opens for background script
5. Set breakpoints in background.ts
```

**Content Script Debugging:**
```
1. Navigate to test page
2. Press F12 (open DevTools)
3. Go to Sources tab
4. Find "content-script.js" in tree
5. Set breakpoints
```

**Popup Debugging:**
```
1. Right-click extension icon
2. Select "Inspect popup"
3. DevTools opens for popup
4. Debug popup.ts
```

### Logging Utility

Create `src/logger.ts`:

```typescript
// logger.ts

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

class Logger {
    private level: LogLevel = LogLevel.INFO;
    private prefix: string;

    constructor(prefix: string) {
        this.prefix = prefix;
    }

    setLevel(level: LogLevel) {
        this.level = level;
    }

    debug(message: string, ...args: any[]) {
        if (this.level <= LogLevel.DEBUG) {
            console.debug(`[${this.prefix}] ${message}`, ...args);
        }
    }

    info(message: string, ...args: any[]) {
        if (this.level <= LogLevel.INFO) {
            console.log(`[${this.prefix}] ${message}`, ...args);
        }
    }

    warn(message: string, ...args: any[]) {
        if (this.level <= LogLevel.WARN) {
            console.warn(`[${this.prefix}] ${message}`, ...args);
        }
    }

    error(message: string, ...args: any[]) {
        if (this.level <= LogLevel.ERROR) {
            console.error(`[${this.prefix}] ${message}`, ...args);
        }
    }

    time(label: string) {
        console.time(`[${this.prefix}] ${label}`);
    }

    timeEnd(label: string) {
        console.timeEnd(`[${this.prefix}] ${label}`);
    }
}

export const detectorLogger = new Logger('Detector');
export const backgroundLogger = new Logger('Background');
export const contentLogger = new Logger('Content');
export const popupLogger = new Logger('Popup');
```

---

## Common Issues

### Issue 1: Model Won't Load

**Symptoms:**
- Status stuck on "Loading Model..."
- Console error: "Failed to fetch"

**Debugging:**
```javascript
// In background.ts, add logging
console.log('Model path:', chrome.runtime.getURL('model/rooftop-detector.onnx'));

// Check if file exists
fetch(chrome.runtime.getURL('model/rooftop-detector.onnx'))
    .then(r => console.log('Model fetch OK:', r.ok))
    .catch(e => console.error('Model fetch failed:', e));
```

**Solutions:**
1. Verify model file exists: `ls build/model/rooftop-detector.onnx`
2. Check manifest.json web_accessible_resources
3. Reload extension
4. Check model file size (should be 5-10MB)

---

### Issue 2: No Detections Appear

**Symptoms:**
- Detection runs but no boxes appear
- Stats show 0 detections

**Debugging:**
```typescript
// In onnx-detector.ts postprocess()
console.log('Raw output shape:', output.dims);
console.log('Raw output data (first 10):', output.data.slice(0, 10));
console.log('Detections before NMS:', detections.length);
console.log('Detections after NMS:', filtered.length);
```

**Solutions:**
1. Lower confidence threshold to 0.1
2. Verify model was trained correctly
3. Check if rooftops are actually visible in captured frame
4. Test with known good rooftop image

---

### Issue 3: Slow Inference

**Symptoms:**
- Inference time >100ms
- UI lags during detection

**Debugging:**
```typescript
// Add detailed timing
console.time('preprocess');
const tensor = this.preprocessImage(imageData);
console.timeEnd('preprocess');

console.time('inference');
const results = await this.session.run(feeds);
console.timeEnd('inference');

console.time('postprocess');
const detections = this.postprocess(output, width, height);
console.timeEnd('postprocess');
```

**Solutions:**
1. Enable WebGPU: `executionProviders: ['webgpu', 'webgl', 'wasm']`
2. Reduce image size before inference
3. Use quantized model (INT8)
4. Check if GPU is being used: Look for "Using execution provider: webgpu" in console

---

### Issue 4: Memory Leak

**Symptoms:**
- Memory usage grows over time
- Extension becomes slow after extended use

**Debugging:**
```
1. Open chrome://extensions/
2. Click "service worker" for extension
3. Go to Memory tab
4. Take heap snapshot
5. Run detection 10 times
6. Take another snapshot
7. Compare snapshots for leaks
```

**Solutions:**
1. Dispose tensors after use
2. Clear detection overlays regularly
3. Limit detection history
4. Add cleanup in dispose() method

---

## Test Websites

### Best Sites for Testing

1. **Google Maps (Satellite View)**
   - URL: https://www.google.com/maps
   - Switch to Satellite view
   - Zoom into residential areas
   - Expected: 10-50 rooftops per screen

2. **Zillow Property Listings**
   - URL: https://www.zillow.com
   - Search for properties
   - Look for aerial photos
   - Expected: 1-5 rooftops per listing

3. **Google Earth**
   - URL: https://earth.google.com
   - Navigate to cities
   - Tilt view to see rooftops
   - Expected: 20-100 rooftops

4. **Real Estate Sites**
   - Realtor.com, Redfin, etc.
   - Property detail pages with aerial photos
   - Expected: 1-10 rooftops

5. **Satellite Imagery Sites**
   - NASA Worldview
   - Sentinel Hub
   - Expected: Many rooftops in urban areas

---

## Automated Testing (Optional)

### Setup Playwright Tests

```bash
npm install --save-dev @playwright/test
```

Create `tests/e2e/extension.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Rooftop Detector Extension', () => {
    test('loads extension and detects rooftops', async ({ page, context }) => {
        // Load extension
        const extensionPath = './build';
        await context.addInitScript({ path: extensionPath });

        // Navigate to test page
        await page.goto('https://www.google.com/maps');

        // Wait for model to load
        await page.waitForTimeout(3000);

        // Click extension icon (this part depends on your setup)
        // ...

        // Run detection
        // ...

        // Verify detections appear
        const overlays = await page.locator('.rooftop-detection-box').count();
        expect(overlays).toBeGreaterThan(0);
    });
});
```

---

## Test Report Template

After testing, document results:

```markdown
# Test Report - Rooftop Detector v2.0

## Test Date: YYYY-MM-DD
## Tester: Your Name

### Environment
- OS: Windows 10 / macOS / Linux
- Chrome Version: 113.x
- Hardware: CPU, GPU specs

### Unit Tests
- [ ] Model Loading: PASS/FAIL
- [ ] Preprocessing: PASS/FAIL
- [ ] NMS Algorithm: PASS/FAIL

### Integration Tests
- [ ] Full Pipeline: PASS/FAIL
- [ ] Detection Accuracy: XX%

### E2E Tests
| Website | Detections | Inference Time | Result |
|---------|------------|----------------|--------|
| Google Maps | 15 | 35ms | PASS |
| Zillow | 3 | 28ms | PASS |
| ... | ... | ... | ... |

### Performance
- Average Inference: XXms
- Memory Usage: XXX MB
- CPU Usage: XX%

### Issues Found
1. Issue description
2. ...

### Recommendations
- ...
```

---

## Next Steps

✅ **Testing procedures documented!**

**Next:** Proceed to deployment guide for Chrome Web Store submission.
