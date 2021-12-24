import * as tf from '@tensorflow/tfjs';

async function main() {
  let counter = 0;

  // @ts-ignore
  const stream = await navigator.mediaDevices.getDisplayMedia({
    audio:false
  });

  const canvas = <HTMLCanvasElement>document.createElement("canvas");
  canvas.height = 1200;
  canvas.width = 1920;
  const ctx = canvas.getContext("2d");

  const video = <HTMLVideoElement>document.createElement("video");
  video.src = stream;

  const url = chrome.runtime.getURL("my-model.json");
  let model = await tf.loadGraphModel(url);

  setInterval(async ()=>{
  ctx.drawImage(video, 0, 0);
    const blob:Blob = await new Promise(resolve => canvas.toBlob(resolve,"image/jpeg"));
    //const bitmap = await createImageBitmap(blob);
    
    //const input = tf.image.resizeBilinear(tf.browser.fromPixels(bitmap), [512, 512])
    //.div(255.0).expandDims(0);
    const buffer = await blob.arrayBuffer();
    const typed = new Uint8Array(buffer);
    chrome.runtime.sendMessage({
        frame:Array.from(typed),
        counter
    });
    counter++;
  },2000);
}
main();
