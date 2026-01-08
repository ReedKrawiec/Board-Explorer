# Phase 2: Training YOLO11 on Rooftop Dataset

## Overview
Train YOLO11 nano model on your synthetic rooftop dataset for optimal browser performance. This guide covers installation, training, validation, and export.

---

## Prerequisites

✅ Completed Phase 1: Dataset generated at `~/workspace/DaMa/output/rooftop_dataset/`
✅ 10,000+ labeled rooftop images
✅ Python 3.8+ installed
✅ (Optional) NVIDIA GPU with CUDA for faster training

---

## Step 1: Environment Setup

### 1.1 Create Training Environment

```bash
# Navigate to your workspace
cd ~/workspace

# Create new directory for training
mkdir yolo11_rooftop_training
cd yolo11_rooftop_training

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 1.2 Install Ultralytics

```bash
# Install latest ultralytics package (includes YOLO11)
pip install ultralytics

# Install additional dependencies
pip install torch torchvision  # PyTorch (CPU version)

# For GPU support (if you have NVIDIA GPU):
# pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Verify installation
yolo version
# Should output: Ultralytics YOLO11.x.x

# Test YOLO
python3 -c "from ultralytics import YOLO; print('YOLO11 ready!')"
```

### 1.3 Verify Dataset

```bash
# Check dataset structure
ls ~/workspace/DaMa/output/rooftop_dataset/

# Should see:
# train/images/  train/labels/  val/images/  val/labels/  rooftop.yaml

# Count images
echo "Training images: $(ls ~/workspace/DaMa/output/rooftop_dataset/train/images/*.jpg | wc -l)"
echo "Validation images: $(ls ~/workspace/DaMa/output/rooftop_dataset/val/images/*.jpg | wc -l)"
```

---

## Step 2: Create Training Script

### 2.1 Create `train_yolo11.py`

```python
# train_yolo11.py

from ultralytics import YOLO
import torch
import os
from pathlib import Path

def train_rooftop_detector():
    """
    Train YOLO11 nano model for rooftop detection.
    Optimized for browser inference.
    """

    # Configuration
    CONFIG = {
        'model': 'yolo11n.pt',  # Nano model (smallest, fastest)
        'data': str(Path.home() / 'workspace/DaMa/output/rooftop_dataset/rooftop.yaml'),
        'epochs': 100,
        'imgsz': 640,  # Image size
        'batch': 16,   # Batch size (adjust based on GPU memory)
        'device': 'cpu',  # 'cpu' or '0' for GPU, 'mps' for Mac M1/M2
        'workers': 4,
        'patience': 50,  # Early stopping patience
        'save': True,
        'save_period': 10,  # Save checkpoint every 10 epochs
        'cache': False,  # Set to True to cache images in RAM (faster but uses more memory)
        'optimizer': 'AdamW',
        'lr0': 0.001,  # Initial learning rate
        'lrf': 0.01,   # Final learning rate (lr0 * lrf)
        'momentum': 0.937,
        'weight_decay': 0.0005,
        'warmup_epochs': 3,
        'project': 'runs/rooftop',
        'name': 'yolo11n_rooftop',
        'exist_ok': False,
        'pretrained': True,
        'verbose': True,
    }

    # Check device
    device = CONFIG['device']
    if device != 'cpu':
        if torch.cuda.is_available():
            device = '0'
            print(f"✅ Using GPU: {torch.cuda.get_device_name(0)}")
        elif torch.backends.mps.is_available():
            device = 'mps'
            print("✅ Using Mac MPS (Metal)")
        else:
            device = 'cpu'
            print("⚠️  No GPU detected, using CPU (training will be slower)")
    else:
        print("ℹ️  Using CPU for training")

    CONFIG['device'] = device

    # Adjust batch size based on device
    if device == 'cpu':
        CONFIG['batch'] = 8  # Smaller batch for CPU
        print("ℹ️  Reduced batch size to 8 for CPU training")

    # Load model
    print("\n" + "="*50)
    print("Loading YOLO11 Nano model...")
    print("="*50)
    model = YOLO(CONFIG['model'])

    # Print model summary
    print(f"\nModel: {CONFIG['model']}")
    print(f"Parameters: {sum(p.numel() for p in model.model.parameters()):,}")

    # Check if dataset exists
    if not os.path.exists(CONFIG['data']):
        raise FileNotFoundError(f"Dataset YAML not found: {CONFIG['data']}")

    print(f"\nDataset: {CONFIG['data']}")

    # Start training
    print("\n" + "="*50)
    print("Starting training...")
    print("="*50)
    print(f"Epochs: {CONFIG['epochs']}")
    print(f"Image size: {CONFIG['imgsz']}")
    print(f"Batch size: {CONFIG['batch']}")
    print(f"Device: {CONFIG['device']}")
    print("="*50 + "\n")

    # Train the model
    results = model.train(
        data=CONFIG['data'],
        epochs=CONFIG['epochs'],
        imgsz=CONFIG['imgsz'],
        batch=CONFIG['batch'],
        device=CONFIG['device'],
        workers=CONFIG['workers'],
        patience=CONFIG['patience'],
        save=CONFIG['save'],
        save_period=CONFIG['save_period'],
        cache=CONFIG['cache'],
        optimizer=CONFIG['optimizer'],
        lr0=CONFIG['lr0'],
        lrf=CONFIG['lrf'],
        momentum=CONFIG['momentum'],
        weight_decay=CONFIG['weight_decay'],
        warmup_epochs=CONFIG['warmup_epochs'],
        project=CONFIG['project'],
        name=CONFIG['name'],
        exist_ok=CONFIG['exist_ok'],
        pretrained=CONFIG['pretrained'],
        verbose=CONFIG['verbose'],
    )

    print("\n" + "="*50)
    print("✅ Training completed!")
    print("="*50)

    # Print results location
    results_dir = Path(CONFIG['project']) / CONFIG['name']
    print(f"\nResults saved to: {results_dir}")
    print(f"Best weights: {results_dir / 'weights/best.pt'}")
    print(f"Last weights: {results_dir / 'weights/last.pt'}")

    # Print final metrics
    print("\n" + "="*50)
    print("Final Metrics:")
    print("="*50)
    metrics = model.val()  # Run validation on best model
    print(f"mAP50: {metrics.box.map50:.4f}")
    print(f"mAP50-95: {metrics.box.map:.4f}")
    print(f"Precision: {metrics.box.p:.4f}")
    print(f"Recall: {metrics.box.r:.4f}")

    return results_dir


if __name__ == "__main__":
    print("\n" + "="*50)
    print("YOLO11 Rooftop Detector Training")
    print("="*50 + "\n")

    try:
        results_dir = train_rooftop_detector()
        print(f"\n✅ Training successful! Results: {results_dir}")
    except Exception as e:
        print(f"\n❌ Training failed: {e}")
        raise
```

### 2.2 Create Quick Start Script

```python
# quick_train.py
# Simplified version for quick testing

from ultralytics import YOLO
from pathlib import Path

# Quick configuration
MODEL = 'yolo11n.pt'
DATA = str(Path.home() / 'workspace/DaMa/output/rooftop_dataset/rooftop.yaml')
EPOCHS = 100
IMGSZ = 640

# Load and train
print("Loading YOLO11n...")
model = YOLO(MODEL)

print(f"Training for {EPOCHS} epochs...")
model.train(
    data=DATA,
    epochs=EPOCHS,
    imgsz=IMGSZ,
    batch=16,
    device='cpu',  # Change to '0' for GPU
    project='runs/rooftop',
    name='quick_train'
)

print("✅ Done! Check runs/rooftop/quick_train/")
```

---

## Step 3: Train the Model

### 3.1 Start Training

```bash
# Activate environment
source venv/bin/activate

# Run training
python3 train_yolo11.py

# This will take:
# - With GPU: 1-2 hours
# - With CPU: 4-8 hours
```

### 3.2 Monitor Training Progress

Training will display real-time metrics:

```
Epoch    GPU_mem   box_loss   cls_loss   dfl_loss  Instances       Size
  1/100      0.0G     1.234      0.567      1.123         45        640
  2/100      0.0G     1.156      0.498      1.089         52        640
  ...
```

**Key metrics to watch:**
- **box_loss**: Bounding box regression loss (should decrease)
- **cls_loss**: Classification loss (should decrease)
- **dfl_loss**: Distribution focal loss (should decrease)
- **mAP50**: Mean average precision at IoU=0.5 (should increase)
- **mAP50-95**: mAP across IoU thresholds 0.5-0.95 (should increase)

### 3.3 View Training Progress

Training generates real-time plots:

```bash
# Open results directory
cd runs/rooftop/yolo11n_rooftop

# View training curves
open results.png  # Mac
xdg-open results.png  # Linux
start results.png  # Windows
```

**Plots include:**
- Loss curves (box, cls, dfl)
- mAP curves
- Precision/Recall curves
- Confusion matrix
- Prediction examples

### 3.4 TensorBoard (Optional)

```bash
# Install tensorboard
pip install tensorboard

# Launch tensorboard
tensorboard --logdir runs/rooftop

# Open browser: http://localhost:6006
```

---

## Step 4: Validate the Model

### 4.1 Run Validation

```bash
# Validate best model
yolo detect val model=runs/rooftop/yolo11n_rooftop/weights/best.pt data=~/workspace/DaMa/output/rooftop_dataset/rooftop.yaml

# This will output:
# mAP50: 0.XXX
# mAP50-95: 0.XXX
# Precision: 0.XXX
# Recall: 0.XXX
```

### 4.2 Create Validation Script

```python
# validate.py

from ultralytics import YOLO
from pathlib import Path

# Load trained model
model_path = 'runs/rooftop/yolo11n_rooftop/weights/best.pt'
data_yaml = str(Path.home() / 'workspace/DaMa/output/rooftop_dataset/rooftop.yaml')

print(f"Loading model: {model_path}")
model = YOLO(model_path)

print("Running validation...")
metrics = model.val(data=data_yaml)

print("\n" + "="*50)
print("Validation Results:")
print("="*50)
print(f"mAP50: {metrics.box.map50:.4f}")
print(f"mAP50-95: {metrics.box.map:.4f}")
print(f"Precision: {metrics.box.p:.4f}")
print(f"Recall: {metrics.box.r:.4f}")
print(f"F1 Score: {(2 * metrics.box.p * metrics.box.r / (metrics.box.p + metrics.box.r)):.4f}")
print("="*50)
```

### 4.3 Test on Sample Images

```python
# test_inference.py

from ultralytics import YOLO
from pathlib import Path
import glob

# Load model
model = YOLO('runs/rooftop/yolo11n_rooftop/weights/best.pt')

# Get test images
test_images = glob.glob(str(Path.home() / 'workspace/DaMa/output/rooftop_dataset/val/images/*.jpg'))[:10]

print(f"Testing on {len(test_images)} images...")

# Run inference
results = model.predict(test_images, save=True, conf=0.25)

print(f"\n✅ Predictions saved to: runs/detect/predict/")

# Print results
for i, result in enumerate(results):
    boxes = result.boxes
    print(f"Image {i+1}: Detected {len(boxes)} rooftop(s)")
```

---

## Step 5: Export Model for Browser

### 5.1 Export to ONNX (Recommended)

```python
# export_onnx.py

from ultralytics import YOLO

# Load trained model
model = YOLO('runs/rooftop/yolo11n_rooftop/weights/best.pt')

print("Exporting to ONNX...")
model.export(
    format='onnx',
    imgsz=640,
    simplify=True,  # Simplify ONNX model
    opset=12,       # ONNX opset version
    dynamic=False,  # Static input shape for browser
)

print("✅ ONNX export complete!")
print("Model saved as: runs/rooftop/yolo11n_rooftop/weights/best.onnx")
```

### 5.2 Export to TensorFlow.js (Alternative)

```python
# export_tfjs.py

from ultralytics import YOLO

# Load trained model
model = YOLO('runs/rooftop/yolo11n_rooftop/weights/best.pt')

print("Exporting to TensorFlow.js...")
model.export(
    format='tfjs',
    imgsz=640,
)

print("✅ TF.js export complete!")
print("Model saved in: runs/rooftop/yolo11n_rooftop/weights/best_web_model/")
```

### 5.3 Verify Exported Model

```bash
# Check ONNX model size
ls -lh runs/rooftop/yolo11n_rooftop/weights/best.onnx

# Should be ~5-10 MB (perfect for browser!)

# Test ONNX model
python3 << EOF
from ultralytics import YOLO
model = YOLO('runs/rooftop/yolo11n_rooftop/weights/best.onnx')
print("✅ ONNX model loads successfully!")
EOF
```

---

## Step 6: Optimize Model (Optional)

### 6.1 Quantize Model

Reduce model size further with quantization:

```python
# quantize_model.py

from ultralytics import YOLO

model = YOLO('runs/rooftop/yolo11n_rooftop/weights/best.pt')

# Export with INT8 quantization
print("Exporting with INT8 quantization...")
model.export(
    format='onnx',
    imgsz=640,
    simplify=True,
    int8=True,  # INT8 quantization
)

print("✅ Quantized model saved!")
print("Size reduction: ~50-60%")
```

### 6.2 Test Smaller Image Sizes

For even faster browser inference:

```python
# Export with smaller image size
model = YOLO('runs/rooftop/yolo11n_rooftop/weights/best.pt')

for size in [416, 320]:
    print(f"Exporting for imgsz={size}...")
    model.export(
        format='onnx',
        imgsz=size,
        simplify=True,
    )
    # Rename file
    import shutil
    shutil.move(
        'runs/rooftop/yolo11n_rooftop/weights/best.onnx',
        f'runs/rooftop/yolo11n_rooftop/weights/best_{size}.onnx'
    )
```

---

## Expected Results

### Training Metrics (Target)

After 100 epochs, you should see:

| Metric | Target | Excellent |
|--------|--------|-----------|
| mAP50 | > 0.85 | > 0.92 |
| mAP50-95 | > 0.60 | > 0.70 |
| Precision | > 0.80 | > 0.90 |
| Recall | > 0.75 | > 0.85 |

### Model Specs

- **Model size (PT)**: ~5 MB
- **Model size (ONNX)**: ~5-6 MB
- **Model size (ONNX INT8)**: ~3-4 MB
- **Parameters**: ~2.5M
- **Training time (GPU)**: 1-2 hours
- **Training time (CPU)**: 4-8 hours

### Inference Performance

- **CPU inference**: 15-30ms per image
- **GPU inference**: 2-5ms per image
- **Browser (WASM)**: 20-50ms per image
- **Browser (WebGPU)**: 5-15ms per image

---

## Troubleshooting

### Issue: Low mAP (<0.6)

**Solutions:**
1. Train for more epochs (150-200)
2. Increase dataset size (add more synthetic variations)
3. Add real rooftop images to training set
4. Adjust learning rate: Try `lr0=0.01` or `lr0=0.0001`
5. Use data augmentation

### Issue: Overfitting (train mAP >> val mAP)

**Solutions:**
1. Add more validation data
2. Increase dropout
3. Use weight decay: `weight_decay=0.001`
4. Early stopping (already enabled)
5. Data augmentation

### Issue: Training is slow

**Solutions:**
1. Use GPU if available
2. Reduce batch size: `batch=8`
3. Enable caching: `cache=True`
4. Reduce workers: `workers=2`
5. Use smaller image size: `imgsz=416`

### Issue: Out of memory

**Solutions:**
1. Reduce batch size: `batch=4` or `batch=8`
2. Reduce image size: `imgsz=416`
3. Disable caching: `cache=False`
4. Close other applications

### Issue: Model doesn't detect rooftops

**Solutions:**
1. Check confidence threshold (try `conf=0.1`)
2. Visualize predictions: Use `model.predict(save=True)`
3. Check if dataset labels are correct
4. Retrain with more varied data

---

## File Structure After Training

```
~/workspace/yolo11_rooftop_training/
├── venv/
├── train_yolo11.py
├── quick_train.py
├── validate.py
├── test_inference.py
├── export_onnx.py
└── runs/
    └── rooftop/
        └── yolo11n_rooftop/
            ├── weights/
            │   ├── best.pt         # Best model weights
            │   ├── last.pt         # Last epoch weights
            │   └── best.onnx       # ONNX export for browser
            ├── results.png         # Training curves
            ├── confusion_matrix.png
            ├── F1_curve.png
            ├── P_curve.png
            ├── R_curve.png
            ├── PR_curve.png
            └── args.yaml           # Training arguments
```

---

## Next Steps

✅ **Your YOLO11 rooftop detector is trained and exported!**

**Model location:** `runs/rooftop/yolo11n_rooftop/weights/best.onnx`

**Next:** Proceed to [PHASE3_BROWSER_INTEGRATION.md](PHASE3_BROWSER_INTEGRATION.md) to integrate the model into your Chrome extension.

---

## Quick Reference Commands

```bash
# Train
python3 train_yolo11.py

# Validate
python3 validate.py

# Export to ONNX
python3 export_onnx.py

# Test inference
python3 test_inference.py

# View results
open runs/rooftop/yolo11n_rooftop/results.png
```
