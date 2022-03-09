window.onload = function () {
  let update = function (result) {
    if (result) {
      document.getElementById(
        "workerIDform"
      ).innerHTML = `<p>Worker ID: ${result}`;
    }
  };

  document.getElementById("workerIDform").addEventListener("submit", () => {
    let data = document.getElementById("workerID").value;
    chrome.storage.sync.set({ workerID: data }, function () {
      update(data);
    });
    event.preventDefault();
  });

  chrome.storage.sync.get(["workerID"], function (result) {
    console.log("result is " + result.workerID);
    update(result.workerID);
  });
};

chrome.storage.sync.clear();
