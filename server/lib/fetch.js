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
  results = await db.any(
    `
   with relevant_tweets as (
      select * from tweets where author_id in (
        select id from elites where sign(ideo) = 1
      ) and referenced_tweet_type is null
      and created_at > CURRENT_DATE - 7
    ),
    with_links as (
      select 
        relevant_tweets.id as id,
        created_at,
        ttext,
        like_count,
        quote_count,
        retweet_count,
        reply_count,
        author_id,
        media_id_1,

        json_agg(json_build_object(
          'turl', tt.turl,
          'title', links.title,
          'media_type', links.media_type,
          'img', links.media_image,
          'hostname', links.hostname,
          'url', links.media_url,
          'desc', links.description
        )) FILTER (where links.media_url is not null) as link_info
      from relevant_tweets
        left join tweet_turls tt on tt.tweet_id = relevant_tweets.id
        left join links on tt.turl = links.turl 
        group by 1,2,3,4,5,6,7,8,9
    ) 
    select 
      with_links.id,
      created_at,
      ttext,
      like_count,
      quote_count,
      retweet_count,
      reply_count,
      author_id,
      media_id_1,

      profile_image_url,
      tname,
      username,
      verified,
      verified_type,

      media.media_type,
      media.media_url,
      preview_img_url,

      link_info
    from with_links
      inner join authors on with_links.author_id = authors.id
      left join media on with_links.media_id_1 = media.id
      order by created_at desc
      limit 64;
    `,
    -ideo_sign
  );
  return results;
};
