window.onload = function () {
  let update = function (result) {
    if (result) {
      document.getElementById(
        "workerIDform"
      ).innerHTML = `<p>You are signed in with Worker ID: ${result}`;
    }
  };

  // Registration flow
  // Save worker ID in chrome storage
  // At this time, also register the treatment group with random sample
  document
    .getElementById("workerIDform")
    .addEventListener("submit", (event) => {
      let workerID = document.getElementById("workerID").value;
      let accessKey = document.getElementById("password").value;
      chrome.storage.sync.set({ workerID: workerID }, function () {
        console.log("WorkerID was set as " + workerID);
        update(workerID);
      });
      chrome.storage.sync.set(
        { treatment_group: Math.floor(Math.random() * 3) },
        function () {
          console.log("Group was set");
        }
      );
      chrome.storage.sync.set({ accessKey: accessKey }, () => {
        console.log("Access key was set");
      });

      event.preventDefault();
    });

  chrome.storage.sync.get(["workerID"], function (result) {
    console.log("result is " + result.workerID);
    update(result.workerID);
  });
};

//chrome.storage.sync.clear();
