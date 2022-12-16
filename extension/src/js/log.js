import { CONFIG } from "./config";

const LOG_ENDPOINT = CONFIG.serverEndpoint + "/log_tweets";

export const getLogger = function (workerID, installCode, treatment_group) {
  const LOG = [];

  const uploadLog = async () => {
    const response = await fetch(LOG_ENDPOINT, {
      method: "POST",
      body: JSON.stringify({
        username: workerID,
        password: installCode,
        tweets: LOG,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const response_json = await response.json();
    const status = response_json.status == 200;
    if (status) {
      LOG.length = 0;
    }
  };

  const flushLog = function () {
    // Flush the log to the cloud
    if (LOG.length > 0) {
      uploadLog().then(() => {});
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

  return {
    logEvent,
    flushLog,
  };
};
