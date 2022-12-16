const pgPromise = require("pg-promise");
const config = require("../lib/config");

const pgp = pgPromise({});
const DB = pgp(config.dbConnectionString);

module.exports = DB;
