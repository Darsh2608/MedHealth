const winston = require('winston');

const LOG_TYPE_ERROR = "error";
const LOG_TYPE_INFO = "info";

const transportDebug = new (require('winston-daily-rotate-file'))({
  name: 'debug',
  dirname: 'logs',
  filename: 'debug-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'debug',
  zippedArchive: false,
  json: true
});

const transportError = new (require('winston-daily-rotate-file'))({
  name: 'error',
  dirname: 'logs',
  filename: 'error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  zippedArchive: false,
  json: true
});

// creates a new Winston Logger
const errorLogger = new winston.createLogger({
  format:  winston.format.combine(winston.format.timestamp({format: 'DD.MM.YYYY HH:mm:ss'}), winston.format.json()),
  transports: [
    transportError
  ],
  exitOnError: false
});

const debugLogger = new winston.createLogger({
  format:  winston.format.combine(winston.format.timestamp({format: 'DD.MM.YYYY HH:mm:ss'}), winston.format.json()),
  transports: [
    transportDebug
  ],
  exitOnError: false
});
module.exports = { debugLogger, errorLogger };
