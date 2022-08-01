import { getLogger } from "./log";
import { getCompleteCode } from "./completecode";
import { CONFIG } from "./config";
const ALARM = "recontact_alarm";

window.onload = function () {
  let update = function (result) {
    if (result) {
      document.getElementById(
        "workerIDform"
      ).innerHTML = `<p>You are registered with Respondent ID: ${result.workerID}</p><p>Your installation code is: <p class='indent'><b>${result.install_code}</b></p></p>`;
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
      const install_code = getCompleteCode(workerID);

      chrome.storage.sync.set(
        {
          workerID: workerID,
          treatment_group: treatment_group,
          install_code: install_code,
          install_time: Date.now(),
          last_recontact: Date.now(),
        },
        function () {
          console.log("Registration completed");

          // Write an installation event to S3 and immediately flush it
          const log = getLogger(workerID, treatment_group);
          log.logEvent({ install_code: install_code }, "install");
          log.flushLog();

          update({ workerID: workerID, install_code: install_code });
        }
      );
    });

  chrome.storage.sync.get(["workerID", "install_code"], function (result) {
    console.log("Default result is ", result);
    if (result.workerID) {
      update(result);
    }
  });
};

//chrome.storage.sync.clear();
