#!/usr/bin/env python3
"""
Generate diverse background images for chess board detection training.
These backgrounds simulate different environments where chess games might be viewed:
- Video streams (YouTube, Twitch)
- Chess websites (Chess.com, Lichess)
- Various lighting and texture conditions
"""

from PIL import Image, ImageDraw
import random
import os

OUTPUT_DIR = "chess_input"
NUM_BACKGROUNDS = 100

# Color palettes for different backgrounds
BACKGROUNDS = [
    # Dark backgrounds (common in chess streams)
    {'type': 'solid', 'colors': [(30, 30, 30), (40, 40, 40), (20, 25, 30)]},
    # Light backgrounds (websites, bright rooms)
    {'type': 'solid', 'colors': [(240, 240, 240), (250, 250, 250), (230, 235, 240)]},
    # Warm backgrounds (wood tables, warm lighting)
    {'type': 'solid', 'colors': [(200, 180, 160), (180, 160, 140), (160, 140, 120)]},
    # Cool backgrounds (modern setups)
    {'type': 'solid', 'colors': [(180, 190, 200), (190, 200, 210), (170, 180, 190)]},
    # Gradient backgrounds
    {'type': 'gradient', 'colors': [(50, 50, 50), (100, 100, 100)]},
    {'type': 'gradient', 'colors': [(200, 200, 200), (250, 250, 250)]},
    # Textured backgrounds
    {'type': 'texture', 'base': (150, 150, 150)},
]

def create_solid_background(width, height, color):
    """Create a solid color background"""
    img = Image.new('RGB', (width, height), color)
    return img

def create_gradient_background(width, height, color1, color2):
    """Create a gradient background"""
    img = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(img)

    for y in range(height):
        ratio = y / height
        r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
        g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
        b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    return img

def create_textured_background(width, height, base_color):
    """Create a textured background with noise"""
    img = Image.new('RGB', (width, height), base_color)
    pixels = img.load()

    for y in range(height):
        for x in range(width):
            # Add random noise
            noise = random.randint(-20, 20)
            r = max(0, min(255, base_color[0] + noise))
            g = max(0, min(255, base_color[1] + noise))
            b = max(0, min(255, base_color[2] + noise))
            pixels[x, y] = (r, g, b)

    return img

def create_pattern_background(width, height):
    """Create a subtle pattern background (like website backgrounds)"""
    base_color = random.choice([(240, 240, 240), (250, 250, 250), (230, 235, 240)])
    img = Image.new('RGB', (width, height), base_color)
    draw = ImageDraw.Draw(img)

    # Add subtle grid pattern
    pattern_type = random.choice(['dots', 'lines', 'squares'])

    if pattern_type == 'dots':
        dot_spacing = 20
        for y in range(0, height, dot_spacing):
            for x in range(0, width, dot_spacing):
                dot_color = tuple(max(0, c - 10) for c in base_color)
                draw.ellipse([x-1, y-1, x+1, y+1], fill=dot_color)

    elif pattern_type == 'lines':
        line_spacing = 30
        line_color = tuple(max(0, c - 15) for c in base_color)
        for y in range(0, height, line_spacing):
            draw.line([(0, y), (width, y)], fill=line_color, width=1)

    elif pattern_type == 'squares':
        square_size = 40
        square_color = tuple(max(0, c - 8) for c in base_color)
        for y in range(0, height, square_size * 2):
            for x in range(0, width, square_size * 2):
                if (x // square_size + y // square_size) % 2 == 0:
                    draw.rectangle([x, y, x + square_size, y + square_size], fill=square_color)

    return img

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    for i in range(NUM_BACKGROUNDS):
        width = 1920  # Standard video resolution width
        height = 1080  # Standard video resolution height

        # Choose background type
        choice = random.random()

        if choice < 0.4:
            # Solid color
            bg_config = random.choice([b for b in BACKGROUNDS if b['type'] == 'solid'])
            color = random.choice(bg_config['colors'])
            img = create_solid_background(width, height, color)

        elif choice < 0.6:
            # Gradient
            bg_config = random.choice([b for b in BACKGROUNDS if b['type'] == 'gradient'])
            color1, color2 = bg_config['colors'][0], bg_config['colors'][1]
            img = create_gradient_background(width, height, color1, color2)

        elif choice < 0.8:
            # Textured
            bg_config = random.choice([b for b in BACKGROUNDS if b['type'] == 'texture'])
            base_color = bg_config['base']
            # Add some variety to base color
            base_color = tuple(max(0, min(255, c + random.randint(-50, 50))) for c in base_color)
            img = create_textured_background(width, height, base_color)

        else:
            # Pattern
            img = create_pattern_background(width, height)

        # Save the image
        img.save(f"{OUTPUT_DIR}/bg_{i:04d}.png")
        print(f"Generated background {i+1}/{NUM_BACKGROUNDS}")

    print(f"\nGenerated {NUM_BACKGROUNDS} background images in {OUTPUT_DIR}/")
    print(f"Ready to run DaMa with: python3 dama.py --config chess-config.json")

if __name__ == "__main__":
    main()
