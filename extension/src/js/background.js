import { CONFIG } from "./config";
const FETCH_ENDPOINT = CONFIG.serverEndpoint + "/fresh_tweets";
const LOG_ENDPOINT = CONFIG.serverEndpoint + "/log_tweets";

async function refresh_tweet_pool(username, install_code, ideo) {
  console.log("Refreshing tweet pool..");
  const response = await fetch(FETCH_ENDPOINT, {
    method: "POST",
    body: JSON.stringify({
      username: username,
      password: install_code,
      ideo: ideo,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const fresh_tweets = await response.json();
  // todo send to twitter tab

  return fresh_tweets;
}

// Temp hack: fetch new data every second
// TODO make it so that the frontend can request data

chrome.runtime.onMessage.addListener((message) => {
  const tab_promise = chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  console.log("Received message", message);
  if (message.message == "fetch") {
    refresh_tweet_pool(
      message.username,
      message.install_code,
      message.ideo
    ).then((fresh_tweets) => {
      tab_promise.then((tab) => {
        chrome.tabs.sendMessage(tab[0].id, {
          message: { name: "fresh_tweets", tweets: fresh_tweets },
        });
      });
    });
  } else if ((message.message = "log")) {
    uploadLog(message.username, message.install_code, message.data).then(
      (status) => {
        tab_promise.then((tab) => {
          chrome.tabs.sendMessage(tab[0].id, {
            message: { name: "logEvent", status: status },
          });
        });
      }
    );
  }
});

const uploadLog = async (username, install_code, data) => {
  const response = await fetch(LOG_ENDPOINT, {
    method: "POST",
    body: JSON.stringify({
      username: username,
      password: install_code,
      tweets: data,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const response_json = await response.json();
  const status = response_json.status == 200;
  return status;
};
