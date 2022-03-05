<div align="center">
  <img src="https://raw.githubusercontent.com/ReedKrawiec/Board-Explorer/main/build/images/icons/icon150.png" />
</div>

# About

Board Explorer lets you turn any static chess board (like youtube videos and pictures) into a playable chessboard. You can play
your lines and check the evaluation. You're also able to view the evaluation while the game is being played. Under the hood, we locally record
(only on your computer) your screen and use an image recognition model (powered by yolov5) to identify the boards.

# Installation
1. Download a release from the right.
2. Open chrome://extensions, enable Developer mode
3. Load the packed crx download in step 1 by dragging from your file explorer onto this page.
# Building from Souce

1. Download this repository as a zip
2. ```
   npm run setup && npm run build
   ```
3. Open chrome://extensions, enable Developer mode
4. Load the unpacked zip.

# Usage

The extension will run on Youtube when enabled. You will be prompted to share your screen with the extension. The control can be accessed in the extension's popup in the top right.