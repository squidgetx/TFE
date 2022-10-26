import { BLACKLIST_ACCOUNTS } from "./accounts";
const BLACKLIST_TEXTS = ["foxnews.com", "foxbusiness.com", "fox.com/news"];

let checkEligibility = true;
let lastObservedLength = 0;

/*
 * Return HTML
 */
let renderTweet = (tweetObj) => {
  let element = document.createElement("div");
  element.innerHTML = "<p>Hello World</p>";
  element.classList.add("ext_tweet_container");
  return element;
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
      if (text.toLowerCase().includes(blacklist_text)) {
        return true;
      }
    }
  }
  return false;
};

// Extract text content from a node with arbitrary depth of children

/*
 * arg: HTMLDOMElement
 * Returns an object containing pointers to the HTML elements
 * containing the major components of the tweet
 */
let parseTweetHTML = function (node) {
  const obj = {
    nodes: {},
    checks: {},
  };
  obj.nodes.text = node.querySelectorAll('[data-testid="tweetText"]')[0];
  obj.nodes.userName = node.querySelectorAll('[data-testid="User-Names"]')[0];
  obj.nodes.avatar = node.querySelectorAll(
    '[data-testid="Tweet-User-Avatar"]'
  )[0];
  obj.nodes.cardWrapper = node.querySelectorAll(
    '[data-testid="card.wrapper"]'
  )[0];
  obj.nodes.tweetPhoto = node.querySelector('[data-testid="tweetPhoto"]');
  obj.nodes.retweet = node.querySelector('[data-testid="retweet"]');
  obj.nodes.retweetCount = obj.nodes.retweet
    ? obj.nodes.retweet.querySelector(
        '[data-testid="app-text-transition-container"]'
      )
    : null;

  obj.nodes.reply = node.querySelector('[data-testid="reply"]');
  obj.nodes.replyCount = obj.nodes.reply
    ? obj.nodes.reply.querySelector(
        '[data-testid="app-text-transition-container"]'
      )
    : null;

  obj.nodes.like = node.querySelector('[data-testid="like"]');
  obj.nodes.likeCount = obj.nodes.like
    ? obj.nodes.like.querySelector(
        '[data-testid="app-text-transition-container"]'
      )
    : null;

  obj.nodes.caret = node.querySelector('[area-label="More"]');
  obj.nodes.share = node.querySelector('[aria-label="Share Tweet"]');
  obj.nodes.socialContext = node.querySelector('[data-testid="socialContext"]');
  obj.nodes.node = node;
  obj.isThread = obj.nodes.avatar
    ? obj.nodes.avatar.nextSibling !== null
    : undefined;

  // Check to see if there are other items embedded in the tweet
  // Twitter doesn't provide a data-testid property for
  // retweets that are text-only, for example
  if (obj.nodes.text !== undefined) {
    // Go up the DOM tree until there are two or more children
    let parent = obj.nodes.text.parentNode;
    while (true) {
      if (!parent) {
        obj.checks.embeddedMediaFound = false;
        break;
      }
      const num_components = parent.childNodes.length;
      if (num_components > 1) {
        // we found the tweet content root node
        // check that the text tweet is the first node
        for (let i = 0; i < parent.childNodes.length; i++) {
          let container = parent.childNodes[i];
          if (container.contains(obj.nodes.text)) {
            obj.nodes.tweetTextContainer = container;
            if (i != 0) {
              obj.nodes.preText = Array.from(parent.childNodes).slice(0, i);
            }
            break;
          }
        }
        // find the tweet controls
        let tweetControls = parent.lastChild;
        if (!tweetControls.contains(obj.nodes.like)) {
          // Sometimes there's another element here, usually a "promoted" tag
          obj.nodes.footer = tweetControls;
          tweetControls = tweetControls.previousSibling;
          obj.nodes.embeddedMedia = Array.from(parent.childNodes).slice(
            1,
            num_components - 2
          );
        } else {
          obj.nodes.embeddedMedia = Array.from(parent.childNodes).slice(
            1,
            num_components - 1
          );
        }
        obj.nodes.tweetControls = tweetControls;
        break;
      }
      parent = parent.parentNode;
    }
  }

  // set whether the node is a reply
  if (obj.nodes.preText) {
    for (const pt of obj.nodes.preText) {
      if (pt.innerText.includes("Replying to")) {
        obj.isReply = true;
      }
    }
  }

  // get the social context "header"
  obj.nodes.socialContextContainer = null;
  if (obj.nodes.socialContext) {
    let parent = obj.nodes.socialContext.parentNode;
    while (true) {
      if (!parent) {
        break;
      }
      const num_components = parent.childNodes.length;
      if (num_components > 1) {
        if (
          parent.firstChild.contains(obj.nodes.socialContext) &&
          parent.lastChild.contains(obj.nodes.text)
        ) {
          obj.nodes.socialContextContainer = parent.firstChild;
          break;
        }
      }
      parent = parent.parentNode;
    }
  }

  for (let key in obj.nodes) {
    if (obj.nodes[key]) {
      obj[key] = obj.nodes[key].innerText;
    }
  }
  return obj;
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
    let labels = new Set();
    const AUTHOR = "author";
    const LINK = "link";
    const SHOW = "show";
    const HIDE = "hide";
    if (BLACKLIST_ACCOUNTS.includes(tweet_obj.author)) {
      labels.add(AUTHOR);
    }
    if (tweet_obj.blacklist_text) {
      labels.add(LINK);
    }

    let action = SHOW;

    // Value 0 is control group
    if (treatment_group == 1) {
      // Link-only blacklist
      if (labels.has(LINK)) {
        tweet.innerHTML = "";
        action = HIDE;
      }
    } else if (treatment_group == 2) {
      // Account-only blacklist
      if (labels.has(AUTHOR)) {
        action = HIDE;
        tweet.innerHTML = "";
      }
    } else if (treatment_group == 3) {
      // Both
      if (labels.size > 0) {
        tweet.innerHTML = "";
        action = HIDE;
      }
    }

    tweet_obj.labels = labels;

    if (labels.size > 0) {
      console.log(tweet_obj);
      if (checkEligibility) {
        chrome.storage.sync.set({ eligible: true }, () => {
          console.log("Eligibilty set to true");
        });
        checkEligibility = false;
      }
    }

    logger.logEvent(tweet_obj, action);
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
  if (obj.nodes.embeddedMedia) {
    for (let i = 0; i < obj.nodes.embeddedMedia.length; i++) {
      obj.nodes.embeddedMedia[i].remove();
    }
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
  obj.nodes.tweetControls.parentNode.replaceChild(
    obj.nodes.tweetControls.cloneNode(true),
    obj.nodes.tweetControls
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
  for (let i = 0; i < feedParent.childNodes.length; i++) {
    const node = feedParent.childNodes[i];
    const obj = parseTweetHTML(node);
    transformTweet(obj);
    console.log(obj);
  }
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
      filterTweets(children, treatment_group, logger);
      injectTweets(parentNode, treatment_group, logger, lastObservedLength);
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
