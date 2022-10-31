import AWS from "aws-sdk";
import { CONFIG } from "./config";

AWS.config.update({
  region: CONFIG.awsRegion,
  accessKeyId: CONFIG.awsAccessKey,
  secretAccessKey: CONFIG.awsSecretAccessKey,
});

const kinesis = new AWS.Kinesis({
  apiVersion: "2013-12-02",
});

export const getLogger = function (workerID, treatment_group) {
  const seen_object_ids = new Set();
  const LOG = [];

  const uploadLog = async (log) => {
    const records = log.map((entry) => {
      return {
        Data: JSON.stringify(entry),
        PartitionKey: workerID,
      };
    });
    LOG.length = 0;
    console.log("uploading log");
    try {
      const response = await kinesis
        .putRecords({
          Records: records,
          StreamName: CONFIG.awsKinesisStreamName,
        })
        .promise();
      return response;
    } catch (e) {
      console.log(e);
      return e;
    }
  };

  const flushLog = function () {
    // Flush the log to the cloud
    if (LOG.length > 0) {
      uploadLog(LOG);
    }
  };

  const logEvent = function (obj, key) {
    obj.event = key;
    obj.time = Date.now();
    obj.workerID = workerID;
    obj.treatment_group = treatment_group;
    if (seen_object_ids.has(obj.id)) {
      // Don't log objects we already have seen in the current session
      return;
    }
    LOG.push(obj);
    if (LOG.length >= 5) {
      flushLog();
    }
    seen_object_ids.add(obj.id);
  };

  setInterval(flushLog, 1000 * 60 * CONFIG.logUploadRateMinutes);

  return {
    logEvent,
    flushLog,
  };
};
