var express = require('express');
var router = express.Router();
var authRouter = require('./auth');
var userRouter = require('./user');
var hospitalRouter = require('./hospital');
var bookingRouter = require('./booking');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.send("Hello World!")
});
router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/hospital', hospitalRouter);
router.use('/bookings', bookingRouter);


module.exports = router;
