const fresh_tweets = [];
let waiting = false;

chrome.runtime.onMessage.addListener((message) => {
  console.log("received message", message);
  if (message.message.name == "fresh_tweets") {
    fresh_tweets.push(...message.message.tweets);
    console.log("Got a new batch", fresh_tweets.length);
    waiting = false;
  }
});

// Non-blocking func returns undefined if the fresh_tweets pool is empty
export const fetch_tweet = function (key) {
  if (!waiting && fresh_tweets.length < 4) {
    console.log("requesting more tweets...");
    chrome.runtime.sendMessage({ message: "fetch" });
    waiting = true;
  }
  const new_tweet = fresh_tweets.shift();
  return new_tweet;
};

// It's still jank but another way is to just ask for new tweets once per X time interval
