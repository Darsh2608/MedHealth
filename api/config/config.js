require('dotenv').config();

const username = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;
const database = process.env.DB_NAME;
const host = process.env.DB_HOST;
const node_env = process.env.NODE_ENV;
const timezone = process.env.DB_TIMEZONE || "Europe/Oslo";
const dialect = process.env.DB_DIALECT
const charset = process.env.DB_CHARSET || "utf8mb4";
const collate = process.env.DB_COLLATE || "utf8mb4_unicode_ci";
const port = process.env.DB_PORT;

const config = {
  dev: {
    username,
    password,
    database,
    host,
    port,
    timezone,
    dialect,
    dialectModule: require('mysql2'),
    charset,
    collate
  },
  test: {},
  production: {
    username,
    password,
    database,
    host,
    port,
    timezone,
    dialect,
    charset,
    collate
  }
}

module.exports = config[node_env]
