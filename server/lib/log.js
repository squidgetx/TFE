const AWS = require("aws-sdk");
const CONFIG = require("./config");

AWS.config.update({
  region: CONFIG.awsRegion,
  accessKeyId: CONFIG.awsAccessKey,
  secretAccessKey: CONFIG.awsSecretAccessKey,
});

const kinesis = new AWS.Kinesis({
  apiVersion: "2013-12-02",
});

// Send data to Amazon Kinesis queue configured in config
module.exports = async function (username, data) {
  const records = data.map((entry) => {
    return {
      Data: JSON.stringify(entry),
      PartitionKey: username,
    };
  });

  try {
    const response = await kinesis
      .putRecords({
        Records: records,
        StreamName: CONFIG.awsKinesisStreamName,
      }).promise()
    if (response.FailedRecordCount === 0) {
      response.status = 200;
    }
    return response;
  } catch (error) {
    console.log(`ERROR: kinesis log failed, message: ${error.message}`)
    const err = new Error("log failed")
    err.status = 500
    return next(err)
  }
};
