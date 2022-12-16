import { getCompleteCode } from "./completecode";
import { CONFIG } from "./config";
import { intervalToDuration } from "date-fns";

window.onload = function () {
  let renderRegisteredPopup = function (result) {
    if (result) {
      const contentDiv = document.getElementById("content");
      contentDiv.innerHTML = `<p>Thank you for participating in this study. Your registration code is <b>${result.install_code}</b>.</p>`;
      const sinceInstall = intervalToDuration({
        start: result.install_time,
        end: Date.now(),
      });
      const inRecontactPeriod =
        sinceInstall.days >= CONFIG.recontactIntervalDays;
      const days = CONFIG.recontactIntervalDays - sinceInstall.days;
      let recontactHTML = `<p>Please keep this extension installed for the next ${days} days.`;

      if (inRecontactPeriod) {
        if (result.eligible) {
          recontactHTML = `<p>Thank you and congratulations! You are eligible for a followup survey! Please click <b><a href=${CONFIG.recontactURL} target='_blank'>here</a></b> for the link to the final survey and a $${CONFIG.rewardDollars} reward!`;
        } else {
          recontactHTML = `<p>Thank you for your participation. You are now free to uninstall this extension at any time.`;
        }
      }
      contentDiv.innerHTML += recontactHTML;
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

      // Strip leading "@" sign
      if (workerID.startsWith("@")) {
        workerID = workerID.slice(1);
      }
      let treatment_group = Math.floor(Math.random() * 3);

      // Hardcode treatment group N % 4 for test accounts with the format TEST_N
      const match = workerID.match(/TEST_(\d+)/);
      if (match) {
        treatment_group = match[1] % 4;
      }

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
          console.log(`Registration completed: ${install_code}`);

          // Write an installation event to S3 and immediately flush it
          fetch(CONFIG.serverEndpoint + "/register", {
            method: "POST",
            body: JSON.stringify({
              username: workerID,
              treatment_group: treatment_group,
              install_code: install_code,
            }),
            headers: {
              "Content-Type": "application/json",
            },
          }).then(() => {});
          // TODO error handle?

          renderRegisteredPopup({
            workerID: workerID,
            install_code: install_code,
            install_time: Date.now(),
            eligible: false,
          });
        }
      );
    });

  chrome.storage.sync.get(
    ["workerID", "install_code", "install_time", "eligible"],
    function (result) {
      console.log("Default result is ", result);
      if (result.workerID) {
        renderRegisteredPopup(result);
      }
    }
  );
};
