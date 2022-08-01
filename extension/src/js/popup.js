import { getLogger } from "./log";
import { CONFIG } from "./config";
import { getCompleteCode } from "./completecode";

window.onload = function () {
  let update = function (result) {
    if (result) {
      document.getElementById(
        "workerIDform"
      ).innerHTML = `<p>You are signed in with Respondent ID: ${result.workerID}</p><p>Your installation code is: <p class='indent'><b>${result.install_code}</b></p></p>`;
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
      const install_code = getCompleteCode(workerID);
      chrome.storage.sync.set({ install_code: install_code }, () => {
        console.log("install code set");
      });

      // Write an installation event to S3 and immediately flush it

      const log = getLogger(workerID, treatment_group);
      log.logEvent({}, "install");
      log.flushLog();

      update({ workerID: workerID, install_code: install_code });
    });

  chrome.storage.sync.get(["workerID", "install_code"], function (result) {
    console.log("Default result is ", result);
    if (result.workerID) {
      update(result);
    }
  });
};

//chrome.storage.sync.clear();
