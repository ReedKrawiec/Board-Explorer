async function main() {
  stream = await navigator.mediaDevices.getDisplayMedia();
  const url = chrome.runtime.getURL("/best_web_model/model.json");
  const shardsURLS = []
  var file = new File(["foo"], "foo.txt", {
    type: "text/plain",
  });
  console.log(url);
  console.log(stream);
}
main();