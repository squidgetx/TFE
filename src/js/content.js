// Your code here...
//const widgets = require("expose-loader?exposes=twttr!./widgets.js");

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

let parseTweet = function (tweet) {
  let tweet_obj = {
    id: parseId(tweet),
    author: parseAuthor(tweet),
    text: parseText(tweet),
    time: parseTime(tweet),
  };
  return tweet_obj;
};

let filterTweets = function (children, blacklist) {
  for (const tweet of children) {
    let tweet_obj = parseTweet(tweet);
    if (blacklist.includes(tweet_obj.author)) {
      tweet.innerHTML = "<p>This tweet was removed</p>";
      console.log("removing", tweet_obj);
    }
  }
};

console.log("Twitter Experiment Loaded!");
// Pass in the target node, as well as the observer options
var container = document.documentElement || document.body;

// Configuration of the observer:
var config = {
  attributes: false,
  childList: true,
  subtree: true,
  characterData: true,
};

// Create an observer instance
var extensionOrigin = "chrome-extension://" + chrome.runtime.id;
var observer = new MutationObserver(function (mutations) {
  let timelineDiv = document.querySelectorAll(
    '[aria-label="Timeline: Your Home Timeline"]'
  )[0];
  if (
    timelineDiv != undefined &&
    timelineDiv.childNodes[0].childNodes.length > 1
  ) {
    console.log("loading custom timeline");
    observer.disconnect();
    let children = timelineDiv.childNodes[0].childNodes;
    filterTweets(children, ["FoxNews"]);
    observer.observe(timelineDiv, config);
  }
});
observer.observe(container, config);
