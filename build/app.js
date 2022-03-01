let isToggled = false;
let isEvaluating = false;
let isPlayable = false;

function toggleView(classlist,state){
  if(state){
    classlist.add("on");
    classlist.remove("off");
  }
  else {
    classlist.add("off");
    classlist.remove("on");
  }
}

document.querySelector("#toggle").addEventListener("click", function() {
  isToggled = !isToggled;
  let classlist = document.querySelector("#toggle").classList
  toggleView(classlist,isToggled);
  chrome.runtime.sendMessage("toggle");
});
document.querySelector("#eval").addEventListener("click", function() {
  isEvaluating = !isEvaluating;
  let classlist = document.querySelector("#eval").classList
  toggleView(classlist,isEvaluating);
  chrome.runtime.sendMessage("eval");
});
document.querySelector("#playable").addEventListener("click", function() {
  isPlayable = !isPlayable;
  let classlist = document.querySelector("#playable").classList
  toggleView(classlist,isPlayable);
  chrome.runtime.sendMessage("playable");
});
