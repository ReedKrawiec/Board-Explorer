import * as ort from 'onnxruntime-web';

// Class names for YOLO11 chess detection model
const names = ["BOARD", "p", "r", "n", "b", "q", "k", "P", "R", "N", "B", "Q", "K"];

// Model input size
const MODEL_WIDTH = 512;
const MODEL_HEIGHT = 512;

// Detection thresholds
const CONF_THRESHOLD = 0.25;
const IOU_THRESHOLD = 0.45;

export interface PieceInfo {
    type: string;
    width: number;
    height: number;
    x: number;
    y: number;
    score: number;
}

export interface BoardInfo {
    width: number;
    height: number;
    x: number;
    y: number;
    score: number;
}

export interface Detection {
    board_info: BoardInfo | null;
    pieces: PieceInfo[];
}

/**
 * ONNX-based chess board and piece detector using YOLO11
 * Replaces TensorFlow.js implementation with ONNX Runtime Web
 */
export class OnnxChessDetector {
    private session: ort.InferenceSession | null = null;
    private modelPath: string;

    constructor(modelPath?: string) {
        this.modelPath = modelPath || chrome.runtime.getURL('model/chess-yolo11.onnx');
    }

    /**
     * Load the YOLO11 ONNX model
     * Uses WebGL backend with WASM fallback
     */
    async loadModel(): Promise<void> {
        try {
            console.log('[OnnxChessDetector] Loading model from:', this.modelPath);

            // Configure execution providers: try WebGL first, fallback to WASM
            const options: ort.InferenceSession.SessionOptions = {
                executionProviders: ['webgl', 'wasm'],
                graphOptimizationLevel: 'all'
            };

            this.session = await ort.InferenceSession.create(this.modelPath, options);

            console.log('[OnnxChessDetector] Model loaded successfully');
            console.log('[OnnxChessDetector] Execution providers:', this.session.executionProviders);
        } catch (error) {
            console.error('[OnnxChessDetector] Failed to load model:', error);
            throw error;
        }
    }

    /**
     * Detect chess board and pieces in an image
     * @param imageBitmap Input image
     * @returns Detection results with board and pieces
     */
    async detect(imageBitmap: ImageBitmap): Promise<Detection> {
        if (!this.session) {
            throw new Error('Model not loaded. Call loadModel() first.');
        }

        const startTime = performance.now();

        // Preprocess image
        const inputTensor = await this.preprocessImage(imageBitmap);

        // Run inference
        const outputs = await this.session.run({ images: inputTensor });

        // Get output tensor (YOLO11 outputs in different format than YOLOv5)
        const outputTensor = outputs[Object.keys(outputs)[0]];
        const outputData = outputTensor.data as Float32Array;
        const outputShape = outputTensor.dims;

        // Postprocess detections
        const detections = this.postprocess(outputData, outputShape);

        const endTime = performance.now();
        console.log(`[OnnxChessDetector] Inference: ${(endTime - startTime).toFixed(2)}ms`);
        console.log(`[OnnxChessDetector] Detections: ${detections.pieces.length + (detections.board_info ? 1 : 0)}`);

        // Clean up
        inputTensor.dispose();

        return detections;
    }

    /**
     * Preprocess image for YOLO11 model
     * Resize to 512x512 and normalize to [0, 1]
     */
    private async preprocessImage(imageBitmap: ImageBitmap): Promise<ort.Tensor> {
        // Create canvas and resize image
        const canvas = new OffscreenCanvas(MODEL_WIDTH, MODEL_HEIGHT);
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('Failed to get 2D context');
        }

        ctx.drawImage(imageBitmap, 0, 0, MODEL_WIDTH, MODEL_HEIGHT);

        // Get image data
        const imageData = ctx.getImageData(0, 0, MODEL_WIDTH, MODEL_HEIGHT);
        const pixels = imageData.data;

        // Convert to RGB and normalize to [0, 1]
        // YOLO expects CHW format (channels first): [1, 3, 512, 512]
        const channels = 3;
        const imageSize = MODEL_WIDTH * MODEL_HEIGHT;
        const inputData = new Float32Array(channels * imageSize);

        for (let i = 0; i < imageSize; i++) {
            const pixelIndex = i * 4; // RGBA
            inputData[i] = pixels[pixelIndex] / 255.0;                    // R
            inputData[imageSize + i] = pixels[pixelIndex + 1] / 255.0;    // G
            inputData[imageSize * 2 + i] = pixels[pixelIndex + 2] / 255.0; // B
        }

        // Create ONNX tensor with shape [1, 3, 512, 512]
        return new ort.Tensor('float32', inputData, [1, channels, MODEL_HEIGHT, MODEL_WIDTH]);
    }

    /**
     * Postprocess YOLO11 output
     * YOLO11 output format: [1, 17, 8400]
     * Where 17 = 4 (bbox) + 13 (classes)
     */
    private postprocess(outputData: Float32Array, outputShape: number[]): Detection {
        const numClasses = 13;
        const numDetections = outputShape[2]; // 8400 for YOLO11n at 512x512

        interface RawDetection {
            x: number;
            y: number;
            w: number;
            h: number;
            score: number;
            classId: number;
        }

        const rawDetections: RawDetection[] = [];

        // Parse YOLO11 output: [1, 17, 8400]
        // Format: [cx, cy, w, h, class0_conf, class1_conf, ..., class12_conf]
        for (let i = 0; i < numDetections; i++) {
            // Get bbox coordinates
            const cx = outputData[i];
            const cy = outputData[numDetections + i];
            const w = outputData[2 * numDetections + i];
            const h = outputData[3 * numDetections + i];

            // Get class scores (starting at index 4)
            let maxScore = 0;
            let maxClassId = 0;

            for (let c = 0; c < numClasses; c++) {
                const score = outputData[(4 + c) * numDetections + i];
                if (score > maxScore) {
                    maxScore = score;
                    maxClassId = c;
                }
            }

            // Filter by confidence threshold
            if (maxScore >= CONF_THRESHOLD) {
                rawDetections.push({
                    x: cx,
                    y: cy,
                    w: w,
                    h: h,
                    score: maxScore,
                    classId: maxClassId
                });
            }
        }

        // Apply NMS (Non-Maximum Suppression)
        const nmsDetections = this.applyNMS(rawDetections, IOU_THRESHOLD);

        // Separate board and pieces
        let board_info: BoardInfo | null = null;
        const pieces: PieceInfo[] = [];

        for (const det of nmsDetections) {
            const className = names[det.classId];

            if (className === 'BOARD') {
                board_info = {
                    x: det.x,
                    y: det.y,
                    width: det.w,
                    height: det.h,
                    score: det.score
                };
            } else {
                pieces.push({
                    type: className,
                    x: det.x,
                    y: det.y,
                    width: det.w,
                    height: det.h,
                    score: det.score
                });
            }
        }

        return { board_info, pieces };
    }

    /**
     * Apply Non-Maximum Suppression to remove overlapping detections
     */
    private applyNMS(detections: any[], iouThreshold: number): any[] {
        // Sort by score descending
        detections.sort((a, b) => b.score - a.score);

        const keep: any[] = [];

        while (detections.length > 0) {
            const current = detections.shift()!;
            keep.push(current);

            // Remove detections that overlap too much with current
            detections = detections.filter(det => {
                // Only apply NMS within same class
                if (det.classId !== current.classId) {
                    return true;
                }

                const iou = this.calculateIOU(current, det);
                return iou < iouThreshold;
            });
        }

        return keep;
    }

    /**
     * Calculate Intersection over Union (IOU) between two boxes
     */
    private calculateIOU(box1: any, box2: any): number {
        const x1_min = box1.x - box1.w / 2;
        const y1_min = box1.y - box1.h / 2;
        const x1_max = box1.x + box1.w / 2;
        const y1_max = box1.y + box1.h / 2;

        const x2_min = box2.x - box2.w / 2;
        const y2_min = box2.y - box2.h / 2;
        const x2_max = box2.x + box2.w / 2;
        const y2_max = box2.y + box2.h / 2;

        const inter_x_min = Math.max(x1_min, x2_min);
        const inter_y_min = Math.max(y1_min, y2_min);
        const inter_x_max = Math.min(x1_max, x2_max);
        const inter_y_max = Math.min(y1_max, y2_max);

        const inter_width = Math.max(0, inter_x_max - inter_x_min);
        const inter_height = Math.max(0, inter_y_max - inter_y_min);
        const inter_area = inter_width * inter_height;

        const box1_area = box1.w * box1.h;
        const box2_area = box2.w * box2.h;
        const union_area = box1_area + box2_area - inter_area;

        return inter_area / union_area;
    }

    /**
     * Dispose of the model and free resources
     */
    async dispose(): Promise<void> {
        if (this.session) {
            // ONNX Runtime Web doesn't have explicit dispose, session is GC'd
            this.session = null;
            console.log('[OnnxChessDetector] Model disposed');
        }
    }
}
