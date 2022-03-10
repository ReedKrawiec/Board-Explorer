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
chrome.storage.local.get(['state'], function (state) {
  console.log(state);
  if(Object.keys(state).length === 0){
    state = {
      state:{
        isToggled: false,
        isEvaluating: false,
        isPlayable: false,
      }
    }
  }
  let {isToggled, isEvaluating, isPlayable} = state.state;
  if(isToggled){
    toggleView(document.querySelector("#toggle").classList, isToggled);
  } 
  if(isEvaluating){
    toggleView(document.querySelector("#eval").classList, isEvaluating);
  }
  if(isPlayable){
    toggleView(document.querySelector("#playable").classList, isPlayable);
  }
  document.querySelector("#toggle").addEventListener("click", function () {
    isToggled = !isToggled;
    toggleView(document.querySelector("#toggle").classList, isToggled);
    chrome.storage.local.set({state: {isToggled, isEvaluating, isPlayable}});
    chrome.runtime.sendMessage("toggle");
  });
  document.querySelector("#eval").addEventListener("click", function () {
    isEvaluating = !isEvaluating;
    toggleView(document.querySelector("#eval").classList, isEvaluating);
    chrome.storage.local.set({state: {isToggled, isEvaluating, isPlayable}});
    chrome.runtime.sendMessage("eval");
  });
  document.querySelector("#playable").addEventListener("click", function () {
    isPlayable = !isPlayable;
    toggleView(document.querySelector("#playable").classList, isPlayable);
    chrome.storage.local.set({state: {isToggled, isEvaluating, isPlayable}});
    chrome.runtime.sendMessage("playable");
  });
});

