let isToggled = false;
let isEvaluating = false;
let isPlayable = false;

chrome.storage.local.get(["enabled","evaluating","playable"]).then(function(result){
  console.log(result);
  isEvaluating = result.evaluating;
  if(isEvaluating){
    toggleView(document.querySelector("#eval").classList,true);
  }
  isPlayable = result.playable;
  if(isPlayable){
    toggleView(document.querySelector("#playable").classList,true);
  }
  isToggled = result.enabled;
  if(isToggled){
    toggleView(document.querySelector("#toggle").classList,true);
  }
  console.log(`ADHIUAWHIUDA ${isToggled} ${isEvaluating} ${isPlayable}`);
});

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

document.querySelector("#toggle").addEventListener("click",async function() {
  isToggled = !isToggled;
  let classlist = document.querySelector("#toggle").classList
  toggleView(classlist,isToggled);
  chrome.runtime.sendMessage("toggle");
  await chrome.storage.local.set({"enabled":isToggled});
});
document.querySelector("#eval").addEventListener("click",async function() {
  isEvaluating = !isEvaluating;
  let classlist = document.querySelector("#eval").classList
  toggleView(classlist,isEvaluating);
  chrome.runtime.sendMessage("eval");
});
document.querySelector("#playable").addEventListener("click",async function() {
  isPlayable = !isPlayable;
  let classlist = document.querySelector("#playable").classList
  toggleView(classlist,isPlayable);
  chrome.runtime.sendMessage("playable");
});
