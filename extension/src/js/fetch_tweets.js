const fresh_tweets = [];
let waiting = false;
let timer = 0;

chrome.runtime.onMessage.addListener((message) => {
  console.log("received message", message);
  if (message.message.name == "fresh_tweets") {
    fresh_tweets.push(...message.message.tweets);
    console.log("Got a new batch", fresh_tweets.length);
    if (fresh_tweets == null || fresh_tweets.length == 0) {
      // Something is wrong with the server, no content is being served
      // Start an exponential decay countdown to avoid overloading server with
      // requests
      console.log(
        "Didn't get any responses - setting a timer for ",
        Math.exp(timer) * 1000
      );
      setTimeout(() => {
        console.log("Timer expired");
        timer += 1;
        waiting = false;
      }, Math.exp(timer) * 1000);
    } else {
      console.log("Got a healthy batch - timer reset ");
      timer = 0;
      waiting = false;
    }
  }
});

// Non-blocking func returns undefined if the fresh_tweets pool is empty
export const fetch_tweet = function (exp_config) {
  if (!waiting && fresh_tweets.length < 4) {
    console.log(`requesting more tweets... for ${exp_config}`);
    chrome.runtime.sendMessage({
      message: "fetch",
      username: exp_config.workerID,
      install_code: exp_config.install_code,
      ideo: exp_config.mock_ideo,
    });
    waiting = true;
  }
  const new_tweet = fresh_tweets.shift();
  return new_tweet;
};

// It's still jank but another way is to just ask for new tweets once per X time interval
