const db = require("../db");
const { BCRYPT_WORK_FACTOR } = require("../config");
const bcrypt = require("bcrypt");
const ExpressError = require("../expressError");
/** User of the site. */

class User {
  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */
  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const results = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING username, password, first_name, last_name, phone, join_at, last_login_at`,
      [username, hashedPassword, first_name, last_name, phone, new Date(), new Date()]
    );
    return results.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */
  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT username, password, first_name, last_name, phone 
        FROM users
        WHERE username = $1`,
      [username]
    );
    const user = result.rows[0];
    if(!user){
      throw new ExpressError("Invalid user", 400);
    }else{
      const isCorrectPassword = await bcrypt.compare(password, user.password);
      return isCorrectPassword ? true : false;
    }
  }

  /** Update last_login_at for user */
  static async updateLoginTimestamp(username) {
    await db.query(
      `UPDATE users SET last_login_at = $1
        WHERE username = $2`,
      [new Date(), username]
    );
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */
  static async all() {
    const results = await db.query(
      `SELECT username, first_name, last_name, phone
        FROM users
        ORDER BY first_name, last_name`);
    return results.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */
  static async get(username) {
    const results = await db.query(
      `SELECT username,
        first_name,
        last_name,
        phone,
        join_at,
        last_login_at
      FROM users
      WHERE username = $1`,
      [username]
    );
    return results.rows[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */
  static async messagesFrom(username) {
    const results = await db.query(
      `SELECT m.id,
        m.from_username,
        f.first_name AS from_first_name,
        f.last_name AS from_last_name,
        f.phone AS from_phone,
        m.to_username,
        t.first_name AS to_first_name,
        t.last_name AS to_last_name,
        t.phone AS to_phone,
        m.body,
        m.sent_at,
        m.read_at
      FROM messages AS m
      JOIN users AS f ON m.from_username = f.username
      JOIN users AS t ON m.to_username = t.username
      WHERE m.from_username = $1`,
      [username]
    );
    return results.rows.map((message) => {
      let messageFrom = {};
      messageFrom.id = message.id;
      messageFrom.body = message.body;
      messageFrom.sent_at = message.sent_at;
      messageFrom.read_at = message.read_at;
      messageFrom.to_user = {};
      messageFrom.to_user.first_name = message.to_first_name;
      messageFrom.to_user.last_name = message.to_last_name;
      messageFrom.to_user.phone = message.to_phone;
      messageFrom.to_user.username = message.to_username;
      return messageFrom;
    });
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */
  static async messagesTo(username) {
    const results = await db.query(
      `SELECT m.id,
        m.from_username,
        f.first_name AS from_first_name,
        f.last_name AS from_last_name,
        f.phone AS from_phone,
        m.to_username,
        t.first_name AS to_first_name,
        t.last_name AS to_last_name,
        t.phone AS to_phone,
        m.body,
        m.sent_at,
        m.read_at
      FROM messages AS m
      JOIN users AS f ON m.from_username = f.username
      JOIN users AS t ON m.to_username = t.username
      WHERE m.to_username = $1`,
      [username]
    );
    return results.rows.map((message) => {
      let messageTo = {};
      messageTo.id = message.id;
      messageTo.body = message.body;
      messageTo.sent_at = message.sent_at;
      messageTo.read_at = message.read_at;
      messageTo.from_user = {};
      messageTo.from_user.first_name = message.from_first_name;
      messageTo.from_user.last_name = message.from_last_name;
      messageTo.from_user.phone = message.from_phone;
      messageTo.from_user.username = message.from_username;
      return messageTo;
    });
  }
}

module.exports = User;