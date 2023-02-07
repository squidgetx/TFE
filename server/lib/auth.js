const db = require("../db/db.js");

const cache = {};
const MAX_CACHE_SIZE = 1000;

// Given a username and password check it against the DB and return nonzero if valid
// and zero otherwise
const authenticate = async function (username, password) {
  if (username in cache) {
    if (cache[username].has(password)) {
      return 1;
    }
  }
  try {
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

      // reset when the cache is too big 
      if (Object.keys().length > MAX_CACHE_SIZE) {
        cache = {}
      }
    }
    return res["count"];
  } catch (error) {
    console.log(`ERROR: db lookup failed for username ${username}, message ${error.message}`)
    const err = new Error("Operation failed")
    err.status = 500
    return next(err)
  }
};

// Wrap authentication in an Express middleware function
// so we can automatically apply it to any request
// Return 403 forbidden if not authorized
const middleware = function (req, res, next) {
  const username = req.body.username;
  const passkey = req.body.password;
  const authenticated = authenticate(username, passkey).then((result) => {
    console.log("Result of auth call: ", result);
    if (result > 0) {
      return next();
    } else {
      const err = new Error("Not authorized! Go back!");
      err.status = 403;
      return next(err);
    }
  });
  return authenticated;
};

/* Register a new user in the study */
const register = async function (user, install_code) {
  if (!user || !install_code) {
    const err = new Error("Invalid user or installation code")
    err.status = 400
    return next(err)
  }
  return await db.any("INSERT INTO users VALUES ($1, $2, NULL, 0)", [
    user,
    install_code,
  ]);
};

module.exports = {
  middleware: middleware,
  register: register,
};
