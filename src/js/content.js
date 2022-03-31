import AWS from "aws-sdk";

const BLACKLIST_ACCOUNTS = ["FoxNews"];
const BLACKLIST_TEXTS = ["folks"];
const UPLOAD_RATE_MIN = 2;
const S3_BUCKET = "twitter-feed-test";
const REGION = "us-east-2";

const seen_tweets = new Set();

let LOG = [];
let treatment_group = "";
let workerID = "";

/*
 * Logging code
 */

chrome.storage.sync.get(["accessKey"], function (result) {
  AWS.config.update({
    region: REGION,
    accessKeyId: "AKIA3VNR4JRZMN3RUZHJ",
    secretAccessKey: result.accessKey,
  });
});

const s3Client = new AWS.S3({
  params: { Bucket: S3_BUCKET },
  region: REGION,
});

const uploadLog = async (log) => {
  const params = {
    Body: JSON.stringify(log),
    Key: `${workerID}_${Date.now()}`,
    ContentType: "text",
  };

  console.log("uploading log");
  try {
    const s3Response = await s3Client.putObject(params).promise();
    return s3Response;
  } catch (e) {
    console.log(e);
    return e;
  }
};

let logEvent = function (tweet_obj, key) {
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
  seen_tweets.add(tweet_obj.id);
};

let flushLog = function () {
  // Flush the log to S3
  uploadLog(LOG);
  LOG = [];
};

/*
 * Tweet filtering section
 */

let parseAuthor = (tweet) => {
  let links = Array.from(tweet.getElementsByTagName("a"));
  let re = /^http(s?):\/\/twitter\.com\/([^\/]*)$/;
  let matches = links
    .map((a) => {
      let m = a.href.match(re);
      if (m && m.length > 1) {
        return m[2];
      }
      return null;
    })
    .filter((a) => a != null);
  if (matches) {
    return matches[0];
  }
  return null;
};

let parseId = (tweet) => {
  let links = Array.from(tweet.getElementsByTagName("a"));
  let re = /^http(s?):\/\/twitter\.com\/([^\/]*)\/status\/([0-9]+)$/;
  let matches = links
    .map((a) => {
      let m = a.href.match(re);
      if (m && m.length > 2) {
        return m[3];
      }
      return null;
    })
    .filter((a) => a != null);
  if (matches) {
    return matches[0];
  }
  return null;
};

let parseTime = (tweet) => {
  let time = Array.from(tweet.getElementsByTagName("time"));
  if (time.length > 0) {
    return time[0].dateTime;
  }
  return null;
};

let parseText = (tweet) => {
  let span = Array.from(tweet.getElementsByTagName("span"));
  return [
    ...new Set(
      span
        .filter((s) => s.childNodes.length == 1)
        .map((s) => s.parentNode.textContent)
    ),
  ];
};

let checkText = function (text_arr) {
  // Check if any of the text in this tweet should be blacklisted
  for (const text of text_arr) {
    if (text === undefined) {
      continue;
    }
    for (const blacklist_text of BLACKLIST_TEXTS) {
      if (text.includes(blacklist_text)) {
        return true;
      }
    }
  }
  return false;
};

let parseTweet = function (tweet) {
  let tweet_obj = {
    id: parseId(tweet),
    author: parseAuthor(tweet),
    text: parseText(tweet),
    time: parseTime(tweet),
  };
  tweet_obj.blacklist_text = checkText(tweet_obj.text);
  return tweet_obj;
};

let filterTweets = function (children, treatment_group) {
  for (const tweet of children) {
    let tweet_obj = parseTweet(tweet);
    if (treatment_group == 1) {
      // Link-only blacklist
      if (tweet_obj.blacklist_text) {
        tweet.innerHTML = "";
      }
    } else if (treatment_group == 2) {
      // Account-only blacklist
      if (BLACKLIST_ACCOUNTS.includes(tweet_obj.author)) {
        tweet.innerHTML = "";
      }
    } else if (treatment_group == 3) {
      // Both
      if (
        BLACKLIST_ACCOUNTS.includes(tweet_obj.author) ||
        tweet_obj.blacklist_text
      ) {
        tweet.innerHTML = "";
      }
    }
    // Value 0 is control group

    if (tweet.innerHTML == "") {
      logEvent(tweet_obj, "hide");
    } else {
      logEvent(tweet_obj, "show");
    }
  }
};

chrome.storage.sync.get(["workerID"], function (result) {
  workerID = result.workerID;
});

/*
 * Set up observer (only if the treatment group is loaded)
 */

chrome.storage.sync.get(["treatment_group"], function (result) {
  console.log("Twitter Experiment Loaded!");
  treatment_group = result.treatment_group;

  let container = document.documentElement || document.body;

  // Every 5 minutes send tweet data to server
  setInterval(flushLog, 1000 * 60 * UPLOAD_RATE_MIN);

  // Configuration of the observer:
  const config = {
    attributes: false,
    childList: true,
    subtree: true,
    characterData: true,
  };

  // The timeline is loaded with async JS
  // So, we want to trigger filtering logic whenever its modified
  let observer = new MutationObserver(function (mutations) {
    let timelineDiv = document.querySelectorAll(
      '[aria-label="Timeline: Your Home Timeline"]'
    )[0];
    if (
      timelineDiv != undefined &&
      timelineDiv.childNodes[0].childNodes.length > 1
    ) {
      console.log(
        "loading custom timeline treatment group" + result.treatment_group
      );
      // disable the observer when modifying itself, otherwise its infinite loop
      observer.disconnect();

      let children = timelineDiv.childNodes[0].childNodes;
      filterTweets(children, result.treatment_group);

      // re-register, for when the user scrolls
      observer.observe(timelineDiv, config);
    }
  });
  observer.observe(container, config);
});
