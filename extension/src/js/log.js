import { CONFIG } from "./config";

// return a logger object which exposes the logEvent and flushLog methods
// logged events are written to the server on a regular basis as well as 
// whenever the log reaches a certain size. This design is used to compromise
// between sending too many requests to the server and ensuring that the majority 
// of logged data is sent to the server.

export const getLogger = function (workerID, installCode, treatment_group) {

  // store logged events in an array
  const LOG = [];

  // upload the log to the cloud when LOG_SIZE events are recorded
  const LOG_SIZE = 5;

  // Send all log data to the server
  // Sends a message to the background task, which will handle sending
  // the data to the server
  const flushLog = function () {
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

  // write data (obj) to the local log.
  // the second arg is a string describing the event that we are logging
  // once the local log has FLUSH_FREQ events, we send the log data to the server
  const logEvent = function (obj, event) {
    obj.event = event;
    obj.time = Date.now();
    obj.workerID = workerID;
    obj.treatment_group = treatment_group;
    LOG.push(obj);
    if (LOG.length >= LOG_SIZE) {
      flushLog();
    }
  };

  const logEventAndFlush = function (obj, event) {
    logEvent(obj, event);
    flushLog();
  }

  // empty the log once per CONFIG.logUploadRateMinutes 
  setInterval(flushLog, 1000 * 60 * CONFIG.logUploadRateMinutes);

  // listen for message from the background task so that we know when 
  // log uploads are successful
  chrome.runtime.onMessage.addListener((message) => {
    if (message.message.name == "logEvent") {
      console.log("uploaded log ", message.message.status);
    }
  });

  return {
    logEvent,
    flushLog,
    logEventAndFlush,
  };
};
