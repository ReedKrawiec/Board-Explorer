# YOLO11 Rooftop Detection with WASM - Research Summary

## Executive Summary

This document summarizes research for transitioning Board Explorer from chess board detection (YOLOv5) to rooftop detection using **YOLO11** (the latest production-ready model as of January 2026), synthetic data generation with DaMa, and browser-based inference via WebAssembly.

**Key Recommendations:**
- ✅ **Use YOLO11** - Latest stable, production-ready model with excellent rooftop detection performance
- 🚀 **Monitor YOLO26** - Next-gen model coming Q1 2026 with 43% faster CPU inference
- 🎯 **Train YOLO11n** - Nano variant for optimal browser performance
- 🌐 **Deploy via ONNX Runtime Web** - Modern WASM solution with WebGPU support

---

## 1. Latest YOLO Models for Rooftop Detection

### Recommended Model: YOLO11 (Production-Ready Now)

**YOLO11** is the latest stable, production-ready model from Ultralytics as of January 2026.

**YOLO11 (Ultralytics - September 2024)**
- ✅ **Available NOW** - Latest stable, production-ready release
- **Key advantages**: More accurate than YOLOv8 under similar latency budgets
- **Better for**: Small-object detection and moderately dense scenes (PERFECT for rooftop detection)
- **More stable** under transfer and domain shift
- **Performance**: Improved architecture with hybrid task assignment
- **22% fewer parameters** than YOLOv8m while achieving higher mAP
- **Easy to train**: Simple Python API with excellent documentation

**Model Variants** (from smallest to largest):
- `yolo11n.pt` - Nano (best for browser/edge, recommended)
- `yolo11s.pt` - Small
- `yolo11m.pt` - Medium
- `yolo11l.pt` - Large
- `yolo11x.pt` - Extra Large

### Coming Soon: YOLO26 (Next-Generation)

**YOLO26 (Ultralytics - Announced September 2025)**
- ⚠️ **NOT YET RELEASED** - Still in training, not yet open-sourced
- Expected late Q1 2026 or when officially announced
- **Performance preview**: Up to 43% faster CPU inference than YOLO11-N
- **Key innovations**:
  - **End-to-End NMS-Free Inference** - Direct predictions, lower latency
  - **DFL Removal** - Simplified export and broader edge device support
  - **ProgLoss + STAL** - Better accuracy on small objects
  - **MuSGD Optimizer** - More stable training
- **Optimized for**: Edge and low-power devices
- Will support all YOLO11 tasks: detection, segmentation, classification, pose, OBB

**When to switch to YOLO26**: Once officially released, benchmark both YOLO11 and YOLO26 on your rooftop dataset to see which performs better for your specific use case.

### Alternative: YOLOv10 (Non-Ultralytics)

**YOLOv10 (Tsinghua University - May 2024, NeurIPS 2024)**
- Different lineage from Ultralytics (not YOLO11 predecessor)
- **Key innovation**: NMS-free architecture
- Good option if you need academic alternative
- Less ecosystem support than Ultralytics YOLO

### Rooftop/Solar Panel Detection Performance (Real-World Results)

Recent 2025 research shows excellent YOLO11 performance on rooftop solar panel detection:

- **YOLO11-X**: 89.7% precision, 87.7% recall, 92.7% mAP, 90% F1 score
- **YOLO11**: 93.4% mAP@0.5 for defect detection (balanced performance)
- **YOLO11**: Superior accuracy on small objects compared to YOLOv5 and YOLOv8
- **For comparison, YOLOv5**: 7.1ms inference time, 94.1% precision (still respectable!)

**Key takeaway**: YOLO11 delivers state-of-the-art results for rooftop detection tasks.

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

### Phase 2: Model Training with YOLO11

1. **Install Ultralytics** (latest package):
```bash
pip install ultralytics
```

2. **Prepare dataset** in YOLO format (DaMa outputs this automatically!)
   - `dataset/train/images/` - Training images
   - `dataset/train/labels/` - Training annotations
   - `dataset/val/images/` - Validation images
   - `dataset/val/labels/` - Validation annotations

3. **Create `rooftop.yaml` config**:
```yaml
path: /path/to/dataset
train: train/images
val: val/images
names:
  0: rooftop
```

4. **Train YOLO11 model**:

**Option A: Python (Recommended)**
```python
from ultralytics import YOLO

# Load pretrained YOLO11 nano model
model = YOLO("yolo11n.pt")  # nano for browser efficiency

# Train on custom rooftop dataset
results = model.train(
    data="rooftop.yaml",
    epochs=100,
    imgsz=640,
    device="cpu",  # or "0" for GPU, "mps" for Mac
    batch=16
)

# Validate the model
metrics = model.val()

# Export for browser inference
model.export(format="onnx")  # for ONNX Runtime Web
# OR
model.export(format="tfjs")  # for TensorFlow.js
```

**Option B: Command Line**
```bash
# Train
yolo detect train data=rooftop.yaml model=yolo11n.pt epochs=100 imgsz=640

# Validate
yolo detect val model=runs/detect/train/weights/best.pt

# Export
yolo export model=runs/detect/train/weights/best.pt format=onnx
```

5. **Training Tips**:
   - Start with `yolo11n.pt` (nano) for fastest browser performance
   - Use `batch=16` or `batch=32` depending on your GPU memory
   - Monitor validation mAP - stop if it plateaus
   - Try data augmentation if accuracy is low
   - Experiment with `imgsz=416` or `imgsz=320` for even smaller models

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
- **Use**: YOLO11n (nano) variant - smallest, fastest for browser
- **Quantization**: 16-bit quantization can reduce size by ~50%
- **When YOLO26 releases**: Try YOLO26n for even faster CPU inference

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

### YOLO11 & YOLO26 Models
- [Ultralytics YOLO11 Official Docs](https://docs.ultralytics.com/models/yolo11/)
- [Ultralytics YOLO26 Official Docs](https://docs.ultralytics.com/models/yolo26/)
- [YOLO26: Next-Gen Ultralytics Model for Real-Time Vision AI](https://blog.roboflow.com/yolo26/)
- [Ultralytics YOLO Evolution Overview (YOLO26, YOLO11, YOLOv8, YOLOv5)](https://arxiv.org/html/2510.09653v2)
- [YOLO Model Comparison: YOLO11 vs Previous](https://www.ultralytics.com/blog/comparing-ultralytics-yolo11-vs-previous-yolo-models)
- [What is YOLO? The Ultimate Guide [2025]](https://blog.roboflow.com/guide-to-yolo-models/)
- [YOLO11 on Hugging Face](https://huggingface.co/Ultralytics/YOLO11)
- [GitHub: Ultralytics YOLO](https://github.com/ultralytics/ultralytics)

### Rooftop Detection
- [Detecting Defects in Solar Panels Using YOLO v10 and v11](https://www.mdpi.com/2079-9292/14/2/344)
- [Solar Panel Detection and Segmentation](https://github.com/yasaman-y/solar_panel_detection_and_segmentation)
- [Solar Panels Object Detection Dataset (Roboflow)](https://universe.roboflow.com/yolomodel-yp9un/solar-panels-4uetb)
- [Comparative Performance YOLOv5, YOLOv8, YOLOv11 for Solar Panel Detection](https://www.preprints.org/manuscript/202501.0788)

### YOLO11 Training Tutorials
- [Model Training with Ultralytics YOLO](https://docs.ultralytics.com/modes/train/)
- [How to Train a YOLO11 Object Detection Model on Custom Dataset (Roboflow)](https://blog.roboflow.com/yolov11-how-to-train-custom-data/)
- [Training YOLO11 Object Detector on Custom Dataset (Medium)](https://medium.com/@estebanuri/training-yolov11-object-detector-on-a-custom-dataset-39bba09530ff)
- [YOLO11 Training Notebook (Roboflow GitHub)](https://github.com/roboflow/notebooks/blob/main/notebooks/train-yolo11-object-detection-on-custom-dataset.ipynb)
- [How to: Ultralytics YOLO11 - Training Your Own AI Model](https://www.mileshilliard.com/posts/yolo11/)
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

1. ✅ Research completed - **YOLO11 is the way to go!**
2. ⬜ Set up DaMa for rooftop data generation
3. ⬜ Create rooftop provider for DaMa (aerial view, various roof types)
4. ⬜ Generate synthetic training dataset (5,000-10,000 images)
5. ⬜ Install Ultralytics and train YOLO11n model
6. ⬜ Export to ONNX format (recommended) or TF.js
7. ⬜ Integrate ONNX Runtime Web or upgrade TensorFlow.js
8. ⬜ Update extension UI for rooftop detection
9. ⬜ Test and optimize browser inference
10. ⬜ When YOLO26 releases: Benchmark against YOLO11

**Estimated Model Performance:**
- Training time: 2-4 hours (with GPU) for 100 epochs
- Final model size: 5-10 MB (YOLO11n, quantized)
- Browser inference: 10-30ms per frame
- Expected mAP: 85-95% for rooftop detection
