require('dotenv').config();

module.exports = {
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 16,
  PASSWORD_SALT: '36cc8e932b2f396b',
  BASE_URL: 'http://localhost:3000/',

  BASE_URL_SHORT: 'localhost:3000/',

  SYSTEM_TIMEZONE: 'Europe/Oslo',
  DB_DATE_FORMAT: "YYYY-MM-DD HH:mm:ss",
  VIEW_DATE_FORMAT: "DD.MM.YYYY",
  VIEW_DATETIME_FORMAT: "DD.MM.YYYY HH:mm",
  VIEW_TIME_FORMAT: "HH:mm",

  SUPPORTED_LANG: ['nl', 'en'],
  SUPPORTED_LANG_FULLNAME: ['lbl_norwegian', 'lbl_english'],
  DEFAULT_LANG: 'en',
  FALLBACK_LANG: { 'nl': 'en' },

  COMPANY_LIST_THUMB: { height: 100, responseType: 'base64' },
  SERVICE_LIST_THUMB: { height: 100, responseType: 'base64' },
  ACCOUNTANT_LIST_THUMB: { height: 100, responseType: 'base64' },
  CONTACT_PERSON_LIST_THUMB: { height: 100, responseType: 'base64' },

  JSON_SECRET_TOKEN: process.env.JSON_SECRET_TOKEN,
  JSON_TOKEN_EXPIRATION: process.env.JSON_TOKEN_EXPIRATION || 691200,
  JSON_SECRET_REFRESH_TOKEN: process.env.JSON_REFRESH_TOKEN,
  JSON_REFRESH_TOKEN_EXPIRATION: process.env.JSON_REFRESH_TOKEN_EXPIRATION || 86400,
  
  ENCRYPTION_KEY :'7061737323313233', // Encryption Keys
};
