const authenticate = function (username, password) {
  // TODO
  return true;
};

module.exports = function (req, res, next) {
  const username = req.body.username;
  const passkey = req.body.password;
  console.log("received request", username, passkey);
  const authenticated = authenticate(username, passkey);
  if (authenticated) {
    next();
  } else {
    const err = new Error("Not authorized! Go back!");
    err.status = 401;
    return next(err);
  }
};
