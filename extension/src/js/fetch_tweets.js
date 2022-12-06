// The proportion of tweets that should be replaced
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

export const fetch_tweet = function (username) {
  return DUMMY_TWEET;
};
