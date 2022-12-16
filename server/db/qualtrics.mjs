/*
 * Script module to load users' qualtrics data into the db
 * We want to load ideo, twitter handle, and registration code
 * Ignore treatment group for now
 */
import { assert } from "console";
import fs from "fs";
import decompress from "decompress";

import Qualtrics from "qualtrics-api";
import { default as config } from "../lib/config.js";
import pgPromise from "pg-promise";

const pgp = pgPromise({});
import { default as DB } from "./db.js";

// todo fix this

const downloadSurveyResponses = async function (survey_id) {
  console.log("downloading responses from qualtrics...");
  const qconfig = {
    apiToken: config.qualtricsAPIToken,
    baseUrl: "https://nyu.qualtrics.com/API/v3/",
  };

  const qualtrics = new Qualtrics(qconfig);
  const OUTDIR = "data_qualtrics";
  // Clean out the directory before downloading new files
  fs.readdirSync(OUTDIR).forEach((f) => fs.rmSync(`${OUTDIR}/${f}`));

  await qualtrics.downloadResponseExport(survey_id, "temp.zip", {
    format: "json",
  });
  await decompress("temp.zip", OUTDIR);
  const fnames = fs.readdirSync(OUTDIR);
  assert(fnames.length == 1);
  return `${OUTDIR}/${fnames[0]}`;
};

// read downloaded csv from the disk and return js object of relevant fields
// csv api is weird, so you have to pass callback to process the returned data
const jsonToData = function (filename, cb) {
  let rawdata = fs.readFileSync(filename);
  let data = JSON.parse(rawdata);
  const QID_install_code = "QID19_TEXT";
  const QID_ideo = "QID3";
  const QID_pid3 = "QID2";
  // QID ideo is on a scale of 1-5, with 1 being more conservative and 5 being more liberal
  return data["responses"].map((res) => {
    return {
      install_code: res.values[QID_install_code],
      ideo: 3 - res.values[QID_ideo],
    };
  });
};

const update_db = async function (data) {
  console.log("updating database with respondent ideologies...");
  // slightly tricky because we don't have twitter handles in the survey: only install codes
  const codes = data.map((d) => d.install_code);
  const usernames = await DB.any(
    "select install_code, username from users where install_code in ($1:csv)",
    [codes]
  );

  // Note we don't bother to make sure that the install codes from the input dataset are unique
  // We default to using later rows in the download data in this case :P
  const code_map = {};
  for (const d of data) {
    if (d.install_code in code_map) {
      console.log(`WARNING: ${d.install_code} already present in data`);
    }
    code_map[d.install_code] = d.ideo;
  }

  const updated_users = usernames.map((u) => {
    u.ideo = code_map[u.install_code];
    delete u.install_code;
    return u;
  });
  console.log(updated_users);

  // https://stackoverflow.com/questions/39119922/postgresql-multi-row-updates-in-node-js
  const cs = new pgp.helpers.ColumnSet(["username", "ideo"], {
    table: "users",
  });
  const updateQuery =
    pgp.helpers.update(updated_users, cs) + " WHERE v.username = t.username";
  await DB.none(updateQuery);
};

const PRESURVEY_TEST_ID = "SV_cC75ZPgYh3Swy1M";

downloadSurveyResponses(PRESURVEY_TEST_ID)
  .then((outname) => {
    let d = jsonToData(outname);
    update_db(d).then(() => {
      console.log("done");
    });
  })
  .catch((err) => console.log(err));
