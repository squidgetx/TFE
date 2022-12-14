/* code to scrape tweets from a fixed list of twitter accounts and write it to the DB */

// Bulk of scraper is done
// Need to get list of accounts and set up cron job
// do some code cleanup
// next big chunk is to query the DB from the extension side

import { Client } from "twitter-api-sdk";
import { getLinkPreview } from "link-preview-js";
import { parse } from "url";
import pgPromise from "pg-promise";
import { url } from "inspector";

const pgp = pgPromise({});

// todo fix this
const DB = pgp("postgres://testuser:password@localhost:5432/server-dev");

const BEARER_TOKEN = process.env.BEARER_TOKEN;

const WRITE_DB = true;

async function fetch_for_id(id, time) {
  const client = new Client(BEARER_TOKEN);

  const response = await client.tweets.usersIdTweets(id, {
    start_time: time, // "2022-12-01T00:00:00.000Z",
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
    // TODO what if there are more than 1 referenced tweet? is that even possible
  }
  if ("attachments" in tweet) {
    tweet.media_id_1 = tweet.attachments.media_keys[0];
    tweet.media_id_2 = tweet.attachments.media_keys[1];
    // TODO log if > 1 media key
  }
  tweet.scrape_time = new Date();
  tweet.ds = tweet.scrape_time.toISOString().split("T")[0];

  // pull out links
  const link_re = /(https:\/\/t.co\/\w+)/g;
  if (tweet.text) {
    const matches = tweet.text.match(link_re);
    if (matches) {
      tweet.link_preview_url = matches.at(-1);
    }
  }
  return tweet;
}

function parse_user(user) {
  user.tname = user.name;
  return user;
}

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

async function get_link_preview_exp(url, attempt, max_attempts) {
  if (attempt > max_attempts) {
    return null;
  }
  try {
    return await getLinkPreview(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0",
      },
      timeout: Math.exp(attempt) * 1000,
    });
  } catch {
    return await get_link_preview_exp(url, attempt + 1, max_attempts);
  }
}
/*

}

/* Given a tweet object, generate the elements needed for a link preview and return it as a media object */
async function process_links(tweet) {
  // When there's more than one link, Twitter renders the card for the last link that has a renderable preview
  // There's actually a bug where the composer will show the wrong link preview in the case where the
  // first link has Twitter metadata (eg, NYT link) and the second doesn't (eg, stack overflow link)
  if (!tweet.link_preview_url) {
    return null;
  }
  const unwrapped_link = await getLinkPreview(tweet.link_preview_url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0",
    },
    followRedirects: `follow`,
  });

  // check if valid URL (throw error if parse fails)
  let _ = new URL(unwrapped_link.title);

  const link_meta = await get_link_preview_exp(unwrapped_link.title, 0, 10);
  if (link_meta) {
    link_meta.hostname = parse(link_meta["url"]).hostname;
    link_meta.media_type = link_meta.mediaType;
    link_meta.media_url = link_meta.url;
    link_meta.media_image = link_meta.images[0];
    link_meta.turl = tweet.link_preview_url;
  }
  return link_meta;
}

async function parse_response(response) {
  // Todo deal with > 100 tweets, but i dont think that really is important for now
  // A bit complicated because RT/Quote tweets exist :P
  // So for RT/Quote tweets, we add 2 tweets to the DB: one for the original tweet and one for the OG
  const tweets = response.data
    .map((t) => parse_tweet(t))
    // filter duplicate ids, which apparently happens sometimes (keep first entry)
    .filter((v, i, a) => a.findIndex((v2) => v2.id === v.id) === i);
  const users = response.includes.users.map((u) => parse_user(u));
  const referenced_tweets = response.includes.tweets.map((t) => parse_tweet(t));
  const media = response.includes.media.map((m) => parse_media(m));
  const all_tweets = tweets.concat(referenced_tweets);
  const links = (
    await Promise.all(all_tweets.map((t) => process_links(t)))
  ).filter((l) => l !== null);
  return {
    tweets: all_tweets,
    users: users,
    media: media,
    links: links,
  };
}

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
  ];

  const MEDIA_COLS = [
    "id",
    "preview_img_url",
    "media_url",
    "media_type",
    "height",
    "width",
  ];

  const LINK_COLS = [
    "turl",
    "hostname",
    "title",
    "description",
    "media_url",
    "media_image",
    "media_type",
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

  for (const link of data.links) {
    for (const key of LINK_COLS) {
      if (!link[key]) {
        link[key] = null;
      }
    }
  }

  return await DB.tx((t) => {
    const tweet_cs = new pgp.helpers.ColumnSet(["retweet_count"], {
      table: "tweets",
    });

    const tweet_querystring =
      pgp.helpers.insert(data.tweets, TWEET_COLS, "tweets") +
      " ON CONFLICT ON CONSTRAINT tweets_id_key DO UPDATE SET" +
      tweet_cs.assignColumns({ from: "EXCLUDED", skip: "id" });

    const user_querystring =
      pgp.helpers.insert(data.users, USER_COLS, "authors") +
      " ON CONFLICT ON CONSTRAINT authors_id_key DO NOTHING";

    const media_querystring =
      pgp.helpers.insert(data.media, MEDIA_COLS, "media") +
      " ON CONFLICT ON CONSTRAINT media_id_key DO NOTHING";

    const link_querystring =
      pgp.helpers.insert(data.links, LINK_COLS, "links") +
      " ON CONFLICT ON CONSTRAINT links_turl_key DO NOTHING";

    return t.batch([
      t.none(tweet_querystring),
      t.none(user_querystring),
      t.none(media_querystring),
      t.none(link_querystring),
    ]); // all of the queries are to be resolved;
  });
}

async function test_fetch() {
  const response = await fetch_for_id("16129920", "2022-11-11T00:00:00.000Z");
  const data = await parse_response(response);
  console.log(data);
  debugger;
  if (WRITE_DB) {
    const result = await update_db(data);
  }
}

let test_link = "https://t.co/8DeOSDaTsT";
("https://www.washingtonpost.com/dc-md-va/2022/11/29/rhodes-oathkeepers-sedition-verdict-jan6/");
const unwrapped_link = await getLinkPreview(test_link, {
  headers: {
    "user-agent":
      "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0",
  },
  followRedirects: `follow`,
});

test_fetch().then((result) => {
  //console.log(JSON.stringify(result, null, 2));
});
