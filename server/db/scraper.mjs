/* code to scrape tweets from a fixed list of twitter accounts and write it to the DB */

import { Client } from "twitter-api-sdk";
import pgPromise from "pg-promise";

const pgp = pgPromise({});

import { default as DB } from "./db.js";
import { default as config } from "../lib/config.js";

const BEARER_TOKEN = config.twitterBearerToken;

const WRITE_DB = true;
const PERF_LOG = false;

// Fetch all tweets from twitter v2 api for given author ID created after `time`
async function fetch_for_id(id, time) {
  const client = new Client(BEARER_TOKEN);
  const end_time = new Date(time)
  end_time.setDate(end_time.getDate() + 1)

  const response = await client.tweets.usersIdTweets(id, {
    start_time: time, // "2022-12-01T00:00:00.000Z",
    end_time: end_time.toISOString(), // "2022-12-01T00:00:00.000Z",
    max_results: 100,
    "tweet.fields": [
      "attachments",
      "author_id",
      "conversation_id",
      "created_at",
      "id",
      "in_reply_to_user_id",
      "public_metrics",
      "referenced_tweets",
      "text",
    ],
    expansions: [
      "attachments.media_keys",
      "author_id",
      "in_reply_to_user_id",
      "referenced_tweets.id",
      "referenced_tweets.id.author_id",
    ],
    "media.fields": [
      "height",
      "media_key",
      "preview_image_url",
      "type",
      "url",
      "width",
    ],
    "user.fields": [
      "id",
      "name",
      "profile_image_url",
      "url",
      "username",
      "verified",
      "verified_type",
    ],
  });

  return response;
}

/* Transform json response from API into flat object that we can put into PG */
/*
      "text": "I'll be on MSNBC just after 7PM Eastern with the great and good @JoyAnnReid on @thereidout -- see you there!",
      "id": "1598826654603902976",
      "created_at": "2022-12-02T23:49:13.000Z",
      "author_id": "16129920",
      "public_metrics": {
        "retweet_count": 132,
        "reply_count": 435,
        "like_count": 1547,
        "quote_count": 10
      },
      "edit_history_tweet_ids": [
        "1598826654603902976"
      ],
      "conversation_id": "1598826654603902976"
    },
   */
function parse_tweet(tweet) {
  for (const key in tweet.public_metrics) {
    tweet[key] = tweet.public_metrics[key];
  }
  tweet.ttext = tweet.text; // because 'text' is reserved keyword
  if ("referenced_tweets" in tweet) {
    tweet.referenced_tweet_type = tweet.referenced_tweets[0].type;
    tweet.referenced_tweet_id = tweet.referenced_tweets[0].id;
    if (tweet.referenced_tweets.length > 1) {
      console.log(`WARNING: multiple referenced tweets for tweet ${JSON.stringify(tweet)}`)
      console.log(JSON.stringify(tweet.referenced_tweets))
    }
  }
  if ("attachments" in tweet && tweet.attachments.media_keys) {
    tweet.media_id_1 = tweet.attachments.media_keys[0];
    tweet.media_id_2 = tweet.attachments.media_keys[1];
    if (tweet.attachments.media_keys.length > 2) {
      console.log("WARNING: more than two media keys for " + JSON.stringify(tweet))
      console.log("  " + JSON.stringify(tweet.attachments.media_keys))
    }
  }
  tweet.scrape_time = new Date();
  tweet.ds = tweet.scrape_time.toISOString().split("T")[0];

  // pull out links
  const link_re = /(https:\/\/t.co\/\w+)/g;
  if (tweet.text) {
    const matches = Array.from(tweet.text.matchAll(link_re), m => m[0]);
    tweet.turls = matches;
  }
  return tweet;
}

// rename user name prop to tname to avoid property
function parse_user(user) {
  user.tname = user.name;
  return user;
}

// rename media props to keys used to upload to db
function parse_media(media) {
  media.media_url = media.url;
  media.id = media.media_key;
  media.media_type = media.type;
  if (media.type == "photo" && !media.preview_img_url) {
    // No preview - same as the original
    media.preview_img_url = media.url;
  }
  return media;
}

// Handle the response from the twitter API
// Extract/rename all the fields we want to persist to the DB
// Fetch link previews if needed
// Return an object containing all the objects needed to write to the DB
function parse_response(response) {
  // A bit complicated because RT/Quote tweets exist :P
  // So for RT/Quote tweets, we add 2 tweets to the DB: one for the original tweet and one for the OG
  if (response.data == undefined) {
    // No new tweets in the DB
    return {
      tweets: [],
      users: [],
      media: [],
      links: [],
    };
  }
  const tweets = response.data
    .map((t) => parse_tweet(t))
    // filter duplicate ids, which apparently happens sometimes (keep first entry)
    .filter((v, i, a) => a.findIndex((v2) => v2.id === v.id) === i);
  const users = response.includes.users.map((u) => parse_user(u));

  // response object doesn't always include tweets or media, default to empty array
  const referenced_tweets = (response.includes.tweets || []).map((t) =>
    parse_tweet(t)
  );
  const media = (response.includes.media || []).map((m) => parse_media(m));
  const all_tweets = tweets.concat(referenced_tweets);

  const tweet_turls = []
  const links = new Set()
  for (const t of all_tweets) {
    for (const turl of t.turls) {
      tweet_turls.push({
        tweet_id: t.id,
        turl: turl
      })
      links.add(turl)
    }
  }

  return {
    tweets: all_tweets,
    users: users,
    media: media,
    tweet_turls: tweet_turls,
    links: links
  };
}

// Take the result of parse_response and write data to the database
async function update_db(data) {
  const TWEET_COLS = [
    "id",
    "author_id",
    "ttext",
    "media_id_1",
    "media_id_2",
    "link_preview_url",
    "created_at",
    "conversation_id",
    "in_reply_to_user_id",
    "retweet_count",
    "reply_count",
    "like_count",
    "quote_count",
    "referenced_tweet_type",
    "referenced_tweet_id",
    "scrape_time",
    "ds",
  ];

  const USER_COLS = [
    "id",
    "tname",
    "username",
    "verified",
    "profile_image_url",
    "verified_type",
  ];

  const MEDIA_COLS = [
    "id",
    "preview_img_url",
    "media_url",
    "media_type",
    "height",
    "width",
  ];

  const TWEET_TURL_COLS = [
    "tweet_id",
    "turl",
  ];

  for (const tweet of data.tweets) {
    for (const key of TWEET_COLS) {
      if (!tweet[key]) {
        tweet[key] = null;
      }
    }
  }

  for (const user of data.users) {
    for (const key of USER_COLS) {
      if (!user[key]) {
        user[key] = null;
      }
    }
  }
  for (const media of data.media) {
    for (const key of MEDIA_COLS) {
      if (!media[key]) {
        media[key] = null;
      }
    }
  }

  return await DB.tx((t) => {
    const ops = [];

    if (data.tweets.length > 0) {
      // make sure tweets array is unique by ID?
      const tweets = data.tweets.filter(
        (v, i, a) => a.findIndex((v2) => v2.id === v.id) === i
      );

      const tweet_cs = new pgp.helpers.ColumnSet(["retweet_count"], {
        table: "tweets",
      });
      const tweet_querystring =
        pgp.helpers.insert(tweets, TWEET_COLS, "tweets") +
        " ON CONFLICT ON CONSTRAINT tweets_id_key DO UPDATE SET" +
        tweet_cs.assignColumns({ from: "EXCLUDED", skip: "id" });
      ops.push(t.result(tweet_querystring));
    }

    if (data.users.length > 0) {
      const user_querystring =
        pgp.helpers.insert(data.users, USER_COLS, "authors") +
        " ON CONFLICT ON CONSTRAINT authors_id_key DO NOTHING";
      ops.push(t.result(user_querystring));
    }

    if (data.media.length > 0) {
      const media_querystring =
        pgp.helpers.insert(data.media, MEDIA_COLS, "media") +
        " ON CONFLICT ON CONSTRAINT media_id_key DO NOTHING";
      ops.push(t.result(media_querystring));
    }

    if (data.links.size > 0) {
      const links = Array.from(data.links).map(l => ({ turl: l }))
      const links_querystring = pgp.helpers.insert(links, ['turl'], "links") +
        " ON CONFLICT ON CONSTRAINT links_turl_key DO NOTHING"
      ops.push(t.result(links_querystring));
    }

    if (data.tweet_turls.length > 0) {
      const tweet_turl_querystring =
        pgp.helpers.insert(data.tweet_turls, TWEET_TURL_COLS, "tweet_turls")
      ops.push(t.result(tweet_turl_querystring));
    }

    return t.batch(ops);
  });
}

/* Function to get the list of elites from the db
 * that we want to get the tweets for
 */
async function fetchElites() {
  const query = `
    select elites.id, elites.username, max(created_at) as date 
    from elites left join tweets 
    on elites.id = tweets.author_id 
    group by elites.id, elites.username;
  `;
  const results = await DB.any(query);
  return results;
}

/* Fetch ALL tweets that were authored by the given id after the given date
 * and write them to to the database.
 */
async function fetch_and_write_for_id(id, username, date) {
  const st = Date.now();
  const MAX_TRIES = 3
  let response;
  for (const i = 0; i < MAX_TRIES; i++) {
    try {
      response = await fetch_for_id(id, date);
      break;
    } catch (e) {
      console.log(`  Request failed, trying again: ${e}`)
    }
  }
  if (response.data == undefined) {
    console.log(`  ${username}: No tweets found`)
    return
  }

  const st1 = Date.now();
  if (PERF_LOG)
    console.log(`  Time to fetch: ${(st1 - st) / 1000}s`)
  const data = parse_response(response)

  const st2 = Date.now();
  if (PERF_LOG)
    console.log(`  Time to parse: ${(st2 - st1) / 1000}s`)
  if (WRITE_DB) {
    const result = await update_db(data)
    const records_written = result.map(a => a.rowCount)
    console.log(`  Records written: ${JSON.stringify(records_written)}`)
  }
  if (PERF_LOG)
    console.log(`  Time to write DB: ${(Date.now() - st2) / 1000}s`)
}

// Fetch elite twitter accounts from DB and associated tweets, then write to the DB
async function fetchTweetsForElites(date_override) {
  const st = Date.now()
  const elites = await fetchElites();
  console.log(`Time to fetch elites: ${(Date.now() - st) / 1000}s`)
  for (let e of elites) {
    // If no tweets found in DB default to starting from last week
    const date = e.date || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    if (date_override) {
      console.log(`${(new Date()).toISOString()}: Fetching for ${e.username} ${date_override}`)
      await fetch_and_write_for_id(e.id, e.username, date_override.toISOString())
    } else {
      console.log(`  most recent tweet: ${date.toISOString()}`);
      await fetch_and_write_for_id(e.id, e.username, date.toISOString())
    }
    await new Promise(r => setTimeout(r, 500));
  }
}

// main entrypoint to scraper script. fetch all tweets for elites
async function fetchAllTweets() {
  await fetchTweetsForElites(null)
}

fetchAllTweets().then(() => { })
