import { CONFIG } from "./config";

export const getLogger = function (workerID, installCode, treatment_group) {
  const LOG = [];

  const flushLog = function () {
    // Flush the log to the cloud
    if (LOG.length > 0) {
      chrome.runtime.sendMessage({
        message: "log",
        username: workerID,
        install_code: installCode,
        data: LOG,
      });
      LOG.length = 0;
    }
  };

  const logEvent = function (obj, key) {
    obj.event = key;
    obj.time = Date.now();
    obj.workerID = workerID;
    obj.treatment_group = treatment_group;
    LOG.push(obj);
    if (LOG.length >= 5) {
      flushLog();
    }
  };

  setInterval(flushLog, 1000 * 60 * CONFIG.logUploadRateMinutes);

  chrome.runtime.onMessage.addListener((message) => {
    if (message.message.name == "logEvent") {
      console.log("uploaded log ", message.message.status);
    }
  });

  return {
    logEvent,
    flushLog,
  };
};
