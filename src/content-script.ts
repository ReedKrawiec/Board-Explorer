import * as tf from '@tensorflow/tfjs';
async function main() {
  
  // @ts-ignore
  let stream = await navigator.mediaDevices.getDisplayMedia();
  const url = chrome.runtime.getURL("my-model.json");
  console.log(chrome.runtime.getURL("my-model.weights.bin"));
  let i = document.createElement("img");
  i.crossOrigin = "anonymous";
  i.src = "https://images.chesscomfiles.com/uploads/v1/images_users/tiny_mce/ColinStapczynski/phpIiYR5R.png";
  i.onload = async () => {
    let model = await tf.loadGraphModel(url);
    const input = tf.image.resizeBilinear(tf.browser.fromPixels(i), [512, 512])
        .div(255.0).expandDims(0);
    console.log(input);
    model.executeAsync(input).then(res =>{
      console.log("DONE");
      console.log(res);
    });
  }
  
  console.log(stream);
}
main();