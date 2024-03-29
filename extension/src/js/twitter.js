import { parseTweetHTML } from "./twitter_parser";
import { BLACKLIST_ACCOUNTS } from "./accounts";
import {
  chatSVG,
  checkmarkSVG,
  likeSVGEmpty,
  likeSVGFilled,
} from "./twitter_svgs";
import { fetch_tweet } from "./fetch_tweets";

// The proportion of tweets that should be replaced
const INJECTION_RATE = 0.99;

const seen_tweet_ids = new Set();

const dlog = function (str) {
  if (false) {
    console.log(str);
  }
};

/*
 * Given an array of tweet objects, remove any tweets that
 * need to be removed given the treatment group of the user
 * and the tweet-level characteristics
 *
 * Removed tweets should have the innerHTML deleted but
 * the parent div preserved, so we can log
 * "counterfactual" impressions of removed tweets
 */
const filterTweets = function (tweets, exp_config) {
  const treatment_group = exp_config.treatment_group;
  for (const tweet of tweets) {
    if (tweet == null || tweet.data.isInjected) {
      continue;
    }
    let labels = new Set();
    const AUTHOR = "author";
    if (BLACKLIST_ACCOUNTS.includes(tweet.data.author)) {
      labels.add(AUTHOR);
    }

    // Value 0 is control group
    if (treatment_group == 1 || treatment_group == 3) {
      // Account-only blacklist
      if (labels.has(AUTHOR)) {
        if (exp_config.debug_mode) {
          tweet.nodes.node.style.opacity = 0.1;
        } else {
          tweet.nodes.node.innerHTML = "";
        }
        tweet.nodes.node.setAttribute("isHidden", true);
        tweet.data.isHidden = true;
      }
    }

    tweet.data.labels = labels;
  }
};

/* Delete literally anything in between the tweetControls and text nodes */
const cleanTweet = function (obj) {
  const textNode = obj.nodes.text;
  const tweetControls = obj.nodes.body.tweetControls;
  let node = textNode;
  while (node) {
    // if the node has a sibling after it that is not tweetControls container, delete it
    // if there are no siblings move up one level
    let sibling = node.nextSibling;
    while (sibling) {
      if (sibling.contains(tweetControls)) {
        return obj;
      } else {
        sibling.remove();
      }
      sibling = node.nextSibling;
    }
    node = node.parentNode;
  }
};

/* return HTML ready text of the tweet */
const formatText = function (rep) {
  let text = rep.ttext.replace(rep.link_url, "");
  // TODO: hydrate regular tweets and links to Twitter accounts
  text = text.replace(/@(\w+)/g, "<a class='inline-link' href='/$1'>@$1</a>");

  const link_re = /(https:\/\/t.co\/\w+)/g;
  text = text.replace(
    link_re,
    "<a class='inline-link' href='$1' target='_blank'>$1</a>"
  );
  return text;
};

const getTimeStr = function (created_at) {
  const interval = new Date() - created_at;
  const minutes = interval / 6e4;
  const hours = minutes / 60;
  if (minutes < 60) {
    return Math.floor(minutes) + "m";
  }
  if (hours < 24) {
    return Math.floor(hours) + "h";
  }
  let language = "us-US";
  if (navigator.languages) {
    language = navigator.languages[0];
  }
  return created_at.toLocaleDateString(language, {
    month: "short",
    day: "numeric",
  });
};

const shorten_str = function (str, len) {
  if (str.length < len) {
    return str;
  }
  let i = 0;
  for (let word of str.split(" ")) {
    if (i + word.length + 1 > len) {
      break;
    }
    i += word.length + 1;
  }
  return str.slice(0, i) + "\u2026";
};

/*
 * Transform the tweet represented by the parsed tweet object obj,
 * replacing it with the tweet represented by the object rep
 */
const transformTweet = function (obj, rep) {
  console.log(rep);
  const tweetLink = `/${rep.username}/status/${rep.id}`;
  obj.nodes.text.innerHTML = `<span>${formatText(rep)}</span>`;

  // Remove all attachments and media
  obj = cleanTweet(obj);

  const injectedMedia = document.createElement("div");
  injectedMedia.classList.add("injectedMediaContainer");

  if (rep.media_url) {
    injectedMedia.innerHTML = `<div class='media'><img class='tweet-img' src=${rep.media_url} /></div>`;
  } else if (rep.link_url && rep.link_image) {
    if (rep.link_hostname.startsWith("www.")) {
      rep.link_hostname = rep.link_hostname.slice(4);
    }
    if (rep.link_type == "article" && rep.link_description) {
      const link_title = shorten_str(rep.link_title, 64);
      injectedMedia.innerHTML = `
        <a class='injected-link' href='${rep.link_url}' target='_blank'>
          <div class='media'>
            <div class='header-img'><img src=${rep.link_image
        } width=100% style='object-fit: cover'/></div>
            <div class='link-body'>
              <span class='link-domain'>${rep.link_hostname}</span>
              <span class='link-headline'>${link_title}</span>
              <span class='link-lede'>${shorten_str(
          rep.link_description,
          137
        )}</span>
            </div>
          </div>
        </a>`;
    } else {
      injectedMedia.innerHTML = `
        <a class='injected-link' href='${rep.link_url}' target='_blank'>
          <div class='media media-sm'>
            <div class='header-img header-img-sm'><img src=${rep.link_image} width=100% style='object-fit: cover'/></div>
            <div class='link-body link-body-sm'>
              <span class='link-domain'>${rep.link_hostname}</span>
              <span class='link-headline'>${rep.link_title}</span>
            </div>
          </div>
        </a>`;
    }
  }

  injectedMedia.onclick = function (evt) {
    evt.stopPropagation();
  };

  obj.nodes.body.tweetControls.insertAdjacentElement(
    "beforebegin",
    injectedMedia
  );

  if (obj.nodes.socialContextContainer) {
    if (rep.socialContext) {
      obj.nodes.socialContextContainer.innerHTML = `
      <div class='socialContextContainer'>
        <span class='socialContextIcon'>${chatSVG}</span>
        <a class='socialContext' href="${rep.socialContextLink}">${rep.socialContext}</a>
        <span class='dot'>\u00B7</span> 
        <a class='socialContextSeeMore' href="${rep.socialContextLink}">See More</a>
        </div>
    `;
    } else {
      obj.nodes.socialContextContainer.innerHTML = "<br />";
    }
  }

  const verifiedHTML = rep.isVerified
    ? `<span class='checkmarkSVG'>${checkmarkSVG}</span>`
    : "";

  const time_string = getTimeStr(new Date(rep.created_at));
  // Formatted either as Dec 7, 23h, or 2m

  obj.nodes.userName.innerHTML = `
      <span class='userName'>
        <a href="/${rep.username}" class='userName'>
            ${rep.tname}
        </a>
      </span>
      ${verifiedHTML}
      <span class='userHandle'>
        <a href="/${rep.username}" class='userHandle'>
            @${rep.username}
        </a> 
      </span>
      <span class='dot'>\u00B7</span> 

      <span class='time'>
        <a href="${tweetLink}" class='time'>
          ${time_string}
        </a>
      </span>
  `;

  obj.nodes.avatar.innerHTML = `
    <a href="/${rep.username}"><div class='avatarContainer'>
      <img class='avatar' src=${rep.profile_image_url} height=100% />
    </div></a>`;
  obj.nodes.replyCount.innerHTML = `<span class='metric'>${rep.reply_count || ""
    }</span>`;
  obj.nodes.retweetCount.innerHTML = `<span class='metric'>${rep.retweet_count || ""
    }</span>`;
  obj.nodes.likeCount.innerHTML = `<span class='metric'>${rep.like_count || ""
    }</span>`;
  obj.nodes.like.classList.add("likeCount");
  obj.nodes.reply.classList.add("replyCount");
  obj.nodes.retweet.classList.add("retweetCount");
  obj.nodes.share.classList.add("shareButton");

  // Clone tweet reaction nodes to remove existing event listeners
  const newControls = obj.nodes.body.tweetControls.cloneNode(true);
  obj.nodes.body.tweetControls.parentNode.replaceChild(
    newControls,
    obj.nodes.body.tweetControls
  );
  obj.nodes.like = newControls.querySelector(".likeCount");
  obj.nodes.reply = newControls.querySelector(".replyCount");
  obj.nodes.retweet = newControls.querySelector(".retweetCount");
  obj.nodes.share = newControls.querySelector(".shareButton");
  obj.nodes.views = newControls.querySelector("a");
  obj.nodes.views.firstChild.classList.add("viewsCount");

  obj.nodes.views.removeAttribute("href");
  obj.nodes.views.addEventListener("click", (evt) =>
    evt.stopImmediatePropagation()
  );

  const like = obj.nodes.like;

  like.addEventListener("click", (evt) => {
    const metric = like.querySelector(".metric");
    if (like.getAttribute("status")) {
      metric.innerHTML = parseInt(metric.innerHTML) - 1;
      like.removeAttribute("status");
      like.querySelector("svg").parentNode.innerHTML = likeSVGEmpty;
      like.classList.remove("liked");
    } else {
      // Re add logging event, since the old one was removed when we
      // cloned the nodes
      like.setAttribute("status", true);
      metric.innerHTML = parseInt(metric.innerHTML) + 1;
      like.querySelector("svg").parentNode.innerHTML = likeSVGFilled;
      like.classList.add("liked");
    }
  });

  if (obj.nodes.body.preTextComponents.length > 0) {
    for (const n of obj.nodes.body.preTextComponents) {
      n.remove();
    }
  }

  if (obj.nodes.avatarExpandThread != null) {
    const threadLink = obj.nodes.expandThreadLink;
    if (threadLink) {
      threadLink.setAttribute("href", tweetLink);
    } else {
      console.log("no link found!", obj.nodes.avatarExpandThread);
    }
    obj.nodes.avatarExpandThread.innerHTML = `
      <div class='avatarContainerExpandThread-'>
        <img class='avatar avatarContainerExpandThread' src=${rep.profile_image_url} width=32px height=32px />
      </div>`;
  } else {
    obj.nodes.tweetFooter.map((a) => a.remove());
  }

  obj.nodes.node.setAttribute("injected", "true");
  obj.nodes.text.onclick = function (e) {
    e.stopPropagation();
  };
  obj.nodes.avatar.onclick = function (e) {
    e.stopPropagation();
  };

  obj.nodes.like.addEventListener("onclick", function (evt) {
    evt.stopImmediatePropagation();
    return false;
  });

  obj.nodes.node.onclick = function (evt) {
    window.location.href = tweetLink;
    evt.stopImmediatePropagation();
  };

  obj.nodes.node.onauxclick = function (evt) {
    evt.stopImmediatePropagation();
    evt.preventDefault();
    return false;
  };

  obj.nodes.node.onmousedown = function (evt) {
    if (evt.which == 2) {
      evt.stopImmediatePropagation();
      evt.preventDefault();
      return false;
    }
  };

  obj.nodes.node.onmouseup = function (evt) {
    if (evt.which == 2) {
      evt.preventDefault();
      window.open(tweetLink, "_blank");
      return false;
    }
  };
};

// This is in a separate fucntion because it seems like twitter's JS
// hydrates the menu interactivity asynchronously
const disableInjectedContextMenus = function () {
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

// separate function, because it seems like twitter async hydrates video
const removeInjectedMedia = function () {
  const injectedNodes = document.querySelectorAll("[injected=true]");
  for (const node of injectedNodes) {
    const media = node.querySelectorAll("[data-testid=tweetPhoto]");
    for (const card of media) {
      card.remove();
    }
  }
};

/* Determine if a tweet object is eligible for replacement
 */
const isEligible = function (tweet) {
  if (tweet == null) {
    dlog("ineligible: tweet is null");
    return false;
  }
  if (tweet.data.isHidden) {
    dlog("ineligible: tweet was removed");
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
  if (seen_tweet_ids.has(tweet.data.id)) {
    dlog("ineligible: we already marked this tweet id as no-replace");
    return false;
  }
  if (tweet.data.isInjected) {
    dlog("ineligible: already is injected tweet");
    return false;
  }
  return true;
};

/*
 * Given the array of tweet objects and users' treatment group,
 * inject tweets into the timeline by transforming eligible tweets
 */
let injectTweets = function (tweets, exp_config) {
  const treatment_group = exp_config.treatment_group;
  if (treatment_group == 0 || treatment_group == 1) {
    return;
  }

  for (let i = 0; i < tweets.length; i++) {
    if (!isEligible(tweets[i])) {
      continue;
    }

    if (Math.random() < exp_config.inject_rate) {
      const new_tweet = fetch_tweet(exp_config);
      if (new_tweet) {
        transformTweet(tweets[i], new_tweet);
        tweets[i].data.injectedTweet = new_tweet;
        if (exp_config.debug_mode) {
          tweets[i].nodes.node.style.backgroundColor = "seashell";
        }
      }
    } else {
      seen_tweet_ids.add(tweets[i].data.id);
    }
  }
};

/*
 * Given an array of childNodes create a parsed array of tweet objects
 */
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

/*
 * Set up an IntersectionObserver for any tweets that don't have one
 * This way we can actually know if a tweet enters the viewport or not
 */
const monitorTweets = function (tweets, logger) {
  for (const tweet of tweets) {
    if (tweet) {
      if (!tweet.nodes.node.getAttribute("hasReactionListener")) {
        tweet.nodes.like.addEventListener("click", (evt) => {
          console.log("like logged for tweet ", tweet.data.id);
          logger.logEvent(tweet.data, "like");
          if (tweet.nodes.node.getAttribute("injected")) {
            // Stop the event propagation because otherwise
            // we redirect to the tweet ID
            evt.stopImmediatePropagation();
          }
        });
        tweet.nodes.node.setAttribute("hasReactionListener", true);
      }
      if (!tweet.nodes.node.getAttribute("hasViewObserver")) {
        let observer = new IntersectionObserver(
          function (entries) {
            // isIntersecting is true when element and viewport are overlapping
            // isIntersecting is false when element and viewport don't overlap
            if (entries[0].isIntersecting === true) {
              logger.logEvent(tweet.data, "view");
            }
          },
          { threshold: [0.2] }
        );
        observer.observe(tweet.nodes.node);
        tweet.nodes.node.setAttribute("hasViewObserver", true);
      }
    }
  }
};

/*
 * Where the magic happens. Parse the twitter feed, remove tweets if needed, add tweets if needed,
 * and log the whole thing
 */
const processFeed = function (observer, exp_config, logger) {
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

    filterTweets(tweets, exp_config);
    injectTweets(tweets, exp_config);
    monitorTweets(tweets, logger);
    disableInjectedContextMenus();
    removeInjectedMedia();

    // re-register, for when the user scrolls
    observer.observe(timelineDiv, {
      attributes: false,
      childList: true,
      subtree: true,
      characterData: true,
    });
  }
};

export const getObserver = function (exp_config, logger) {
  const _ = fetch_tweet(exp_config);
  const observer = new MutationObserver(function (mutations) {
    processFeed(observer, exp_config, logger);
  });
  return observer;
};
