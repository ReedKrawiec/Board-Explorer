# Phase 1: Synthetic Rooftop Data Generation with DaMa

## Overview
Generate 10,000+ synthetic rooftop images with YOLO annotations using your DaMa library. This will create training data for YOLO11 to detect rooftops visible in browser content (real estate sites, Google Maps, satellite imagery, etc.).

---

## Step 1: Set Up DaMa

### 1.1 Clone/Update DaMa Repository

```bash
# Navigate to your workspace
cd ~/workspace

# If you don't have DaMa yet, clone it
git clone https://github.com/ReedKrawiec/DaMa.git
cd DaMa

# If you already have it, update it
cd DaMa
git pull origin main
```

### 1.2 Install Dependencies

```bash
# Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Verify installation
python3 dama.py --help
```

---

## Step 2: Create Rooftop Provider

### 2.1 Provider Structure

Create a new provider directory:

```bash
mkdir -p providers/rooftop
cd providers/rooftop
```

### 2.2 Create `rooftop_generator.py`

This is the core provider that generates synthetic rooftop images:

```python
# providers/rooftop/rooftop_generator.py

from PIL import Image, ImageDraw
import random
import math

class RooftopProvider:
    """
    Generates synthetic aerial/satellite view images of rooftops.
    Supports various roof types, materials, angles, and lighting conditions.
    """

    def __init__(self, config):
        self.config = config
        self.width = config.get('image_width', 640)
        self.height = config.get('image_height', 640)
        self.min_rooftops = config.get('min_rooftops', 1)
        self.max_rooftops = config.get('max_rooftops', 5)

    def generate(self):
        """
        Generate one image with rooftops and return (image, annotations).

        Returns:
            tuple: (PIL.Image, list of annotations)
            Annotations format: [(class_id, x_center, y_center, width, height), ...]
            All values normalized to [0, 1]
        """
        # Create base image (aerial background)
        img = self._create_background()
        draw = ImageDraw.Draw(img)

        # Generate random number of rooftops
        num_rooftops = random.randint(self.min_rooftops, self.max_rooftops)
        annotations = []

        for _ in range(num_rooftops):
            rooftop_data = self._generate_rooftop(draw)
            if rooftop_data:
                annotations.append(rooftop_data)

        return img, annotations

    def _create_background(self):
        """Create aerial/satellite view background."""
        # Generate realistic ground textures
        bg_type = random.choice(['urban', 'suburban', 'rural'])

        if bg_type == 'urban':
            # Dark asphalt/concrete
            base_color = (random.randint(40, 80), random.randint(40, 80), random.randint(40, 80))
        elif bg_type == 'suburban':
            # Mix of grass and pavement
            base_color = (random.randint(60, 100), random.randint(80, 120), random.randint(50, 90))
        else:  # rural
            # Grass/vegetation
            base_color = (random.randint(40, 80), random.randint(80, 120), random.randint(40, 80))

        img = Image.new('RGB', (self.width, self.height), base_color)

        # Add texture noise
        pixels = img.load()
        for x in range(self.width):
            for y in range(self.height):
                noise = random.randint(-20, 20)
                r, g, b = pixels[x, y]
                pixels[x, y] = (
                    max(0, min(255, r + noise)),
                    max(0, min(255, g + noise)),
                    max(0, min(255, b + noise))
                )

        return img

    def _generate_rooftop(self, draw):
        """
        Generate one rooftop on the image.

        Returns:
            tuple: (class_id, x_center, y_center, width, height) or None
        """
        # Random rooftop dimensions (in pixels)
        roof_width = random.randint(80, 300)
        roof_height = random.randint(80, 300)

        # Random position (ensure rooftop stays within bounds)
        x = random.randint(0, self.width - roof_width)
        y = random.randint(0, self.height - roof_height)

        # Choose roof type
        roof_type = random.choice(['flat', 'gabled', 'hipped', 'complex'])

        # Choose roof material/color
        roof_color = self._get_roof_color()

        # Draw rooftop based on type
        if roof_type == 'flat':
            self._draw_flat_roof(draw, x, y, roof_width, roof_height, roof_color)
        elif roof_type == 'gabled':
            self._draw_gabled_roof(draw, x, y, roof_width, roof_height, roof_color)
        elif roof_type == 'hipped':
            self._draw_hipped_roof(draw, x, y, roof_width, roof_height, roof_color)
        else:  # complex
            self._draw_complex_roof(draw, x, y, roof_width, roof_height, roof_color)

        # Add shadows (lighting variation)
        if random.random() < 0.7:
            self._add_shadow(draw, x, y, roof_width, roof_height)

        # Convert to YOLO format (normalized coordinates)
        x_center = (x + roof_width / 2) / self.width
        y_center = (y + roof_height / 2) / self.height
        norm_width = roof_width / self.width
        norm_height = roof_height / self.height

        # Class ID: 0 = rooftop
        return (0, x_center, y_center, norm_width, norm_height)

    def _get_roof_color(self):
        """Return realistic roof colors."""
        roof_materials = [
            (120, 120, 120),  # Gray (asphalt shingles)
            (100, 80, 70),     # Brown (tile)
            (180, 100, 80),    # Red (clay tile)
            (200, 200, 200),   # Light gray (metal)
            (60, 60, 60),      # Dark gray/black
            (140, 120, 100),   # Tan (concrete)
        ]
        base_color = random.choice(roof_materials)

        # Add slight color variation
        variation = random.randint(-15, 15)
        return tuple(max(0, min(255, c + variation)) for c in base_color)

    def _draw_flat_roof(self, draw, x, y, width, height, color):
        """Draw simple rectangular flat roof."""
        draw.rectangle([x, y, x + width, y + height], fill=color, outline=(0, 0, 0), width=2)

    def _draw_gabled_roof(self, draw, x, y, width, height, color):
        """Draw gabled (peaked) roof - shows as rectangle with center line from above."""
        # Main rectangle
        draw.rectangle([x, y, x + width, y + height], fill=color, outline=(0, 0, 0), width=2)

        # Center ridge line
        ridge_color = tuple(max(0, c - 30) for c in color)  # Darker
        center_x = x + width // 2
        draw.line([center_x, y, center_x, y + height], fill=ridge_color, width=3)

    def _draw_hipped_roof(self, draw, x, y, width, height, color):
        """Draw hipped roof - pyramid-like from above."""
        # Main rectangle
        draw.rectangle([x, y, x + width, y + height], fill=color, outline=(0, 0, 0), width=2)

        # Diagonal hip lines
        hip_color = tuple(max(0, c - 30) for c in color)
        center_x = x + width // 2
        center_y = y + height // 2

        # Draw lines from corners to center
        draw.line([x, y, center_x, center_y], fill=hip_color, width=2)
        draw.line([x + width, y, center_x, center_y], fill=hip_color, width=2)
        draw.line([x, y + height, center_x, center_y], fill=hip_color, width=2)
        draw.line([x + width, y + height, center_x, center_y], fill=hip_color, width=2)

    def _draw_complex_roof(self, draw, x, y, width, height, color):
        """Draw complex L-shaped or multi-section roof."""
        # Main section
        main_width = int(width * 0.7)
        main_height = int(height * 0.7)
        draw.rectangle([x, y, x + main_width, y + main_height], fill=color, outline=(0, 0, 0), width=2)

        # Wing section
        wing_width = int(width * 0.5)
        wing_height = int(height * 0.5)
        wing_x = x + main_width - wing_width // 2
        wing_y = y + main_height - wing_height // 2

        # Slightly different color for variation
        wing_color = tuple(min(255, max(0, c + random.randint(-10, 10))) for c in color)
        draw.rectangle([wing_x, wing_y, wing_x + wing_width, wing_y + wing_height],
                      fill=wing_color, outline=(0, 0, 0), width=2)

    def _add_shadow(self, draw, x, y, width, height):
        """Add shadow to simulate lighting."""
        # Shadow direction (based on sun angle)
        shadow_offset_x = random.randint(5, 15)
        shadow_offset_y = random.randint(5, 15)

        # Shadow color (semi-transparent dark)
        shadow_color = (30, 30, 30)

        # Draw shadow slightly offset
        shadow_x = x + shadow_offset_x
        shadow_y = y + shadow_offset_y
        draw.rectangle([shadow_x, shadow_y, shadow_x + width, shadow_y + height],
                      fill=shadow_color, outline=None)


def create_provider(config):
    """Factory function called by DaMa."""
    return RooftopProvider(config)
```

---

## Step 3: Configure DaMa

### 3.1 Create `dama.json` Configuration

Edit the main `dama.json` file in the DaMa root directory:

```json
{
  "output_dir": "output/rooftop_dataset",
  "num_images": 10000,
  "image_width": 640,
  "image_height": 640,
  "format": "yolo",
  "train_val_split": 0.85,
  "provider": {
    "module": "providers.rooftop.rooftop_generator",
    "class": "RooftopProvider",
    "config": {
      "image_width": 640,
      "image_height": 640,
      "min_rooftops": 1,
      "max_rooftops": 5
    }
  },
  "augmentation": {
    "enabled": true,
    "brightness_range": [0.7, 1.3],
    "contrast_range": [0.8, 1.2],
    "blur": true,
    "noise": true
  },
  "classes": [
    "rooftop"
  ]
}
```

### 3.2 Create Provider `__init__.py`

```bash
# Create __init__.py to make it a Python module
touch providers/rooftop/__init__.py
```

---

## Step 4: Generate Dataset

### 4.1 Test Generation (10 images)

First, test with a small batch:

```bash
# From DaMa root directory
python3 dama.py --num-images 10 --draw-labels

# This will create:
# - output/rooftop_dataset/images/ (10 images)
# - output/rooftop_dataset/labels/ (10 .txt files)
# - Label boxes drawn on images for visual verification
```

**Verify the output:**
- Open images in `output/rooftop_dataset/images/`
- Check that rooftops are clearly visible
- Verify label files contain annotations in YOLO format

### 4.2 Full Dataset Generation (10,000 images)

Once verified, generate the full dataset:

```bash
# This will take 20-40 minutes depending on your CPU
python3 dama.py

# Monitor progress - it will show:
# Generating image 1/10000...
# Generating image 2/10000...
# etc.
```

### 4.3 Expected Output Structure

```
output/rooftop_dataset/
├── train/
│   ├── images/
│   │   ├── img_0001.jpg
│   │   ├── img_0002.jpg
│   │   └── ... (8,500 images)
│   └── labels/
│       ├── img_0001.txt
│       ├── img_0002.txt
│       └── ... (8,500 labels)
└── val/
    ├── images/
    │   └── ... (1,500 images)
    └── labels/
        └── ... (1,500 labels)
```

### 4.4 Verify Label Format

Check a label file:

```bash
cat output/rooftop_dataset/train/labels/img_0001.txt
```

Should contain lines like:
```
0 0.435 0.512 0.123 0.234
0 0.712 0.345 0.156 0.189
```

Format: `class_id x_center y_center width height` (all normalized 0-1)

---

## Step 5: Augment with Real Data (Optional but Recommended)

### 5.1 Download Real Rooftop Images

Use existing datasets or scrape images:

**Option A: Use existing datasets**
- Google Earth/Maps screenshots
- Real estate aerial photos
- Satellite imagery datasets

**Option B: Manual collection**
```bash
# Create directories
mkdir -p real_rooftops/images
mkdir -p real_rooftops/labels

# Add your images to real_rooftops/images/
# Label them using tools like labelImg or roboflow
```

### 5.2 Merge with Synthetic Data

```bash
# Copy real images to training set
cp real_rooftops/images/* output/rooftop_dataset/train/images/
cp real_rooftops/labels/* output/rooftop_dataset/train/labels/
```

---

## Step 6: Create Dataset YAML for YOLO11

Create `rooftop.yaml` in the DaMa output directory:

```yaml
# output/rooftop_dataset/rooftop.yaml

path: /home/user/workspace/DaMa/output/rooftop_dataset
train: train/images
val: val/images

# Number of classes
nc: 1

# Class names
names:
  0: rooftop
```

---

## Troubleshooting

### Issue: Images look unrealistic
- **Solution**: Adjust colors in `_get_roof_color()` and `_create_background()`
- Add more texture/noise variation
- Include more roof types

### Issue: Annotations are off
- **Solution**: Verify bounding box calculations in `_generate_rooftop()`
- Use `--draw-labels` flag to visualize
- Check coordinate normalization (must be 0-1)

### Issue: Generation is slow
- **Solution**:
  - Reduce image complexity
  - Use multiprocessing (modify DaMa main script)
  - Generate smaller batches

---

## Next Steps

✅ **You now have 10,000+ labeled rooftop images!**

**Dataset location:** `~/workspace/DaMa/output/rooftop_dataset/`

**Next:** Proceed to [PHASE2_MODEL_TRAINING.md](PHASE2_MODEL_TRAINING.md) to train YOLO11 on this dataset.

---

## Dataset Statistics (Expected)

- **Total images**: 10,000
- **Training images**: 8,500 (85%)
- **Validation images**: 1,500 (15%)
- **Average rooftops per image**: 2-3
- **Total annotations**: ~25,000
- **Image size**: 640×640 pixels
- **Format**: YOLO (normalized bounding boxes)
- **Disk space**: ~2-3 GB
