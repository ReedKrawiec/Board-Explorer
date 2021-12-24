import * as tf from '@tensorflow/tfjs';

const [imagewidth, imageheight] = [1920,1200]

async function main() {
  let counter = 0;

  // @ts-ignore
  const stream = await navigator.mediaDevices.getDisplayMedia({
    audio:false
  });

  const canvas = <HTMLCanvasElement>document.createElement("canvas");
  canvas.height = 512;
  canvas.width = 512;
  const ctx = canvas.getContext("2d");

  const video = <HTMLVideoElement>document.createElement("video");
  video.srcObject = stream;
  await video.play();
  const url = chrome.runtime.getURL("my-model.json");
  let model = await tf.loadGraphModel(url);

  setInterval(async ()=>{
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const new_width = 512;
      const new_height = 512/imagewidth * imageheight;
      ctx.drawImage(
          video,
          512/2 - new_width/2,
          512/2 - new_height/2,
          new_width,
          new_height
      );
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
