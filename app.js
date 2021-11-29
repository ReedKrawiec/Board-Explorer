var desktop_sharing = false;
  var local_stream = null;
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

  function onAccessApproved(desktop_id) {
    if (!desktop_id) {
      console.log('Desktop Capture access rejected.');
      return;
    }
    desktop_sharing = true;
    document.querySelector('button').innerHTML = "Disable Capture";
    console.log("Desktop sharing started.. desktop_id:" + desktop_id);

    navigator.webkitGetUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: desktop_id,
          minWidth: 1280,
          maxWidth: 1280,
          minHeight: 720,
          maxHeight: 720
        }
      }
    }, gotStream, getUserMediaError);

    function gotStream(stream) {
      console.log(stream);
      local_stream = stream;
      var video = document.querySelector('video');
      var ctx = document.querySelector("canvas").getContext("2d");
      video.srcObject = stream;
      setInterval(function(){
        console.log("test");
	      ctx.drawImage(video,0,0);
      },1000);
      stream.onended = function () {
        if (desktop_sharing) {
          toggle();
        }
      };
    }

    function getUserMediaError(e) {
      console.log('getUserMediaError: ' + JSON.stringify(e, null, '---'));
    }
  }

  /**
   * Click handler to init the desktop capture grab
   */
  document.querySelector('button').addEventListener('click', function (e) {
    toggle();
  });