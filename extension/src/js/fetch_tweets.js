const fresh_tweets = [];
let waiting = false;
let timer = 0;

const shuffleArray = (arr) => {
  return arr.map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value)
}
// Listen for messages from the background script
// that contain the pool of fresh tweets to inject
// Store the fresh tweets in the local static fresh_tweets array
// Set the waiting flag to false when the background tab responds
chrome.runtime.onMessage.addListener((message) => {
  console.log("received message", message);
  if (message.message.name == "fresh_tweets") {
    fresh_tweets.push(...shuffleArray(message.message.tweets))
    console.log("Got a new batch", fresh_tweets.length);
    if (fresh_tweets == null || fresh_tweets.length == 0) {
      // Something is wrong with the server, no content is being served
      // Wait some time before resetting the waiting flag so that we aren't 
      // constantly flooding the server with requests, and use exponential backoff
      console.log(
        "Didn't get any responses - setting a timer for ",
        Math.exp(timer) * 1000
      );
      setTimeout(() => {
        console.log("Timer expired");
        // cap timer to 4, which represents a delay of 1 minute
        if (timer < 4) {
          timer += 1;
        }
        waiting = false;
      }, Math.exp(timer) * 1000);
    } else {
      console.log("Got a healthy batch - timer reset ");
      timer = 0;
      waiting = false;
    }
  }
});

// Non-blocking func to fetch a new tweet
// New tweets are fetched from the local cache (fresh_tweets)
// Issues a request to the background task to fetch new tweets from
// the server if the local cache is running low and if not already waiting for the server 
// Returns undefined if the fresh_tweets pool is empty
export const fetch_tweet = function (exp_config) {
  if (!waiting && fresh_tweets.length < 4) {
    console.log(`requesting more tweets... for ${JSON.stringify(exp_config)}`);
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

