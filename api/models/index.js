'use strict';

const fs = require('fs');
const path = require('path');
const moment = require("moment-timezone");
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config');
const db = {};

let timezone;
if (config.hasOwnProperty("timezone")) {
  timezone = moment.tz(config.timezone).format("Z");
} else {
  timezone = moment.tz("Europe/Oslo").format("Z");
}

const sequelize = new Sequelize(config.database, config.username, config.password, {
  dialect: config.dialect,
  host: config.host,
  port: config.port,
  timezone: timezone,
  logging: (env == 'production' || env == 'dev') ? false: console.log,
  pool: {
    max: 50,
    min: 0,
    acquire: 1200000,
    idle: 1000000
  }
});

// Debug logging to identify issues with file loading
console.log('Files being read:', __dirname);
fs.readdirSync(__dirname)
  .filter(file => {
    console.log('Filtering file:', file);
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    try {
      const model = require(path.join(__dirname, file))(sequelize, Sequelize);
      db[model.name] = model;
    } catch (error) {
      console.error('Error loading model file:', file, error);
    }
  });

// Establish associations if defined in models
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Export sequelize and Sequelize
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Authenticate database connection
sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(error => {
    console.error('Unable to connect to the database:', error);
  });

module.exports = db;
