const jwt = require("jsonwebtoken");
const config = require("../config/constant.js");
const models = require("../models");
const Users = models.Users;
var CryptoJS = require("crypto-js");
const { parse } = require("dotenv");

verifyToken = (req, res, next) => {
  let token = req.headers.authorization;

  if (!token) {
    return res.status(400).send({
      message: "no-token-provided"
    });
  }

  jwt.verify(token, config.JSON_SECRET_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: err.message
      });
    }
    req.userId = decoded.id;
    next();
  });
};



const authJwt = {
  verifyToken: verifyToken
};

module.exports = authJwt;
