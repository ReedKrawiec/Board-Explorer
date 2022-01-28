document.querySelector("#eval").addEventListener("click", function() {
  chrome.runtime.sendMessage("eval");
  console.log("eval");
});
document.querySelector("#playable").addEventListener("click", function() {
  chrome.runtime.sendMessage("playable");
  console.log("playable");
});
