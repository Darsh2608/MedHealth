/**
 * Configurations of logger.
 */
const winston = require('winston');
const env = process.env.NODE_ENV;
const fs = require('fs');
var util = require('util');

const logDir = __dirname + '/logs';
// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const successLogger = new winston.createLogger({
  transports: [
    // colorize the output to the console
    new (winston.transports.Console)({
      colorize: true,
      level: "info"
    }),
    new (require('winston-daily-rotate-file'))({
      name: 'access-file',
      filename: `${logDir}/%DATE%-access.log`,
      datePattern: 'DD-MM-YYYY',
      prepend: true,
      level: "info",
      timestamp: function () {
        return getDateTime();
      }
    })
  ]
});

const errorLogger = new winston.createLogger({
  transports: [
    // colorize the output to the console
    new (winston.transports.Console)({
      colorize: true,
      level: "error"
    }),
    new (require('winston-daily-rotate-file'))({
      name: 'error-file',
      filename: `${logDir}/%DATE%-error.log`,
      datePattern: 'DD-MM-YYYY',
      prepend: true,
      level: "error",
      timestamp: function () {
        return getDateTime();
      }
    })
  ]
});

if (env === "production") {
  errorLogger.remove(winston.transports.Console);
  successLogger.remove(winston.transports.Console);
}

function getDateTime () {
  var currentdate = new Date();
  var datetime = currentdate.getDate() + "/"
      + (currentdate.getMonth() + 1) + "/"
      + currentdate.getFullYear() + " "
      + currentdate.getHours() + ":"
      + currentdate.getMinutes() + ":"
      + currentdate.getSeconds();
  return datetime;
}

function formatArgs (args) {
  return [util.format.apply(util.format, Array.prototype.slice.call(args))];
}

console.log = function () {
  successLogger.info.apply(successLogger, formatArgs(arguments));
};

console.error = function () {
  errorLogger.error.apply(errorLogger, formatArgs(arguments));
};


module.exports = {
  'successlog': successLogger,
  'errorlog': errorLogger
};
