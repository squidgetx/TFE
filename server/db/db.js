const pgPromise = require("pg-promise");
const config = require("../lib/config");
const { ConnectionString } = require('connection-string');

const cnObj = new ConnectionString(config.dbConnectionString)
const cn = {
  host: cnObj.hostname,
  port: cnObj.port,
  database: cnObj.path?.[0],
  user: cnObj.user,
  password: cnObj.password,
  ssl: {
    rejectUnauthorized: false,
  },
};

const pgp = pgPromise();
const DB = pgp(cn);

module.exports = DB;

