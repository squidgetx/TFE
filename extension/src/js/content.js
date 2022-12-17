import * as twitter from "./twitter";
import * as facebook from "./facebook";
import { getLogger } from "./log";

chrome.storage.sync.get(
  [
    "workerID",
    "install_code",
    "install_time",
    "treatment_group",
    "mock_ideo",
    "inject_rate",
    "debug_mode",
  ],
  function (exp_config) {
    //todo typescript this mofo
    const workerID = exp_config.workerID;
    const installCode = exp_config.install_code;
    const treatment_group = exp_config.treatment_group;
    if (
      treatment_group == undefined ||
      workerID == undefined ||
      installCode == undefined
    ) {
      // User has not yet configured the extension
      return;
    }
    const logger = getLogger(workerID, installCode, treatment_group);

    /*
     * Set up observer
     */
    setupFeedObserver(exp_config, logger);
    // Re attach the observer when the back button is used, or
    // when a link is clicked
    window.addEventListener("popstate", function () {
      setupFeedObserver(exp_config, logger);
    });
    window.addEventListener("click", function () {
      setupFeedObserver(exp_config, logger);
    });
  }
);

const setupFeedObserver = function (exp_config, logger) {
  // The timeline is loaded with async JS
  // So, we want to trigger filtering logic whenever its modified
  console.log(`Timeline Extension Loaded, ${JSON.stringify(exp_config)}`);
  const container = document.documentElement || document.body;
  let observer;
  if (window.location.hostname.includes("twitter")) {
    observer = twitter.getObserver(exp_config, logger);
  } else {
    observer = facebook.getObserver(treatment_group, logger);
  }
  observer.observe(container, {
    attributes: false,
    childList: true,
    subtree: true,
    characterData: true,
  });
};
