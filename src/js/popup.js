window.onload = function () {
  let update = function (result) {
    if (result) {
      document.getElementById(
        "workerIDform"
      ).innerHTML = `<p>Worker ID: ${result}`;
    }
  };

  // Registration flow
  // Save worker ID in chrome storage
  // At this time, also register the treatment group with random sample
  document
    .getElementById("workerIDform")
    .addEventListener("submit", (event) => {
      let data = document.getElementById("workerID").value;
      chrome.storage.sync.set({ workerID: data }, function () {
        update(data);
      });
      chrome.storage.sync.set(
        { treatment_group: Math.floor(Math.random() * 3) },
        function () {
          console.log("Group was set");
        }
      );

      event.preventDefault();
    });

  chrome.storage.sync.get(["workerID"], function (result) {
    console.log("result is " + result.workerID);
    update(result.workerID);
  });
};

chrome.storage.sync.clear();
