import { parseTweetHTML } from "./twitter_parser";
import { BLACKLIST_ACCOUNTS } from "./accounts";
import { chatSVG, checkmarkSVG } from "./twitter_svgs";

let checkEligibility = true;
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
    if (BLACKLIST_ACCOUNTS.includes(tweet.data.author)) {
      labels.add(AUTHOR);
    }

    // Value 0 is control group
    if (treatment_group != 0) {
      // Account-only blacklist
      if (labels.has(AUTHOR)) {
        tweet.nodes.node.innerHTML = "";
        tweet.nodes.node.setAttribute("isHidden", true);
        tweet.data.isHidden = true;
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
  }
};

// link, or img
const DUMMY_TWEET = {
  text: `Under the Biden-Harris Administration, surprise overdraft fees and bounced check victim fees are now illegal.
 
Here's where you may experience these junk fees:`,
  link: {
    img: "https://uploads.dailydot.com/2018/10/olli-the-polite-cat.jpg",
    domain: "nytimes.com",
    headline: "A link to a headline",
    lede: "Lorem ipsum dolor sit amet, consectetur adipiscing elit ...",
    href: "https://google.com",
  },
  socialContext: "Injected Into Your Feed",
  socialContextLink: "youtube.com",
  userName: "The White House",
  userHandle: "WhiteHouse",
  userNameLink: "twitter.com/FoxNews",
  tweetLink: "https://twitter.com/WhiteHouse/status/1585376693430124544",
  avatar:
    "https://pbs.twimg.com/profile_images/738810295301246977/sJKDqlWh_400x400.jpg",
  likeCount: 1337,
  replyCount: 42,
  retweetCount: 666,
  preText: "generic pretext",
  isVerified: true,
};

let transformTweet = function (obj, rep) {
  obj.nodes.text.innerHTML = `<span>${rep.text}</span>`;

  // Remove all internal embedded media
  if (obj.nodes.body.embeddedMedia.length > 0) {
    for (let i = 0; i < obj.nodes.body.embeddedMedia.length; i++) {
      obj.nodes.body.embeddedMedia[i].remove();
    }
  }

  let injectedMedia = document.createElement("div");
  if (rep.img) {
    // create internal media
    injectedMedia.innerHTML = `<div class='media'><img src=${rep.img} /></div>`;
  } else if (rep.link) {
    // TK is it possible to have a link with no image?
    injectedMedia.innerHTML = `<a class='injected-link' href='${rep.link.href}'>
    <div class='media'>
      <div class='header-img'><img src=${rep.link.img} height=100% /></div>
      <div class='link-body'>
        <span class='link-domain'>${rep.link.domain}</span>
        <span class='link-headline'>${rep.link.headline}</span>
        <span class='link-lede'>${rep.link.lede}</span>
      </div>
    </div>
    </a>
    `;
    injectedMedia.onclick = function (evt) {
      evt.stopImmediatePropagation();
    };
  }
  if (obj.nodes.body.tweetControls) {
    obj.nodes.body.tweetControls.insertAdjacentElement(
      "beforebegin",
      injectedMedia
    );
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
  obj.nodes.avatar.innerHTML = `<div class='avatarContainer'><img class='avatar' src=${rep.avatar} height=100% /></div>`;
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

  if (obj.nodes.avatarExpandThread != null) {
    const threadLink = obj.nodes.expandThreadLink;
    if (threadLink) {
      threadLink.setAttribute("href", rep.tweetLink);
    } else {
      console.log("no link found!", obj.nodes.avatarExpandThread);
    }
    obj.nodes.avatarExpandThread.innerHTML = `<div class='avatarContainerExpandThread'><img class='avatar' src=${rep.avatar} width=32px height=32px /></div>`;
  } else {
    obj.nodes.tweetFooter.map((a) => a.remove());
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

let removeInjectedMedia = function () {
  // separate function, because it seems like twitter async hydrates video
  const injectedNodes = document.querySelectorAll("[injected=true]");
  for (const node of injectedNodes) {
    const media = node.querySelectorAll("[data-testid=tweetPhoto]");
    for (const card of media) {
      card.remove();
    }
  }
};

let isEligible = function (tweet) {
  if (tweet == null) {
    dlog("ineligible: tweet is null");
    return false;
  }
  if (tweet.nodes.body.parseError == true) {
    dlog("ineligible: tweet is not parsed correctly");
    return false;
  }
  if (tweet.data.thread.isThread && !tweet.data.thread.isCollapsedThread) {
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

// injectionMap maps tweet IDs to dummy_tweets, or to "no_replace" string
let injectTweets = function (tweets, treatment_group, logger) {
  for (let i = 0; i < tweets.length; i++) {
    if (isEligible(tweets[i])) {
      if (Math.random() < 1.9) {
        transformTweet(tweets[i], DUMMY_TWEET);
        tweets[i].data.injectedTweet = DUMMY_TWEET;
      } else {
        injectionMap.add(tweets[i].data.id);
      }
    } else {
    }
  }
};

const parseTweets = function (children) {
  let prevNode = null;
  const tweets = [];
  for (let i = 0; i < children.length; i++) {
    const tweet = parseTweetHTML(children[i], prevNode);

    tweets.push(tweet);
    prevNode = tweet;
  }
  return tweets;
};

let monitorTweets = function (tweets, logger) {
  for (const tweet of tweets) {
    if (tweet) {
      if (!tweet.nodes.node.getAttribute("hasObserver")) {
        let observer = new IntersectionObserver(
          function (entries) {
            // isIntersecting is true when element and viewport are overlapping
            // isIntersecting is false when element and viewport don't overlap
            if (entries[0].isIntersecting === true) {
              console.log("Logging view of ", tweet);
              logger.logEvent(tweet.data, "view");
            }
          },
          { threshold: [0.2] }
        );
        observer.observe(tweet.nodes.node);
        tweet.nodes.node.setAttribute("hasObserver", true);
      }
    }
  }
};

let processFeed = function (document, observer, treatment_group, logger) {
  let timelineDiv = document.querySelector(
    '[aria-label="Timeline: Your Home Timeline"]'
  );
  if (
    timelineDiv != undefined &&
    timelineDiv.childNodes[0].childNodes.length > 1
  ) {
    // disable the observer when modifying itself, otherwise its infinite loop
    observer.disconnect();

    const parentNode = timelineDiv.childNodes[0];
    const children = parentNode.childNodes;
    const tweets = parseTweets(children);
    filterTweets(tweets, treatment_group, logger);
    injectTweets(tweets, treatment_group, logger);
    monitorTweets(tweets, logger);
    disableInjectedContextMenus();
    removeInjectedMedia();

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
