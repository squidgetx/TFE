import { BLACKLIST_ACCOUNTS } from "./accounts";

import { fetch_tweet } from "./fetch_tweets";
import { injectTweets, postProcessInjectedTweets } from "./injection";
import { parseTweetHTML } from "./parser";
import { GROUPS } from "./experiment"


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

    if (treatment_group == GROUPS.REMOVE || treatment_group == GROUPS.ADD_AND_REMOVE) {
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
    postProcessInjectedTweets()

    // re-register, for when the user scrolls
    observer.observe(timelineDiv, {
      attributes: false,
      childList: true,
      subtree: true,
      characterData: true,
    });
  }
};

// return the mutation observer used to enact all extension logic
export const getObserver = function (exp_config, logger) {
  const _ = fetch_tweet(exp_config);
  const observer = new MutationObserver(function (mutations) {
    processFeed(observer, exp_config, logger);
  });
  return observer;
};

