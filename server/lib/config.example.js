// Rename to config.js and supply proper credentials
module.exports = {
    region: "us-east-2",
    accessKeyId: "awsAccessKey",
    secretAccessKey: "awsSecretAccessKey",
    awsKinesisStreamName: "kinesisStreamName",
    twitterBearerToken: "",
    qualtricsAPIToken: "",
    dbConnectionString: "postgresql://<user>:<password>@<hostname>:<port>/<db_name>?sslmode=require"
}