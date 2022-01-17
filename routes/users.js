const express = require("express");
const router = new express.Router();
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");
const User = require("../models/user");

/** GET / - get list of users.**/
router.get("/", ensureLoggedIn, async (req, res, next) => {
    try {
        const allUsers = await User.all();
        return res.json({ users: allUsers });
    } catch (e) {
        next(e);
    }
});

/** GET /:username - get detail of users.**/
router.get( "/:username", ensureLoggedIn, ensureCorrectUser, async (req, res, next) => {
    try {
        const { username } = req.user;
        const user = await User.get(username);
        return res.json({ user: user });
    } catch (e) {
        next(e);
    }
  });

/** GET /:username/to - get messages to user **/
router.get("/:username/to",  ensureLoggedIn, ensureCorrectUser, async (req, res, next) => {
    try{
        const { username } = req.user;
        const messages = await User.messagesTo(username);
        return res.json({messages: messages});
    } catch(e) {
        next(e);
    }
})

/** GET /:username/from - get messages from user **/
 router.get("/:username/from",  ensureLoggedIn, ensureCorrectUser, async (req, res, next) => {
    try{
        const { username } = req.user;
        const messages = await User.messagesFrom(username);
        return res.json({messages: messages});
    } catch(e) {
        next(e);
    }
})

module.exports = router;