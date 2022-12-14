const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");

const authenticationMiddleware = require("./lib/auth");

const fetch_tweets = require("./lib/fetch");
const log_tweets = require("./lib/log");

const app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());
app.use(authenticationMiddleware);

/* POST fetch new tweet */
app.post("/fresh_tweets", function (req, res, next) {
  fetch_tweets(req.body.username).then((r) => res.json(r));
});

app.post("/log", function (req, res, next) {
  log_tweets(req.body.username, req.body.data).then((r) => res.json(r));
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  console.log(err, err.message);
  res.render("error");
});

module.exports = app;