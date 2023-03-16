import { CONFIG } from "./config";
const FETCH_ENDPOINT = CONFIG.serverEndpoint + "/fresh_tweets";
const LOG_ENDPOINT = CONFIG.serverEndpoint + "/log_tweets";

/**
    Fetches a new set of tweets to inject.
    @param {string} username - The username...
    @param {string} install_code - The install code..
    @param {integer} ideo - The ideology of the user
    @returns {Promise} An array of tweet objects
    */
async function refresh_tweet_pool(username, install_code, ideo) {
  console.log("Refreshing tweet pool... " + FETCH_ENDPOINT);
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

  return fresh_tweets;
}

/* given a username and their install code, send a request
 * to the server to log set of tweet activity
 */
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

/* Handle receiving a message from the content script 
 * to fetch new tweets or log tweet activity
 */
chrome.runtime.onMessage.addListener((message) => {
  let tab_promise = chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  console.log("Received message", message);
  // This code has an edge case where the client won't receive the message if 
  // the user switches tabs while a request is pending. This shouldn't actually
  // pose any real problems because the fetch_tweets code will just attempt 
  // to request another batch once it comes back into focus. 
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
  } else if ((message.message == "log")) {
    uploadLog(message.username, message.install_code, message.data).then(
      (status) => {
        tab_promise.then((tab) => {
          if (tab[0]) {
            // This is just a courtesy ACK, not important if the client doesn't receive
            chrome.tabs.sendMessage(tab[0].id, {
              message: { name: "logEvent", status: status },
            });
          }
        });
      }
    );
  }
});


