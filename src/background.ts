import * as tf from '@tensorflow/tfjs';
async function main() {
    const url = chrome.runtime.getURL("my-model.json");
    console.log(chrome.runtime.getURL("my-model.weights.bin"));
    let model = await tf.loadGraphModel(url);
    const test_image_url = chrome.runtime.getURL("thumb0002.jpg");
    console.log(test_image_url);
    const response = await fetch(test_image_url);
    console.log(test_image_url);
    const blob = await response.blob();
    console.log(blob);
    const image = await createImageBitmap(blob);
    const input = tf.image.resizeBilinear(tf.browser.fromPixels(image), [512, 512])
    .div(255.0).expandDims(0);
    console.log(input);
    console.log("test2");
    model.executeAsync(input).then(res =>{
        console.log("DONE");
        console.log(res);
    });
}

main();
