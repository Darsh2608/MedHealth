const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const logger = require("morgan");
const moment = require("moment");
const momentTz = require("moment-timezone");
const constants = require("./config/constant");
const compression = require("compression");
const cors = require("cors"); // Added cors middleware
const cron = require("node-cron");
const indexRouter = require("./routes/index");

const timeZone = 'Europe/Oslo';
var app = express();
app.use(compression());

momentTz.tz.setDefault(timeZone);
moment.locale('nb');

const i18n = require("i18n");
i18n.configure({
  locales: constants.SUPPORTED_LANG,
  defaultLocale: constants.DEFAULT_LANG,
  directory: __dirname + "/locales",
  fallbacks: constants.FALLBACK_LANG,
  autoReload: true,
});

app.set('view engine', 'ejs');
app.use(i18n.init);

app.use(bodyParser.json({limit: "1gb"}));
app.use(bodyParser.urlencoded({limit: "1gb", extended: true, parameterLimit:50000}));
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(cors()); // Enable CORS

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", true);
  res.header('Access-Control-Allow-Headers', 'Access-Control-Allow-Origin, Origin, X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Cache-Control, Key, X-File-Name, Authorization, CID, UPID');
  next();
});

app.use("/api", indexRouter);

app.use(function (req, res, next) {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});

app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    status: "error",
    code: err.status || 500,
    errors: {
      message: err.message,
      error: {},
    },
  });
});

var uploadPath = __dirname + '/public/uploads/';
var publicPath = __dirname + '/public/';
app.locals.uploadPath = uploadPath;
app.locals.publicPath = publicPath;

module.exports = app;
