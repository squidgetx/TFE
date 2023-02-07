const db = require("../db/db.js");

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

module.exports = async function (username, mock_ideo) {
  // pseudocode: ask DB for random selection of fresh tweets for the given user

  // if ideo is passed as 0 then we fetch the ideo from the db
  // otherwise we use the presupplied ideo value (for debugging)
  let ideo = mock_ideo;
  if (ideo == 0) {
    const ideo_result = await db.one(
      "SELECT ideo from users where username = $1 LIMIT 1",
      username
    );
    ideo = ideo_result.ideo;
  }
  console.log("got mock ideo value ", mock_ideo);
  const ideo_sign = Math.sign(ideo);

  // todo: handle retweets
  // todo: make sure the null filter is actually working
  results = await db.any(
    `
   with relevant_tweets as (
      select * from tweets where author_id in (
        select id from elites where sign(ideo) = $1
      ) and referenced_tweet_type is null
      order by created_at desc
      limit 256
    )
    select 
      relevant_tweets.id as id,
      created_at,
      ttext,
      like_count,
      quote_count,
      retweet_count,
      reply_count,

      media.media_type,
      media.media_url,
      preview_img_url,

      turl as link_url,
      title as link_title,
      links.media_type as link_type,
      links.media_image as link_image,
      hostname as link_hostname,
      description as link_description,

      profile_image_url,
      tname,
      username,
      verified
     from relevant_tweets
    left join links on relevant_tweets.link_preview_url = links.turl
    left join media on relevant_tweets.media_id_1 = media.id
    left join authors on relevant_tweets.author_id = authors.id
    order by random()
    limit 64;
    `,
    -ideo_sign
  );
  return results;
};
