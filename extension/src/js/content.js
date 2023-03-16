import * as twitter from "./twitter";
import { getLogger } from "./log";

// Upon loading the webpage, request 
// the experiment configuration from chrome storage API
// and attach the observer object which handles 
// the actual extension behavior
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
    const workerID = exp_config.workerID;
    const installCode = exp_config.install_code;
    const treatment_group = exp_config.treatment_group;
    const logger = getLogger(workerID, installCode, treatment_group);
    if (
      treatment_group == undefined ||
      workerID == undefined ||
      installCode == undefined
    ) {
      // User has not yet configured the extension
      logger.logEventAndFlush(
        { "message": "Extension configured improperly: treatment group, id, or install code is null" },
        "warning"
      )
      return;
    }

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

// Attach the observer to the webpage
const setupFeedObserver = function (exp_config, logger) {
  console.log(`Timeline Extension Loaded, ${JSON.stringify(exp_config)}`);
  logger.logEventAndFlush({}, 'extension_loaded')
  const container = document.documentElement || document.body;
  const observer = twitter.getObserver(exp_config, logger);
  observer.observe(container, {
    attributes: false,
    childList: true,
    subtree: true,
    characterData: true,
  });
};
