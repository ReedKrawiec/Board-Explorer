# YOLO v2 Rooftop Detection with WASM - Research Summary

## Executive Summary

This document summarizes research for transitioning Board Explorer from chess board detection (YOLOv5) to rooftop detection using the latest YOLO models, synthetic data generation with DaMa, and browser-based inference via WebAssembly.

---

## 1. Latest YOLO Models for Rooftop Detection

### Recommended Model: YOLOv11 (2024) or YOLOv12 (2025)

**YOLOv11 (Ultralytics)**
- Released in 2024 as the latest stable version
- **Key advantages**: More accurate than YOLOv8 under similar latency budgets
- **Better for**: Small-object detection and moderately dense scenes (ideal for rooftop detection)
- **More stable** under transfer and domain shift
- **Performance**: Improved architecture and training methods

**YOLOv12 (Latest - Feb 2025)**
- State-of-the-art released February 18, 2025
- **New features**:
  - Attention-based design with Area Attention (A²)
  - Residual ELAN blocks
  - FlashAttention
- **Higher mAP** at all scales while maintaining/improving inference latency

**YOLOv10 (Alternative)**
- Released May 2024 (NeurIPS 2024)
- **Key innovation**: Removes need for NMS (non-maximum suppression)
- **Advantage**: Faster real-time inference
- From Tsinghua University researchers

### Rooftop/Solar Panel Detection Performance

Recent research shows excellent YOLO performance on rooftop solar panel detection:

- **YOLOv11-X**: 89.7% precision, 87.7% recall, 92.7% mAP, 90% F1 score
- **YOLOv11**: 93.4% mAP@0.5 for defect detection (balanced performance)
- **YOLOv5**: 7.1ms inference time, 94.1% precision (still fast!)

### Training Datasets Used in Research

Successful rooftop detection models were trained on:
- **Dataset sizes**: 2,100 - 6,079 images (with augmentation)
- **Split ratios**: 70/10/20 or 85/15 (train/val/test)
- **Image types**:
  - Thermal images (200×160 pixels for defects)
  - Optical/aerial images (244×244 pixels)
  - Satellite imagery for rooftop detection
- **Available dataset**: Roboflow Universe has open-source solar panel datasets

---

## 2. DaMa Library for Synthetic Data Generation

### Overview
**DaMa** (by ReedKrawiec) is the library already used in Board Explorer v1!
- Python-based synthetic data generation tool
- Specifically designed for YOLO object detection training data
- Already proven: Generated the 8000+ image dataset for current chess board model

### Repository
- GitHub: https://github.com/ReedKrawiec/DaMa
- License: GPL-3.0
- Language: 100% Python

### How It Works

**Core functionality**: Create providers that generate Pillow images and annotations

**Annotation format**: YOLO standard
```
(class_index, x, y, width, height)
```
Where x, y = center coordinates

### Usage

**Basic execution**:
```bash
python3 dama.py
```

**With visual annotation boxes** (for debugging):
```bash
python3 dama.py --draw-labels
```

### Configuration

**Setup**:
1. Edit `dama.json` for all settings
2. Reference `providers/example` directory for implementation patterns
3. Create custom provider for rooftop images

**Dependencies**:
- Pillow (image generation)
- See `requirements.txt` for full list

### Adapting DaMa for Rooftop Detection

To generate synthetic rooftop data, you would:

1. **Create a rooftop provider** (similar to the chess board provider)
2. **Configure in dama.json**:
   - Rooftop shapes (rectangular, L-shaped, etc.)
   - Colors (various roof materials)
   - Viewing angles (aerial/satellite perspective)
   - Lighting conditions
   - Background variations
3. **Generate dataset**: Run to create thousands of annotated images
4. **Export**: YOLO-formatted labels ready for training

---

## 3. WASM Browser Inference

### Two Main Approaches

#### Option A: ONNX Runtime Web (Recommended)

**Advantages**:
- Most modern and actively maintained
- Better performance with WebGPU support
- Smaller bundle sizes
- Easier export from PyTorch/YOLOv11

**Technical Stack**:
- Export YOLO model to ONNX format
- Use `onnxruntime-web` npm package (v1.23.2)
- WebAssembly for CPU, WebGL/WebGPU for GPU
- No server required - fully client-side

**Backend Options**:
- **GPU**: `webgl`, `webgpu`, or `webnn` (deviceType: gpu)
- **CPU**: `wasm` or `webnn` (deviceType: cpu)

**Recent Tutorial** (July 2025):
- PyImageSearch guide: "Run YOLO Model in the Browser with ONNX, WebAssembly, and Next.js"
- Complete implementation with no backend required
- Privacy benefits - all processing client-side

**Working Examples**:
- YOLOv5 ONNX browser implementation: https://github.com/Hyuto/yolov5-onnxruntime-web
- YOLOv8 ONNX browser implementation: https://github.com/Hyuto/yolov8-onnxruntime-web

#### Option B: TensorFlow.js

**Advantages**:
- You're already using TensorFlow.js! (Current dependency: @tensorflow/tfjs ^3.12.0)
- Easier migration path from existing code
- Well-documented YOLO implementations

**Technical Stack**:
- Convert YOLO model to TensorFlow.js format
- Use tfjs with WebGL backend
- Already have the dependency installed

**Performance** (Feb 2025 benchmarks):
- **YOLOv8 nano** (6 MB, 16-bit quantized): Best for resource-limited hardware
- **YOLOv8 small** (44 MB): Higher accuracy but slower
- **Recommendation**: Models < 30 MB for optimal browser performance

**Recent Implementations**:
- YOLOv8 TensorFlow.js: https://github.com/Hyuto/yolov8-tfjs
- YOLOv7 tutorial (Nov 2025): Direct React integration, no API calls
- Real-time face detection example (Feb 2025)

**Working Demos**:
- tfjs-yolo-tiny (supports YOLOv1, v2, v3)
- https://shaqian.github.io/tfjs-yolo-demo/

### Comparison

| Feature | ONNX Runtime Web | TensorFlow.js |
|---------|------------------|---------------|
| Current usage | Not in project | Already installed! |
| Bundle size | Smaller | Larger |
| Performance | Faster (WebGPU) | Good (WebGL) |
| Migration effort | Medium | Low |
| YOLO support | Excellent | Excellent |
| Community examples | Growing | Mature |

---

## 4. Recommended Implementation Path

### Phase 1: Data Generation with DaMa
1. Clone/update DaMa repository
2. Create rooftop provider:
   - Aerial view perspective
   - Various roof types and materials
   - Different lighting/shadow conditions
   - Urban/suburban backgrounds
3. Generate 5,000-10,000 synthetic images
4. Augment with real aerial/satellite images if available

### Phase 2: Model Training
1. **Use YOLOv11** (best balance of performance and maturity)
2. Install Ultralytics: `pip install ultralytics`
3. Prepare dataset in YOLO format (DaMa outputs this!)
4. Create `rooftop.yaml` config:
```yaml
path: /path/to/dataset
train: train/images
val: val/images
names:
  0: rooftop
```
5. Train model:
```python
from ultralytics import YOLO
model = YOLO("yolo11n.pt")  # nano for browser efficiency
model.train(data="rooftop.yaml", epochs=100, imgsz=640)
```

### Phase 3: Browser Integration

**Option A: ONNX Runtime Web** (Recommended for new implementation)
1. Export trained model: `model.export(format="onnx")`
2. Install: `npm install onnxruntime-web`
3. Replace TensorFlow.js inference code
4. Use WebGPU backend for best performance

**Option B: TensorFlow.js** (Faster migration)
1. Convert model to TF.js format
2. Update existing inference code (minimal changes)
3. Keep current @tensorflow/tfjs dependency
4. Test with smaller model (< 30 MB)

### Phase 4: Extension Updates
1. Update manifest permissions if needed
2. Modify UI for rooftop detection context
3. Test screen capture with rooftop imagery
4. Optimize inference for real-time detection

---

## 5. Key Considerations

### Model Size for Browser
- **Target**: < 30 MB for optimal browser performance
- **Use**: YOLOv11n (nano) or YOLOv12n variants
- **Quantization**: 16-bit quantization can reduce size by ~50%

### Performance Expectations
- **Inference time**: 7-50ms per frame (depends on model size and backend)
- **Accuracy**: 85-95% mAP achievable for rooftop detection
- **Real-time**: 20-30 FPS possible with nano models

### Browser Compatibility
- **ONNX Runtime Web**: Modern browsers with WASM support
- **WebGPU**: Chrome 113+, Edge 113+ (best performance)
- **WebGL**: Broader compatibility fallback

---

## Sources

### YOLO Models
- [Ultralytics YOLO Evolution Overview](https://arxiv.org/html/2510.09653v2)
- [YOLOv10 Real-Time End-to-End Object Detection](https://docs.ultralytics.com/models/yolov10/)
- [YOLO Model Comparison: YOLOv11 vs Previous](https://www.ultralytics.com/blog/comparing-ultralytics-yolo11-vs-previous-yolo-models)
- [What is YOLO? The Ultimate Guide [2025]](https://blog.roboflow.com/guide-to-yolo-models/)

### Rooftop Detection
- [Detecting Defects in Solar Panels Using YOLO v10 and v11](https://www.mdpi.com/2079-9292/14/2/344)
- [Solar Panel Detection and Segmentation](https://github.com/yasaman-y/solar_panel_detection_and_segmentation)
- [Solar Panels Object Detection Dataset (Roboflow)](https://universe.roboflow.com/yolomodel-yp9un/solar-panels-4uetb)

### Training
- [Model Training with Ultralytics YOLO](https://docs.ultralytics.com/modes/train/)
- [How to: Ultralytics YOLOv11 - Training Your Own AI Model](https://www.mileshilliard.com/posts/yolo11/)
- [How to Train YOLO 11 Object Detection Models Locally](https://www.ejtech.io/learn/train-yolo-models)

### WASM/Browser Inference
- [Run YOLO Model in the Browser with ONNX, WebAssembly, and Next.js](https://pyimagesearch.com/2025/07/28/run-yolo-model-in-the-browser-with-onnx-webassembly-and-next-js/)
- [ONNX Runtime Web Tutorial](https://onnxruntime.ai/docs/tutorials/web/)
- [YOLOv5 ONNX Runtime Web](https://github.com/Hyuto/yolov5-onnxruntime-web)
- [YOLOv8 ONNX Runtime Web](https://github.com/Hyuto/yolov8-onnxruntime-web)
- [YOLOv8 TensorFlow.js](https://github.com/Hyuto/yolov8-tfjs)
- [Real-Time Face Detection Using YOLO and TensorFlow.js](https://inero-software.com/running-ai-in-client-side-real-time-face-detection-in-the-browser-using-yolo-and-tensorflow-js-use-case-study/)

---

## Next Steps

1. ✅ Research completed
2. ⬜ Set up DaMa for rooftop data generation
3. ⬜ Generate synthetic training dataset
4. ⬜ Train YOLOv11 model
5. ⬜ Export to ONNX or TF.js format
6. ⬜ Integrate browser inference
7. ⬜ Update extension UI
8. ⬜ Test and optimize
