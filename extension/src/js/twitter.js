import { parseTweetHTML } from "./twitter_parser";
import { BLACKLIST_ACCOUNTS } from "./accounts";

let checkEligibility = true;
let lastObservedLength = 0;

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
      console.log(tweet);
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

let transformTweet = function (obj) {
  if (obj.nodes.text === undefined) {
    return;
  }
  if (obj.isThread == true) {
    return;
  }
  obj.nodes.text.innerHTML =
    "<span>I'm baby artisan ennui helvetica put a bird on it air plant, street art thundercats health goth mumblecore bespoke normcore retro. Unicorn forage skateboard, biodiesel marfa meggings banjo fanny pack. Blue bottle single-origin coffee cred lo-fi, humblebrag praxis subway tile woke palo santo marfa mustache helvetica fixie paleo green juice. Four loko copper mug XOXO pug pickled leggings.</span>";
  //obj.nodes.tweetControls.remove();
  if (obj.nodes.embeddedMedia.length > 0) {
    for (let i = 1; i < obj.nodes.embeddedMedia.length; i++) {
      obj.nodes.embeddedMedia[i].remove();
    }
    obj.nodes.embeddedMedia[0].innerHTML =
      "<div class='media'><img src='https://uploads.dailydot.com/2018/10/olli-the-polite-cat.jpg' width=100% /></div>";
  }
  if (obj.nodes.footer) {
    obj.nodes.footer.remove();
  }
  if (obj.nodes.socialContext) {
    obj.nodes.socialContextContainer.innerHTML = "<p></p>";
  }
  obj.nodes.userName.innerHTML =
    "<span class='userName'>arbitrary user</span><span class='userHandle'>@username</span> <span class='dot'>\u00B7</span> <span class='time'>42m</span>";
  obj.nodes.avatar.innerHTML =
    "<div class='avatarContainer'><img class='avatar' src='https://pbs.twimg.com/profile_images/1459143267673677853/xtIvtfZp_400x400.jpg' width=48 height=48/></div>";
  obj.nodes.replyCount.innerHTML = "<span class='metric'>42</span>";
  obj.nodes.retweetCount.innerHTML = "<span class='metric'>666</span>";
  obj.nodes.likeCount.innerHTML = "<span class='metric'>1337</span>";
  obj.nodes.body.tweetControls.parentNode.replaceChild(
    obj.nodes.body.tweetControls.cloneNode(true),
    obj.nodes.body.tweetControls
  );
  obj.nodes.node.onclick = function () {
    return false;
  };
  if (obj.nodes.preText) {
    for (let i = 0; i < obj.nodes.preText.length; i++) {
      let preTextNode = obj.nodes.preText[i];
      preTextNode.innerHTML = "Arbitrary pre-text node";
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
      caret.remove();
    }
  }
};

let injectTweets = function (
  feedParent,
  treatment_group,
  logger,
  lastObservedLength
) {
  // Make sure every N tweets is an injected tweet
  const FREQ = 5;
  const OFFSET = 3;
  let prevNode = null;
};

const parseTweets = function (children) {
  let prevNode = null;
  const tweets = [];
  for (let i = 0; i < children.length; i++) {
    tweets.push(parseTweetHTML(children[i], prevNode));
    prevNode = children[i];
  }
  console.log(tweets);
  return tweets;
};

let processFeed = function (document, observer, treatment_group, logger) {
  let timelineDiv = document.querySelectorAll(
    '[aria-label="Timeline: Your Home Timeline"]'
  )[0];
  if (
    timelineDiv != undefined &&
    timelineDiv.childNodes[0].childNodes.length > 1
  ) {
    console.log(
      "loading custom timeline treatment group with inject: " + treatment_group
    );
    // disable the observer when modifying itself, otherwise its infinite loop
    observer.disconnect();

    const parentNode = timelineDiv.childNodes[0];
    const children = parentNode.childNodes;
    if (children.length != lastObservedLength) {
      console.log("Timeline length changed: ", lastObservedLength);
      const tweets = parseTweets(children);
      filterTweets(tweets, treatment_group, logger);
      injectTweets(tweets, treatment_group, logger, lastObservedLength);
      lastObservedLength = children.length;
    }
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
