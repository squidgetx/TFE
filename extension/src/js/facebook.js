let parseText = (tweet) => {
  let divs = Array.from(tweet.getElementsByTagName("div"));
  return [
    ...new Set(
      divs
        .filter((s) => s.childNodes.length == 1)
        .map((s) => s.parentNode.textContent)
    ),
  ];
};

let parseLinks = (node) => {
  let links = Array.from(node.getElementsByTagName("a"));
  return [...new Set(links.filter((s) => !s.href.includes("facebook.com")))];
};

let parseFirstText = (node) => {
  let spans = Array.from(node.getElementsByTagName("span"));
  return [
    ...new Set(
      spans.map((s) => s.parentNode.textContent).filter((s) => s.length > 0)
    ),
  ][0];
};

let parseIsGroup = (node) => {
  let links = Array.from(node.getElementsByTagName("a"));
  let firstLink = [...new Set(links.map((s) => s.href))][0];
  if (firstLink && firstLink.includes("facebook.com/groups")) {
    return true;
  } else {
    return false;
  }
};

let parseAuthor = (node) => {
  let links = Array.from(node.getElementsByTagName("a"));
  return [
    ...links.map((s) => s.parentNode.textContent).filter((s) => s.length > 0),
  ][0];
};

let parsePost = function (node) {
  // Extract all the useful metadata of the post
  return {
    firstText: parseFirstText(node),
    text: parseText(node),
    author: parseAuthor(node),
    isGroup: parseIsGroup(node),
    outboundLinks: parseLinks(node),
  };
};

let filterPosts = function (children, treatment_group, logger) {
  for (const node of children) {
    let post = parsePost(node);
    if (post.firstText) {
      console.log(post);
    }
  }
};

let filterFeed = function (document, observer, treatment_group, logger) {
  let feed = document.querySelectorAll('[role="feed"]')[0];
  if (feed != undefined && feed.childNodes.length > 1) {
    // The feed HTML element is the direct parent of divs that each
    // contain individual feed posts
    let children = [...feed.childNodes].filter(
      (n) => n.tagName == "DIV" || n.tagName == "div"
    );
    filterPosts(children, treatment_group, logger);

    // re-register, for when the user scrolls
    const config = {
      attributes: false,
      childList: true,
      subtree: true,
      characterData: true,
    };
    observer.observe(feed, config);
  }
};

export const getObserver = function (treatment_group, logger) {
  const observer = new MutationObserver(function (mutations) {
    filterFeed(document, observer, treatment_group, logger);
  });
  return observer;
};
