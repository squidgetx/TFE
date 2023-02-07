const db = require("../db/db.js");

// ask DB for random selection of fresh tweets for the given user
// we look up the user's ideology in the db to inform whether we 
// return conservative or liberal tweets
// if mock_ideo argument is nonzero however, we use that instead
// (useful for debugging)
module.exports = async function (username, mock_ideo) {

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
    order by created_at desc
    limit 64;
    `,
    -ideo_sign
  );
  return results;
};
