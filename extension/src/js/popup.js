import AWS from "aws-sdk";
import sjcl from "sjcl";

const UNINSTALL_ENDPOINT =
  "http://ec2-34-239-146-85.compute-1.amazonaws.com:3000";
const VALID_HASH =
  "749dce75c591b7b72e4034789b2f6d55f6dcb2dd7b4f9d8f5d56137d573de70f";
const S3_BUCKET = "twitter-feed-test";
const REGION = "us-east-2";
const INSTALL_CODE = "tft_ic0";

window.onload = function () {
  let writeInstallationEvent = async (accessKey, workerID, treatment_group) => {
    AWS.config.update({
      region: REGION,
      accessKeyId: "AKIA3VNR4JRZMN3RUZHJ",
      secretAccessKey: accessKey,
    });
    const s3Client = new AWS.S3({
      params: { Bucket: S3_BUCKET },
      region: REGION,
    });
    const params = {
      Body: JSON.stringify({
        workerID: workerID,
        treatment_group: treatment_group,
        time: Date.now(),
        event: "install",
      }),
      Key: `${workerID}_${Date.now()}`,
      ContentType: "text",
    };
    try {
      const s3Response = await s3Client.putObject(params).promise();
      return s3Response;
    } catch (e) {
      console.log(e);
      return e;
    }
  };

  let update = function (result) {
    if (result) {
      document.getElementById(
        "workerIDform"
      ).innerHTML = `<p>You are signed in with Worker ID: ${result}</p><p>Your installation code is: <p class='indent'><b>${INSTALL_CODE}_${result}</b></p></p>`;
      chrome.runtime.setUninstallURL(
        `${UNINSTALL_ENDPOINT}?id=${result}&event=uninstall`
      );
    }
  };

  let error = function (err_msg) {
    console.log(err_msg);
    document.getElementById("error_msg").innerHTML = err_msg;
  };

  // Registration flow
  // Save worker ID in chrome storage
  // At this time, also register the treatment group with random sample
  document
    .getElementById("workerIDform")
    .addEventListener("submit", (event) => {
      event.preventDefault();

      let workerID = document.getElementById("workerID").value;
      let accessKey = document.getElementById("password").value;
      let treatment_group = Math.floor(Math.random() * 3);

      // validation
      if (!workerID) {
        error("You must enter a worker ID");
        return;
      }
      const myBitArray = sjcl.hash.sha256.hash(accessKey);
      const myHash = sjcl.codec.hex.fromBits(myBitArray);
      // a little insecure to put the hash of the access token
      // in the source code like this... but YOLO for now
      if (myHash != VALID_HASH) {
        error("Invalid passcode");
        return;
      }

      chrome.storage.sync.set({ workerID: workerID }, function () {
        console.log("WorkerID was set as " + workerID);
      });
      chrome.storage.sync.set(
        { treatment_group: treatment_group },
        function () {
          console.log("Group was set");
        }
      );
      chrome.storage.sync.set({ accessKey: accessKey }, () => {
        console.log("Access key was set");
      });
      writeInstallationEvent(accessKey, workerID, treatment_group);
      update(workerID);
    });

  chrome.storage.sync.get(["workerID"], function (result) {
    console.log("result is " + result.workerID);
    update(result.workerID);
  });
};

//chrome.storage.sync.clear();
