var express = require('express');
var router = express.Router();

const { verifySignUp } = require("../middlewares");
const authController = require("../controllers/auth.controller");
const { authJwt } = require("../middlewares");

router.post('/signup', [
  verifySignUp.checkDuplicateEmail,
], authController.signup);

router.post("/login", authController.signin);
router.post("/get-login-data", [authJwt.verifyToken], authController.getUserData);

module.exports = router;
