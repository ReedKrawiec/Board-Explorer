var desktop_sharing = false;
var local_stream = null;

async function onAccessApproved(desktop_id) {
  if (!desktop_id) {
    console.log('Desktop Capture access rejected.');
    return;
  }
  desktop_sharing = true;
  document.querySelector('button').innerHTML = "Disable Capture";
  
  console.log("Desktop sharing started.. desktop_id:" + desktop_id);

  function gotStream(stream){
    console.log(stream);
  }

  function getUserMediaError(e){
    console.log('getUserMediaError', e);
  }
  try {
    stream = await navigator.mediaDevices.getDisplayMedia();
    console.log(stream);
    
    console.log(stream);
    local_stream = stream;
    
    var video = document.querySelector('video');
    var ctx = document.querySelector("canvas").getContext("2d");
    console.log(stream)
    video.srcObject = stream;
    setInterval(function () {
      
      console.log("hi")
      
      ctx.drawImage(video, 0, 0);
    }, 1000);
    stream.onended = function () {
      if (desktop_sharing) {
        toggle();
      }
    };
    
    
  } catch(err) {
    console.log(err);
  }
  function getUserMediaError(e) {
    console.log('getUserMediaError: ' + JSON.stringify(e, null, '---'));
  }
}

function toggle() {
  if (!desktop_sharing) {
    chrome.desktopCapture.chooseDesktopMedia(["screen", "window"], onAccessApproved);
  } else {
    desktop_sharing = false;

    if (local_stream)
      local_stream.stop();
    local_stream = null;

    document.querySelector('button').innerHTML = "Enable Capture";
    console.log('Desktop sharing stopped...');
  }
}

/**
 * Click handler to init the desktop capture grab
 */
document.querySelector('button').addEventListener('click', function (e) {
  toggle();
});