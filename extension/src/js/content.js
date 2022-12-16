import * as twitter from "./twitter";
import * as facebook from "./facebook";
import { getLogger } from "./log";

chrome.storage.sync.get(
  ["workerID", "treatment_group", "install_code"],
  function (result) {
    const workerID = result.workerID;
    const installCode = result.install_code;
    const treatment_group = result.treatment_group;
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
    setupFeedObserver(treatment_group, workerID, installCode, logger);
    // Re attach the observer when the back button is used, or
    // when a link is clicked
    window.addEventListener("popstate", function () {
      setupFeedObserver(treatment_group, workerID, installCode, logger);
    });
    window.addEventListener("click", function () {
      setupFeedObserver(treatment_group, workerID, installCode, logger);
    });
  }
);

const setupFeedObserver = function (
  treatment_group,
  workerID,
  install_code,
  logger
) {
  // The timeline is loaded with async JS
  // So, we want to trigger filtering logic whenever its modified
  console.log(
    `Timeline Extension Loaded, respondent ID ${workerID}, treatment group ${treatment_group}, install_code ${installCode}`
  );
  const config = {
    attributes: false,
    childList: true,
    subtree: true,
    characterData: true,
  };
  const container = document.documentElement || document.body;
  let observer;
  if (window.location.hostname.includes("twitter")) {
    observer = twitter.getObserver(
      treatment_group,
      workerID,
      install_code,
      logger
    );
  } else {
    observer = facebook.getObserver(treatment_group, logger);
  }
  observer.observe(container, config);
};
