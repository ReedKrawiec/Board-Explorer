import * as tf from '@tensorflow/tfjs';
async function main() {
    //const response = fetch("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==");
    const url = chrome.runtime.getURL("my-model.json");
    let model = await tf.loadGraphModel(url);
    chrome.runtime.onMessage.addListener(async (data, sender)=>{
        const typed = new Uint8Array(data.frame);
        const blob = new Blob([typed],{
            type: "image/jpeg"
        });
        const bitmap = await createImageBitmap(blob);

        const input = tf.image.resizeBilinear(tf.browser.fromPixels(bitmap), [512, 512])
        .div(255.0).expandDims(0);
        model.executeAsync(input).then(res =>{
            console.log("DONE " + data.counter);
            console.log(res);
        });
    })
}

main();
