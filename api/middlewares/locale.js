const i18n = require("i18n");
const constants = require("../config/constants");

module.exports = {
  setUserLocale_MW: (req, res, next) => {
    if (req.user && req.user.preferred_lang) {
      i18n.setLocale(constants.SUPPORTED_LANG[parseInt(req.user.preferred_lang)]);
      res.setLocale(constants.SUPPORTED_LANG[parseInt(req.user.preferred_lang)]);
    } else {
      i18n.setLocale(constants.DEFAULT_LANG);
      res.setLocale(constants.DEFAULT_LANG);
    }

    next();
  }
}
