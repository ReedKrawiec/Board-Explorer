import * as tf from '@tensorflow/tfjs';
async function main() {
  
  // @ts-ignore
  let stream = await navigator.mediaDevices.getDisplayMedia();
  const url = chrome.runtime.getURL("my-model.json");
  console.log(stream);
}
main();
