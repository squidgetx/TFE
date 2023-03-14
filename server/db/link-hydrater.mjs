/* code to scrape tweets from a fixed list of twitter accounts and write it to the DB */

import { getLinkPreview } from "link-preview-js";
import { parse } from "url";

import pgPromise from "pg-promise";

const pgp = pgPromise({});
const BATCH_SIZE = 100

import { default as DB } from "./db.js";

async function get_unhydrated_links() {
  const query = `
    select turl
    from links
    where media_type is null
    order by random ()
    limit ${BATCH_SIZE};
  `;
  const results = await DB.any(query);
  return results;
}

// Helper function to pull link preview properties from a given url using
// expotential backoff retry strategy and handling redirects
// Quit after max_attempts 
async function get_link_preview_exp(url, attempt, max_attempts, og_url) {
  if (attempt > max_attempts) {
    console.log(`Timed out!`);
    return null;
  }
  try {
    return await getLinkPreview(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0",
      },
      timeout: Math.exp(attempt) * 1000,
      followRedirects: `follow`,
    });
  } catch {
    return await get_link_preview_exp(url, attempt + 1, max_attempts, og_url);
  }
}

// Follow redirects for the given url and return the link preview information for the final 
// url destination 
async function unwrapLink(url) {
  const unwrapped_link = await get_link_preview_exp(url, 0, 4, url);
  try {
    let purl = new URL(unwrapped_link.title);
    if (purl.protocol.includes("http") && unwrapped_link.title != url) {
      return await unwrapLink(unwrapped_link.title);
    } else {
      return unwrapped_link;
    }
  } catch (e) {
    return unwrapped_link;
  }
}

/* generate the elements needed for a link preview and return it as a media object */
async function process_link(link) {
  const link_meta = await unwrapLink(link);

  // validate
  if (link_meta == null) {
    console.log(`Failed to parse ${link}: resolved to null`)
    return null
  }
  const link_re = /(https:\/\/t.co\/\w+)/g;
  if (link_meta.url.match(link_re)) {
    // the resolved URL is still a t.co format URL 
    console.log(`Failed to parse ${link}: resolved to ${JSON.stringify(link_meta)}`)
  }
  link_meta.hostname = parse(link_meta["url"]).hostname;
  link_meta.media_type = link_meta.mediaType;
  link_meta.media_url = link_meta.url;
  link_meta.media_image = link_meta.images ? link_meta.images[0] : [];
  link_meta.turl = link
  console.log(`${link} => ${link_meta.url}`)
  return link_meta;
}

// Take the result of parse_response and write data to the database
async function update_db(links) {

  const LINK_COLS = [
    "turl",
    "hostname",
    "title",
    "description",
    "media_url",
    "media_image",
    "media_type",
  ];

  for (const link of links) {
    for (const key of LINK_COLS) {
      if (!link[key]) {
        link[key] = null;
      }
    }
  }

  return await DB.tx((t) => {
    const ops = [];

    if (links.length > 0) {
      const link_cs = new pgp.helpers.ColumnSet(["hostname", "title", "description", "media_url", "media_image", "media_type"], {
        table: "links",
      });
      const link_querystring =
        pgp.helpers.insert(links, LINK_COLS, "links") +
        " ON CONFLICT ON CONSTRAINT links_turl_key DO UPDATE SET" +
        link_cs.assignColumns({ from: "EXCLUDED", skip: "turl" });
      ops.push(t.result(link_querystring));
    }

    return t.batch(ops);
  });
}

// main entrypoint 
async function hydrate_batch() {
  const links = await get_unhydrated_links()
  console.log(`Hydrating ${links.length}...`)
  const hydrated = await Promise.all(links.map(l => process_link(l.turl)))
  await update_db(hydrated.filter(a => a != null))
  return links.length
}

async function main() {
  let last_batch_size = 0
  while (true) {
    const n = await hydrate_batch()
    if (n == 0 || (last_batch_size == n && n < BATCH_SIZE)) {
      break
    }
    last_batch_size = n
  }

}

main().then(() => { })
