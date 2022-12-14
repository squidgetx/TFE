const FETCH_ENDPOINT = "http://localhost:3000/fresh_tweets";

async function refresh_tweet_pool(key) {
  console.log("Refreshing tweet pool..");
  const response = await fetch(FETCH_ENDPOINT, {
    method: "POST",
    body: JSON.stringify({ username: "test", password: "test" }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const fresh_tweets = await response.json();
  // todo send to twitter tab
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });

  chrome.tabs.sendMessage(tab.id, {
    message: { name: "fresh_tweets", tweets: fresh_tweets },
  });
}

// Temp hack: fetch new data every second
// TODO make it so that the frontend can request data

chrome.runtime.onMessage.addListener((message) => {
  console.log("Received message", message);
  if (message.message == "fetch") {
    refresh_tweet_pool("test").then(() => {});
  }
});
