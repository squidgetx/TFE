const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");

const auth = require("./lib/auth");

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

app.post("/fresh_tweets", auth.middleware, function (req, res, next) {
  fetch_tweets(req.body.username).then((r) => res.json(r));
});

app.post("/log_tweets", auth.middleware, function (req, res, next) {
  log_tweets(req.body.username, req.body.tweets)
    .then((r) => {
      return res.json(r);
    })
    .catch((err) => {
      next(new Error(err.message));
    });
});

app.post("/register", function (req, res, next) {
  auth
    .register(req.body.username, req.body.install_code)
    .then((r) => {
      return res.json(r);
    })
    .catch((err) => {
      next(new Error(err.message));
    });
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
