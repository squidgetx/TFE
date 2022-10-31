/*
 * This module exports parseTwitterHTML
 */

const parseId = function (tweet) {
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

const parseTime = function (tweet) {
  let time = Array.from(tweet.getElementsByTagName("time"));
  if (time.length > 0) {
    return time[0].dateTime;
  }
  return null;
};

const parseAuthor = function (tweet) {
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

const findMeaningfulParent = function (root) {
  if (!root) {
    return root;
  }
  let node = root.parentNode;
  while (true) {
    if (node.childNodes.length > 1) {
      // this is a branch point node
      return node;
    }
    if (!node.parentNode) {
      return node;
    }
    node = node.parentNode;
  }
};

// Find the [great]*[grand]child of the given node
// that does not contain a singular div or span as its child
const findMeaningfulChild = function (root) {
  if (!root) {
    return root;
  }
  let node = root;
  while (true) {
    if (node.childNodes.length > 1) {
      // this is a branch point node
      return node;
    }
    if (node.childNodes.length == 0) {
      // the last node was an empty div or span?
      // return the parent node
      return node.parentNode;
    }
    // we know there must be exactly one child now
    const child = node.firstChild;
    if (child.tagName == "DIV" || child.tagName == "SPAN") {
      node = child;
    } else {
      return node;
    }
  }
};

const queryMeaningfulChild = function (node, selector) {
  let result = node.querySelector(selector);
  return findMeaningfulChild(result);
};

/* Look through the tweet object until we find the child that contains the usernames
 * Then any elements after that object will be the "tweet footer" objects
 */
const parseTweetFooter = function (obj) {
  let tweetFooter = [];
  let found = false;
  if (obj.nodes.tweet.childNodes.length > 1) {
    for (let i = 0; i < obj.nodes.tweet.childNodes.length; i++) {
      if (obj.nodes.tweet.childNodes[i].contains(obj.nodes.userName)) {
        found = true;
        continue;
      }
      if (found) {
        tweetFooter.push(obj.nodes.tweet.childNodes[i]);
      }
    }
  }
  return tweetFooter;
};

/*
 * parse the tweet body using the text node or photo node as the starting point
 * to find the controls (like, retweet, share) container, any extra embedded media
 * like retweets, pre-text (eg, "Replying To"),
 * and post-control components (usually the "Promoted" tag)
 */
const parseTweetBody = function (obj) {
  const body = {
    preTextComponents: [],
    text: obj.nodes.text,
    embeddedMedia: [],
    tweetControls: [],
    postControlComponents: [],
  };

  let startingPoint = obj.nodes.text ? obj.nodes.text : obj.nodes.tweetPhoto;

  if (startingPoint != undefined) {
    const tweetBodyContainer = findMeaningfulParent(startingPoint);
    const tweetComponents = tweetBodyContainer.childNodes;
    // We assume that the tweet controls come after the text
    // and interpret all in-between components as embedded media
    // We also allow for an arbitrary number of components before and after

    let components = body.preTextComponents;
    for (let i = 0; i < tweetComponents.length; i++) {
      if (tweetComponents[i].contains(obj.nodes.text)) {
        components = body.embeddedMedia;
        continue;
      }
      if (tweetComponents[i].contains(obj.nodes.retweet)) {
        body.tweetControls = findMeaningfulChild(tweetComponents[i]);
        components = body.postControlComponents;
        continue;
      }
      components.push(findMeaningfulChild(tweetComponents[i]));
    }
  }
  return body;
};

/* Get the higher level social context HTML container */
const parseSocialContextContainer = function (obj) {
  if (!obj.nodes.socialContext) {
    return null;
  }
  let parent = obj.nodes.socialContext.parentNode;
  while (true) {
    if (!parent) {
      return null;
    }
    const num_components = parent.childNodes.length;
    if (num_components > 1) {
      if (
        parent.firstChild.contains(obj.nodes.socialContext) &&
        parent.lastChild.contains(obj.nodes.text)
      ) {
        return parent.firstChild;
      }
    }
    parent = parent.parentNode;
  }
};

/* set whether the tweet is part of a thread
 * collapsed thread means the thread is rolled up and the See More button is active
 * isThread simply means whether the tweet is part of a thread at all
 * You can usually tell because there's an extra HTML element next to the avatar
 * except in the case when it's the last tweet in the thread
 * in this case we need to look at the previous node to see whether that one is a thread or not
 */
const parseTweetThread = function (obj, prevNode) {
  const thread = {
    isThread: obj.nodes.threadMarker != null,
    isCollapsedThread: false,
  };

  if (prevNode != null) {
    if (
      prevNode.data.thread.isThread &&
      !prevNode.data.thread.isCollapsedThread
    ) {
      thread.isThread = true;
    }
  }

  if (obj.nodes.tweetFooter) {
    thread.isCollapsedThread = obj.nodes.tweetFooter.some((a) =>
      a.innerText.includes("Show this thread")
    );
  }
  return thread;
};

const parseReply = function (obj) {
  if (obj.nodes.preText) {
    return obj.nodes.preText.some((a) => a.includes("Replying to"));
  }
  return false;
};

/*
 * arg: HTMLDOMElement
 * Returns an object containing pointers to the HTML elements
 * containing the major components of the tweet
 */
export const parseTweetHTML = function (node, prevNode) {
  const obj = {
    nodes: {},
    data: {},
  };
  obj.nodes.tweet = queryMeaningfulChild(node, '[data-testid="tweet"]');
  if (!obj.nodes.tweet) {
    return null;
  }

  obj.nodes.text = queryMeaningfulChild(node, '[data-testid="tweetText"]');
  obj.nodes.userName = queryMeaningfulChild(node, '[data-testid="User-Names"]');
  obj.nodes.avatar = node.querySelector('[data-testid="Tweet-User-Avatar"]');
  obj.nodes.threadMarker = obj.nodes.avatar.nextSibling;
  obj.nodes.cardWrapper = queryMeaningfulChild(
    node,
    '[data-testid="card.wrapper"]'
  );
  obj.nodes.tweetPhoto = queryMeaningfulChild(
    node,
    '[data-testid="tweetPhoto"]'
  );
  obj.nodes.retweet = queryMeaningfulChild(node, '[data-testid="retweet"]');
  obj.nodes.retweetCount = obj.nodes.retweet
    ? obj.nodes.retweet.querySelector(
        '[data-testid="app-text-transition-container"]'
      )
    : null;

  obj.nodes.reply = queryMeaningfulChild(node, '[data-testid="reply"]');
  obj.nodes.replyCount = obj.nodes.reply
    ? obj.nodes.reply.querySelector(
        '[data-testid="app-text-transition-container"]'
      )
    : null;

  obj.nodes.like = queryMeaningfulChild(node, '[data-testid="like"]');
  obj.nodes.likeCount = obj.nodes.like
    ? obj.nodes.like.querySelector(
        '[data-testid="app-text-transition-container"]'
      )
    : null;

  obj.nodes.caret = queryMeaningfulChild(node, '[area-label="More"]');
  obj.nodes.share = queryMeaningfulChild(node, '[aria-label="Share Tweet"]');
  obj.nodes.socialContext = queryMeaningfulChild(
    node,
    '[data-testid="socialContext"]'
  );

  obj.nodes.node = node;
  obj.nodes.tweetFooter = parseTweetFooter(obj);
  obj.nodes.body = parseTweetBody(obj);
  obj.nodes.socialContextContainer = parseSocialContextContainer(obj);
  obj.data.thread = parseTweetThread(obj, prevNode);
  obj.data.isReply = parseReply(obj);
  obj.data.id = parseId(obj.nodes.userName);
  obj.data.author = parseAuthor(obj.nodes.userName);
  obj.data.tweetTime = parseTime(obj.nodes.userName);
  obj.data.isPromoted = obj.nodes.body.postControlComponents.some((a) =>
    a.innerText.includes("Promoted")
  );
  obj.data.allText = node.innerText;
  obj.data.isInjected = node.getAttribute("injected");

  if (obj.data.socialContextContainer) {
    obj.data.socialContextLinks = Array.from(
      node.socialContextContainer.getElementsByTagName("a")
    ).map((a) => a.href);
  }
  // tk tweet embedded links, etc

  for (const key of [
    "likeCount",
    "replyCount",
    "retweetCount",
    "socialContext",
    "text",
  ]) {
    if (obj.nodes[key]) {
      obj.data[key] = obj.nodes[key].innerText;
    }
  }

  for (const key of ["preTextComponents", "postControlComponents"]) {
    if (obj.nodes.body[key]) {
      obj.data[key] = obj.nodes.body[key].map((a) => a.innerText);
    }
  }

  return obj;
};
