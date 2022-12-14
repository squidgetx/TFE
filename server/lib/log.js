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

module.exports = async function (username, data) {
  // send the data to kinesis
  const records = data.map((entry) => {
    return {
      Data: JSON.stringify(entry),
      PartitionKey: username,
    };
  });

  const response = await kinesis
    .putRecords({
      Records: records,
      StreamName: "CONFIG.awsKinesisStreamName",
    })
    .promise();
  if (response.FailedRecordCount === 0) {
    response.status = 200;
  }
  return response;
};
