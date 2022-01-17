const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const User = require("../models/user");
const ERRORS = {
    "missingU/P": "Username and password required",
    "invalidU/P": "Invalid username/password",
    "allRequired": "All fields are required",
    "takenUser": "Username taken. Please pick another!"
};

/** POST /login - login: {username, password} => {token} **/
router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      throw new ExpressError(ERRORS["missingU/P"], 400);
    }
    const user = await User.get(username);
    if(user && await User.authenticate(username, password)){
      await User.updateLoginTimestamp(username);
      const _token = jwt.sign({ username:username }, SECRET_KEY);    
      return res.json({ message: `Logged in!`, _token });
    }else{
      throw new ExpressError(ERRORS["invalidU/P"], 400);
    }
  } catch (e) {
    return next(e);
  }
});

/** POST /register - register user: registers, logs in, and returns token.*/
router.post("/register", async (req, res, next) => {
  try {
    const { username, password, first_name, last_name, phone } = req.body;
    if (!username || !password || !first_name || !last_name || !phone) {
      throw new ExpressError(ERRORS["allRequired"], 400);
    }
    const user = await User.register({
      username,
      password,
      first_name,
      last_name,
      phone,
    });
    await User.updateLoginTimestamp(username);
    const _token = jwt.sign({ username:username }, SECRET_KEY);
    return res.json({ user, _token });
  } catch (e) {
    if (e.code === "23505") {
      return next(new ExpressError(ERRORS["takenUser"], 400));
    }
    next(e);
  }
});

module.exports = router;