const express = require("express");
const router = express.Router();
const pgp = require("pg-promise")(/* options */);

const DB_CONN_STRING = "postgres://username:password@host:port/database";
const db = pgp(DB_CONN_STRING);

const DUMMY_TWEET = {
  text: `All the more so when you consider that Biddle himself then went on to oversee the "Great Sedition Trial" of 1944 (30 fascist and pro-Nazi defendants accused of conspiring with the Hitler government), which also ended in a mistrial...`,
  link: {
    img: "https://pbs.twimg.com/card_img/1597987880143667202/6QJHfTwe?format=jpg&name=medium",
    domain: "washingtonpost.com",
    headline:
      "Analysis | Right-wing White men are not usually convicted of seditious...",
    lede: "Since the aftermath of the Civil War, it appears that only non-White people or those not espousing right-wing views have been convicted.",
    href: "https://google.com",
  },
  socialContext: "",
  socialContextLink: "youtube.com",
  userName: "Rachel Maddow MSNBC",
  userHandle: "maddow",
  userNameLink: "twitter.com/FoxNews",
  tweetLink: "https://twitter.com/WhiteHouse/status/1585376693430124544",
  avatar:
    "https://pbs.twimg.com/profile_images/59437078/icon-200x200_400x400.jpg",
  likeCount: 767,
  replyCount: 106,
  retweetCount: 246,
  preText: "",
  isVerified: true,
};

const authenticate = function (username, password) {
  // TODO
  return true;
};

const fetch_tweets = function (username) {
  // pseudocode: ask DB for random selection of fresh tweets for the given user
  // ok, how is the db gonna be set up
  // users table with handle => ideo
  // then tweets table with ds, author, author_ideo, tweet_json
  // todo: fix this query
  db.one("SELECT $1 AS value", 123)
    .then((data) => {
      console.log("DATA:", data.value);
    })
    .catch((error) => {
      console.log("ERROR:", error);
    });
  return [DUMMY_TWEET];
};

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

/* GET fetch new tweet */
router.post("/fresh_tweets", function (req, res, next) {
  const username = req.body.username;
  const password = req.body.password;
  if (!authenticate(username, password)) {
    res.send(403, "You do not have rights to visit this page");
  } else {
    res.json(fetch_tweets(username));
  }
});

module.exports = router;
