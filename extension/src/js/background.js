const UNINSTALL_ENDPOINT =
  "http://ec2-34-239-146-85.compute-1.amazonaws.com:3000";

chrome.storage.sync.get(["workerID"], (result) => {
  if (result.workerID) {
    chrome.runtime.setUninstallURL(
      `${UNINSTALL_ENDPOINT}?id=${result.workerID}&event=uninstall`
    );
  }
});
