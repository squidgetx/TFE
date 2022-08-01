import AWS from "aws-sdk";
import { CONFIG } from "./config";

let s3Client = null;

chrome.storage.sync.get(["accessKey"], function (result) {
  console.log("Access key loaded: ", result.accessKey);
  AWS.config.update({
    region: CONFIG.awsRegion,
    accessKeyId: CONFIG.awsAccessKey,
    secretAccessKey: CONFIG.awsSecretAccessKey,
  });
  s3Client = new AWS.S3({
    params: { Bucket: CONFIG.awsS3Bucket },
    region: CONFIG.awsRegion,
  });
});

export const getLogger = function (workerID, treatment_group) {
  const seen_tweets = new Set();
  const LOG = [];

  const uploadLog = async (log) => {
    const params = {
      Body: JSON.stringify(log),
      Key: `${workerID}_${Date.now()}`,
      ContentType: "text",
    };
    LOG.length = 0;
    console.log("uploading log");
    try {
      const s3Response = await s3Client.putObject(params).promise();
      return s3Response;
    } catch (e) {
      console.log(e);
      return e;
    }
  };

  const flushLog = function () {
    // Flush the log to S3
    if (LOG.length > 0) {
      uploadLog(LOG);
    }
  };

  const logEvent = function (tweet_obj, key) {
    tweet_obj.event = key;
    tweet_obj.time = Date.now();
    tweet_obj.workerID = workerID;
    tweet_obj.treatment_group = treatment_group;
    if (seen_tweets.has(tweet_obj.id)) {
      // Don't log tweets that we already have seen in the current session
      return;
    }
    LOG.push(tweet_obj);
    console.log(LOG.length);
    if (LOG.length >= 5) {
      flushLog();
    }
    seen_tweets.add(tweet_obj.id);
  };
  return {
    logEvent,
    flushLog,
  };
};
