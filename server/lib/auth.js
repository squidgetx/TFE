const db = require("../db/db.js");

const cache = {};

const authenticate = async function (username, password) {
  if (username in cache) {
    if (cache[username].has(password)) {
      return 1;
    }
  }
  const res = await db.one(
    "SELECT COUNT(username) FROM users WHERE username = $1 and install_code = $2;",
    [username, password]
  );
  if (res["count"] > 0) {
    // add to the cache
    if (!(username in cache)) {
      cache[username] = new Set();
    }
    cache[username].add(password);
  }
  return res["count"];
};

const middleware = function (req, res, next) {
  const username = req.body.username;
  const passkey = req.body.password;
  console.log("received request", username, passkey);
  const authenticated = authenticate(username, passkey).then((result) => {
    console.log("Result of auth call: ", result);
    if (result > 0) {
      return next();
    } else {
      const err = new Error("Not authorized! Go back!");
      err.status = 401;
      return next(err);
    }
  });
  return authenticated;
};

/* Register a new user in the study */
const register = async function (user, install_code) {
  return await db.any(
    "INSERT INTO users VALUES ($1, $2, NULL, 0)",
    user,
    install_code
  );
};

module.exports = {
  middleware: middleware,
  register: register,
};
