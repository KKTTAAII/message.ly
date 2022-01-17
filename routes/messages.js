const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const { ensureLoggedIn } = require("../middleware/auth");
const Message = require("../models/message");
const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = require("../config");
const client = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
const ERRORS = {"unauthorized": "unauthorized user"};

/** GET /:id - get detail of message. **/
router.get("/:id", ensureLoggedIn, async (req, res, next) => {
    try{
        const { username } = req.user;
        const { id } = req.params;
        const message = await Message.get(id);
        const fromUser = message.from_user.username;
        const toUser = message.to_user.username;
        if(username === fromUser || username === toUser){
            return res.json({message: message});
        }else{
            throw new ExpressError(ERRORS["unauthorized"], 400);
        }
    }catch(e){
        next(e);
    }
})

/** POST / - post message and send SMS to the recipient.**/
router.post("/", ensureLoggedIn, async (req, res, next) => {
    try{
        const { username } = req.user;
        const from_username = username;
        const { to_username } = req.body;
        const { msgBody } = req.body;
        const body = msgBody;
        const message = await Message.create({from_username, to_username, body});
        client.messages
            .create({
                body: `You’ve received a message.ly from ${username}!`,
                from: '+19148170337',
                to: '+19704099735'
            });
        return res.json({message: message});
    } catch(e) {
        next(e);
    }
})

/** POST/:id/read - mark message as read**/
router.post("/:id/read", ensureLoggedIn, async (req, res, next) => {
    try{
        const { username } = req.user;
        const { id } = req.params;
        const message = await Message.get(id);
        const toUser = message.to_user.username;
        if(username === toUser){
            const read = await Message.markRead(id);
            return res.json({message: read});
        }else{
            throw new ExpressError(ERRORS["unauthorized"], 400);
        }
    } catch(e) {
        next(e);
    }
})

 module.exports = router;