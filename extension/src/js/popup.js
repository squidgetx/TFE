import { getCompleteCode } from "./completecode";
import { CONFIG } from "./config";
import { intervalToDuration } from "date-fns";
import { getStage, getDaysSinceInstall } from "./experiment";

window.onload = function () {

  // render the debug console if the given worker ID contains
  // the string "csmap-tester"
  const setupDebugConsole = function (exp_config) {
    if (exp_config.workerID.includes("csmap-tester")) {
      document.getElementById("debug").removeAttribute("hidden");
    } else {
      return;
    }
    document.getElementById("debug-mode").checked = exp_config.debug_mode;
    document.getElementById("debug-mode").addEventListener("change", (ev) => {
      chrome.storage.sync.set({ debug_mode: ev.currentTarget.checked });
    });

    const ideo_buttons = document.querySelectorAll(
      'input[type=radio][name="ideo"]'
    );
    const ideo_map = {
      0: 0,
      "-1": 1,
      1: 2,
    };
    ideo_buttons[ideo_map[exp_config.mock_ideo]].checked = true;
    ideo_buttons.forEach((radio) =>
      radio.addEventListener("change", () =>
        chrome.storage.sync.set({ mock_ideo: radio.value })
      )
    );

    const treat_buttons = document.querySelectorAll(
      'input[type=radio][name="treat"]'
    );
    treat_buttons[exp_config.treatment_group].checked = true;
    treat_buttons.forEach((radio) =>
      radio.addEventListener("change", () =>
        chrome.storage.sync.set({ treatment_group: radio.value })
      )
    );

    const inject_slider = document.getElementById("inject-rate");
    inject_slider.value = exp_config.mock_inject_rate || CONFIG.inject_rate;
    inject_slider.addEventListener("change", (ev) => {
      chrome.storage.sync.set({ mock_inject_rate: parseFloat(inject_slider.value) });
    });

    const days_input = document.getElementById('days')
    days_input.value = getDaysSinceInstall(exp_config)
    const experiment_stage = document.getElementById('experiment-stage')
    days_input.addEventListener("input", (ev) => {
      console.log(days_input.value, exp_config.mock_days)
      chrome.storage.sync.set({ mock_days: days_input.value });
      exp_config.mock_days = days_input.value
      experiment_stage.innerHTML = getStage(exp_config)
    })
    experiment_stage.innerHTML = getStage(exp_config)


  };

  // Render the  popup for paticipants who successfully registered the extension
  const renderRegisteredPopup = function (exp_config) {
    const contentDiv = document.getElementById("content");
    contentDiv.innerHTML = `<p>Thank you for participating in this study, @${exp_config.workerID}! Your registration code is <b>${exp_config.install_code}</b>.</p>`;
    const sinceInstall = intervalToDuration({
      start: exp_config.install_time,
      end: Date.now(),
    });
    const daysLeft = CONFIG.studyLengthDays - sinceInstall.days;
    const timer = document.createElement("p");
    if (daysLeft > 0) {
      timer.innerHTML = `Please keep this extension installed for the next ${daysLeft} days.`;
    } else {
      timer.innerHTML = `Thank you for your participation. You are now free to uninstall this extension at any time.`;
    }
    contentDiv.appendChild(timer);
  };

  // Render an error message
  const error = function (err_msg) {
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
      const N_GROUPS = 2
      const treatment_group = Math.floor(Math.random() * N_GROUPS);

      // validation
      if (!workerID) {
        error("You must enter a worker ID");
        return;
      }
      const install_code = getCompleteCode(workerID);
      const init_exp_config = {
        workerID: workerID,
        install_code: install_code,
        install_time: Date.now(),
        treatment_group: treatment_group,
        mock_ideo: 0,
        debug_mode: false,
        inject_rate: CONFIG.inject_rate,
      };

      chrome.storage.sync.set(init_exp_config, function () {
        console.log(`Registration completed: ${install_code}`);

        // Tell the server about the new user
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
        }).then(() => { });
        // TODO error handle?

        renderRegisteredPopup(init_exp_config);
        setupDebugConsole(init_exp_config);
      });
    });

  // Render the registered popup if there is a worker ID found in chrome storage
  chrome.storage.sync.get(
    [
      "workerID",
      "install_code",
      "install_time",
      "treatment_group",
      "mock_ideo",
      "mock_inject_rate",
      "mock_days",
      "debug_mode",
    ],
    function (exp_config) {
      if (exp_config.workerID) {
        renderRegisteredPopup(exp_config);
        setupDebugConsole(exp_config);
      }
    }
  );
};
