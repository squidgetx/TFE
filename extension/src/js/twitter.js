import { parseTweetHTML } from "./twitter_parser";
import { BLACKLIST_ACCOUNTS } from "./accounts";
import { chatSVG, checkmarkSVG } from "./twitter_svgs";

let checkEligibility = true;
let lastObservedLength = 0;
let injectionMap = new Set();

let dlog = function (str) {
  if (false) {
    console.log(str);
  }
};

let filterTweets = function (tweets, treatment_group, logger) {
  for (const tweet of tweets) {
    if (tweet == null) {
      continue;
    }
    let labels = new Set();
    const AUTHOR = "author";
    const SHOW = "show";
    const HIDE = "hide";
    if (BLACKLIST_ACCOUNTS.includes(tweet.data.author)) {
      labels.add(AUTHOR);
    }

    let action = SHOW;

    // Value 0 is control group
    if (treatment_group != 0) {
      // Account-only blacklist
      if (labels.has(AUTHOR)) {
        action = HIDE;
        tweet.nodes.node.innerHTML = "";
      }
    }

    tweet.data.labels = labels;

    if (labels.size > 0) {
      if (checkEligibility) {
        chrome.storage.sync.set({ eligible: true }, () => {
          console.log("Eligibilty set to true");
        });
        checkEligibility = false;
      }
    }

    logger.logEvent(tweet.data, action);
  }
};

const DUMMY_TWEET = {
  text: `Under the Biden-Harris Administration, surprise overdraft fees and bounced check victim fees are now illegal.
 
Here's where you may experience these junk fees:`,
  img: "https://uploads.dailydot.com/2018/10/olli-the-polite-cat.jpg",
  socialContext: "Injected Into Your Feed",
  socialContextLink: "youtube.com",
  userName: "The White House",
  userHandle: "WhiteHouse",
  userNameLink: "twitter.com/FoxNews",
  tweetLink: "https://twitter.com/WhiteHouse/status/1585376693430124544",
  avatar: "https://uploads.dailydot.com/2018/10/olli-the-polite-cat.jpg",
  likeCount: 1337,
  replyCount: 42,
  retweetCount: 666,
  preText: "generic pretext",
  isVerified: true,
};

let transformTweet = function (obj, rep) {
  obj.nodes.text.innerHTML = `<span>${rep.text}</span>`;
  if (obj.nodes.body.embeddedMedia.length > 0) {
    for (let i = 1; i < obj.nodes.body.embeddedMedia.length; i++) {
      obj.nodes.body.embeddedMedia[i].innerHTML = "";
    }
    obj.nodes.body.embeddedMedia[0].innerHTML = `<div class='media'><img src=${rep.img} width=100% /></div>`;
  }
  if (obj.nodes.socialContextContainer) {
    obj.nodes.socialContextContainer.innerHTML = `
    <div class='socialContextContainer'>
      <span class='socialContextIcon'>${chatSVG}</span>
      <a class='socialContext' href="${rep.socialContextLink}">${rep.socialContext}</a>
      <span class='dot'>\u00B7</span> 
      <a class='socialContextSeeMore' href="${rep.socialContextLink}">See More</a>
      </div>
  `;
  }
  let verifiedHTML = "";
  if (rep.isVerified) {
    verifiedHTML = `<span class='checkmarkSVG'>${checkmarkSVG}</span>`;
  }
  obj.nodes.userName.innerHTML = `
      <span class='userName'>
    <a href="${rep.userNameLink}" class='userName'>
        ${rep.userName}
    </a>
      </span>
      ${verifiedHTML}
      <span class='userHandle'>
    <a href="${rep.userNameLink}" class='userHandle'>
        @${rep.userHandle}
    </a> 
      </span>

    <span class='dot'>\u00B7</span> 

    <span class='time'>
    <a href="${rep.tweetLink}" class='time'>
    42m
    </a>
    </span>
  `;
  obj.nodes.userName.onclick = function (e) {
    e.stopPropagation();
  };
  obj.nodes.avatar.innerHTML = `<div class='avatarContainer'><img class='avatar' src=${rep.avatar} width=48 height=48/></div>`;
  obj.nodes.replyCount.innerHTML = `<span class='metric'>${rep.replyCount}</span>`;
  obj.nodes.retweetCount.innerHTML = `<span class='metric'>${rep.retweetCount}</span>`;
  obj.nodes.likeCount.innerHTML = `<span class='metric'>${rep.likeCount}</span>`;
  obj.nodes.like.classList.add("likeCount");
  obj.nodes.reply.classList.add("replyCount");
  obj.nodes.retweet.classList.add("retweetCount");
  obj.nodes.share.classList.add("shareButton");
  obj.nodes.body.tweetControls.parentNode.replaceChild(
    obj.nodes.body.tweetControls.cloneNode(true),
    obj.nodes.body.tweetControls
  );
  obj.nodes.like.addEventListener("onclick", function (evt) {
    evt.stopImmediatePropagation();
    return false;
  });
  obj.nodes.node.onclick = function (evt) {
    window.location.href = rep.tweetLink;
    return false;
  };
  if (obj.nodes.body.preText) {
    for (let i = 0; i < obj.nodes.preText.length; i++) {
      let preTextNode = obj.nodes.preText[i];
      preTextNode.innerHTML = rep.preText;
    }
  }

  obj.nodes.node.setAttribute("injected", "true");
};

let disableInjectedContextMenus = function () {
  // separate function, because it seems like twitter async hydrates the context menus
  const injectedNodes = document.querySelectorAll("[injected=true]");
  for (const node of injectedNodes) {
    const caret = node.querySelector("[data-testid=caret]");
    if (caret) {
      caret.onclick = function (evt) {
        evt.stopImmediatePropagation();
        return false;
      };
    }
  }
};

let isEligible = function (tweet) {
  if (tweet == null) {
    dlog("ineligible: tweet is null");
    return false;
  }
  if (tweet.data.thread.isThread) {
    dlog("ineligible: tweet is thread");
    return false;
  }
  if (tweet.nodes.text == null) {
    dlog("ineligible: tweet text node not found");
    return false;
  }
  if (tweet.data.id == null) {
    dlog("ineligible: tweet id not found");
    return false;
  }
  if (injectionMap.has(tweet.data.id)) {
    dlog("ineligible: injectionMap already has this tweet id");
    return false;
  }
  if (tweet.data.isInjected) {
    dlog("ineligible: already is injected tweet");
    return false;
  }
  return true;
};

let injectTweets = function (
  tweets,
  treatment_group,
  logger,
  lastObservedLength
) {
  for (let i = 0; i < tweets.length; i++) {
    if (isEligible(tweets[i])) {
      if (Math.random() < 1.9) {
        transformTweet(tweets[i], DUMMY_TWEET);
      } else {
        injectionMap.add(tweets[i].data.id);
      }
    } else {
      dlog("ineligible:", tweets[i]);
    }
  }
};

const parseTweets = function (children) {
  let prevNode = null;
  const tweets = [];
  for (let i = 0; i < children.length; i++) {
    let tweet = parseTweetHTML(children[i], prevNode);
    tweets.push(tweet);
    prevNode = tweet;
  }
  console.log(tweets);
  return tweets;
};

let processFeed = function (document, observer, treatment_group, logger) {
  let timelineDiv = document.querySelector(
    '[aria-label="Timeline: Your Home Timeline"]'
  );
  if (
    timelineDiv != undefined &&
    timelineDiv.childNodes[0].childNodes.length > 1 &&
    lastObservedLength != timelineDiv.childNodes[0].childNodes.length
  ) {
    dlog(
      "loading custom timeline treatment group with inject: " + treatment_group
    );
    // disable the observer when modifying itself, otherwise its infinite loop
    observer.disconnect();

    const parentNode = timelineDiv.childNodes[0];
    const children = parentNode.childNodes;
    console.log("Timeline length changed: ", lastObservedLength);
    const tweets = parseTweets(children);
    filterTweets(tweets, treatment_group, logger);
    injectTweets(tweets, treatment_group, logger, lastObservedLength);
    lastObservedLength = children.length;
    disableInjectedContextMenus();

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
    processFeed(document, observer, treatment_group, logger);
  });
  return observer;
};
