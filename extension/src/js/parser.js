/*
 * This module exports parseTwitterHTML, which is a func that takes an HTML object 
 * containing a tweet and returns an object containing structured data of the tweet
 * as well as pointers to each relevant HTML field
 */

// extract the tweet ID from a tweet HTML node
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

// extract the time from a tweet HTML node
const parseTime = function (tweet) {
  let time = Array.from(tweet.getElementsByTagName("time"));
  if (time.length > 0) {
    return time[0].dateTime;
  }
  return null;
};

// extract the username of the author from a tweet HTML node
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

// helper HTML function returns the closest nontrivial parent node of the given HTML node
// nontrivial means that the returned node has more than one child or is the root node of 
// the document
// eg, findMeaningfulParent(A) with structure 
//   D
//  / \
// B   C
//      \
//      A
// returns node D
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

// wraps findMeaningfulChild with a selector
const queryMeaningfulChild = function (node, selector) {
  const result = node.querySelector(selector);
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
    parseError: false,
    preTextComponents: [],
    text: obj.nodes.text,
    embeddedMedia: [],
    tweetControls: null,
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
  if (body.tweetControls == null) {
    body.parseError = true;
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
  const threadMarkerExists = obj.nodes.threadMarker != null
  const thread = {
    isThread: threadMarkerExists,
    isCollapsedThread: false,
    isThreadEnding: false,
  };

  // Two ways a thread can end: 
  // First, if Twitter displays the entire tweet thread
  // then, the final tweet in the thread will not have a thread marker
  // Second, if Twitter displays a "collapsed" thread. In this case
  // the tweet footer contains a "Show this thread" button and the tweet usually
  // has a thread marker present. 
  const prevNodeIsThreadMiddle = prevNode &&
    prevNode.data.thread.isThread &&
    !prevNode.data.thread.isThreadEnding
  if (prevNodeIsThreadMiddle && !threadMarkerExists) {
    thread.isThread = true;
    thread.isThreadEnding = true;
  } else {
    const hasShowThreadButton = obj.nodes.tweetFooter &&
      obj.nodes.tweetFooter.some(a => a.innerText.includes("Show this thread"))
    const miniAvatar = obj.nodes.avatarExpandThread = obj.nodes.tweetFooter
      .map((n) =>
        n.querySelector('[data-testid="UserAvatar-Container-unknown"]')
      )
      .filter((a) => a != null)
    if (hasShowThreadButton && threadMarkerExists) {
      thread.isCollapsedThread = true
      thread.isThreadEnding = true
      if (miniAvatar.length > 0) {
        obj.nodes.avatarExpandThread = miniAvatar[0]
        obj.nodes.expandThreadLink = miniAvatar[0].closest("a");
      }
    }
  }
  return thread;
};

// return true if the given tweet object is a reply
// this only works in english, sorry
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
  obj.nodes.userName = queryMeaningfulChild(node, '[data-testid="User-Names"]') || queryMeaningfulChild(node, '[data-testid="User-Name"]');
  if (obj.nodes.userName == null) {
    console.log("Could not find user names in node")
    console.log(node)
    return null

  }
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

  obj.nodes.caret = queryMeaningfulChild(node, '[data-testid="caret"]');
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
  obj.data.processed = node.getAttribute("processed");

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

  obj.nodes.outboundMedia = queryMeaningfulChild(node, '[data-testid="card.wrapper"]')

  obj.data.parseError = obj.nodes.body.parseError;
  return obj;
};
