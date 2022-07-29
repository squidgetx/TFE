import { BLACKLIST_ACCOUNTS } from "./accounts";
const BLACKLIST_TEXTS = ["foxnews.com", "foxbusiness.com", "fox.com/news"];

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

let filterTweets = function (children, treatment_group, logger) {
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
      logger.logEvent(tweet_obj, "hide");
    } else {
      logger.logEvent(tweet_obj, "show");
    }
  }
};

let filterFeed = function (document, observer, treatment_group, logger) {
  let timelineDiv = document.querySelectorAll(
    '[aria-label="Timeline: Your Home Timeline"]'
  )[0];
  if (
    timelineDiv != undefined &&
    timelineDiv.childNodes[0].childNodes.length > 1
  ) {
    console.log("loading custom timeline treatment group: " + treatment_group);
    // disable the observer when modifying itself, otherwise its infinite loop

    let children = timelineDiv.childNodes[0].childNodes;
    filterTweets(children, treatment_group, logger);

    // re-register, for when the user scrolls
    const config = {
      attributes: false,
      childList: true,
      subtree: true,
      characterData: true,
    };
    observer.observe(timelineDiv, config);
  }
};

export const getObserver = function (treatment_group, logger) {
  const observer = new MutationObserver(function (mutations) {
    filterFeed(document, observer, treatment_group, logger);
  });
  return observer;
};
