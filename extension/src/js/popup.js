import { getLogger } from "./log";
const INSTALL_CODE = "tft_ic0";
import { CONFIG } from "./config";

window.onload = function () {
  let update = function (result) {
    if (result) {
      document.getElementById(
        "workerIDform"
      ).innerHTML = `<p>You are signed in with Respondent ID: ${result}</p><p>Your installation code is: <p class='indent'><b>${INSTALL_CODE}_${result}</b></p></p>`;
      if (CONFIG.trackUninstall) {
        chrome.runtime.setUninstallURL(CONFIG.uninstallEndpoint);
      }
    }
  };

  let error = function (err_msg) {
    console.log(err_msg);
    document.getElementById("error_msg").innerHTML = err_msg;
  };

  // Registration flow
  // Save worker ID in chrome storage
  // At this time, also register the treatment group with random sample
  document
    .getElementById("workerIDform")
    .addEventListener("submit", (event) => {
      event.preventDefault();

      let workerID = document.getElementById("workerID").value;
      let treatment_group = Math.floor(Math.random() * 3);

      // validation
      if (!workerID) {
        error("You must enter a worker ID");
        return;
      }

      chrome.storage.sync.set({ workerID: workerID }, function () {
        console.log("WorkerID was set as " + workerID);
      });
      chrome.storage.sync.set(
        { treatment_group: treatment_group },
        function () {
          console.log("Group was set");
        }
      );

      // Write an installation event to S3 and immediately flush it

      const log = getLogger(workerID, treatment_group);
      log.logEvent({}, "install");
      log.flushLog();

      update(workerID);
    });

  chrome.storage.sync.get(["workerID"], function (result) {
    console.log("result is " + result.workerID);
    update(result.workerID);
  });
};

//chrome.storage.sync.clear();
