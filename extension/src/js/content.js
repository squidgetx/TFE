import * as twitter from "./twitter";
import * as facebook from "./facebook";
import { getLogger } from "./log";

const UPLOAD_RATE_MIN = 2;

chrome.storage.sync.get(["workerID", "treatment_group"], function (result) {
  const workerID = result.workerID;
  const treatment_group = result.treatment_group;
  if (treatment_group == undefined) {
    // User has not yet configured the extension
    return;
  }
  const logger = getLogger(workerID, treatment_group);
  console.log(
    `Twitter Experiment Loaded, respondent ID ${workerID}, treatment group ${treatment_group}`
  );

  /*
   * Set up observer
   */

  // Every 5 minutes send log data to server
  setInterval(logger.flushLog, 1000 * 60 * UPLOAD_RATE_MIN);

  setupFeedObserver(treatment_group, logger);
  // Re attach the observer when the back button is used, or
  // when a link is clicked
  window.addEventListener("popstate", function () {
    console.log("state changed");
    setupFeedObserver(treatment_group, logger);
  });
  window.addEventListener("click", function () {
    console.log("clicked changed");
    setupFeedObserver(treatment_group, logger);
  });
});

let setupFeedObserver = function (treatment_group, logger) {
  // The timeline is loaded with async JS
  // So, we want to trigger filtering logic whenever its modified
  const config = {
    attributes: false,
    childList: true,
    subtree: true,
    characterData: true,
  };
  let container = document.documentElement || document.body;
  let observer;
  if (window.location.hostname.includes("twitter")) {
    console.log("using twitter observer");
    observer = twitter.getObserver(treatment_group, logger);
  } else {
    console.log("using facebook observer");
    observer = facebook.getObserver(treatment_group, logger);
  }
  observer.observe(container, config);
};
