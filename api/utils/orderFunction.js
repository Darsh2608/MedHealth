const models = require("../models");
const Op = models.Sequelize.Op;
const userLogs = models.user_logs;
const smsAndEmailLogs = models.sms_and_email_logs;
const Constants = require("../config/constant");
const Files = models.Files;
const TaskFiles = models.taskFiles;
const TaskCommentFiles = models.TaskCommentFiles;
const Company = models.Companies;
const UserProfile = models.UserProfile;
const Signatures = models.Signatures;
const Cf_installation = models.cf_installation;
const SignatureLogs = models.SignatureLogs;
const CfActivityLogs = models.CfActivityLogs;
const OrderProducts = models.order_products;
const AmlApiLogs = models.AmlApiLogs;
const utils = require("./function");
const { Sequelize } = require('sequelize');

module.exports = {

  getSMSAndEmailData: async (client_id, product, start_date, end_date, order_id, client_name) => {
    try {
      const sentItem = (product === 'sms') ? 'sms' : 'email';
      const loginCount = await smsAndEmailLogs.count({
        where: {
          client_id: client_id,
          sent_item: sentItem,
          created_at: {
            [Op.between]: [start_date, end_date]
          }
        }
      });
      let orderIdObj = { order_id: order_id, is_billed: true };
      await module.exports.updateBulkOrderId('sms_and_email_logs', orderIdObj, { where: { client_id: client_id, sent_item: sentItem, created_at: { [Op.between]: [start_date, end_date] } } });
      utils.log(loginCount + ' --> SMS and Email', 'debug');
      return loginCount;
    } catch (error) {
      utils.log(client_name + ': SMS and Email Error: ' + product + ' ===== ' + error, 'error');
      return 0;
    }
  },

  getActiveAndInActiveAccountantsData: async (client_id, product, start_date, end_date, client_name) => {
    try {
      let loginData = { active: 0, inactive: 0 };

      const userProfileData = await UserProfile.findAll({
        where: {
          client_id: client_id,
          role_id: Constants.ACCOUNTANT_ROLE,
          deleted_at: { [Op.is]: null }
        },
        attributes: ['id']
      });

      let loginDataBetweenDates = await userLogs.getMonthlyLoggedUsers(client_id, start_date, end_date, Constants.ACCOUNTANT_ROLE);

      loginDataBetweenDates = await loginDataBetweenDates.map(m => m.user_profile_id);
      if (loginDataBetweenDates && loginDataBetweenDates.length > 0) {
        for (let user of userProfileData) {
          if (loginDataBetweenDates.includes(user.id)) {
            loginData.active++;
          } else {
            loginData.inactive++;
          }
        }
      }

      if (product == 'active-employees') {
      utils.log(loginData.active + ' --> Active Accountants Data', 'debug');
        return loginData.active;
      } else if (product == 'inactive-employees') {
      utils.log(loginData.inactive + ' --> InActive Accountants Data', 'debug');
        return loginData.inactive;
      } else {
      utils.log(0 + ' --> No Accountants Data', 'debug');
        return 0;
      }
    } catch (error) {
      utils.log(client_name + ': Accountants Data Error: ' + product + ' ===== ' + error, 'error');
      return 0;
    }
  },

  getActiveInactiveContactPersonData: async (client_id, product, start_date, end_date, client_name) => {
    try {
      let loginData = { active: 0, inactive: 0 };

      const userProfileData = await UserProfile.findAll({
        where: {
          client_id: client_id,
          role_id: Constants.CONTACT_PERSON_ROLE,
          deleted_at: { [Op.is]: null }
        },
        attributes: ['id']
      });

      let loginDataBetweenDates = await userLogs.getMonthlyLoggedUsers(client_id, start_date, end_date, Constants.CONTACT_PERSON_ROLE);
      loginDataBetweenDates = await loginDataBetweenDates.map(m => m.user_profile_id);
      if (loginDataBetweenDates && loginDataBetweenDates.length > 0) {
        for (let user of userProfileData) {

          if (loginDataBetweenDates.includes(user.id)) {
            loginData.active++;
          } else {
            loginData.inactive++;
          }
        }
      }

      if (product == 'active-contact-person') {
      utils.log(loginData.active + ' --> Active Contactpersons Data', 'debug');
        return loginData.active;
      } else if (product == 'inactive-contact-person') {
      utils.log(loginData.inactive + ' --> InActive Contactpersons Data', 'debug');
        return loginData.inactive;
      } else {
      utils.log(0 + ' --> No Contactpersons Data', 'debug');
        return 0;
      }
    } catch (error) {
      utils.log(client_name + ': Contactpersons Data Error: ' + product + ' ===== ' + error, 'error');
      return 0;
    }
  },

  getLoginData: async (client_id, product, start_date, end_date, order_id, client_name) => {
    try {
      const actionFor = (product === 'login-ssn') ? 'login-ssn' : 'login-tfa';
      const loginCount = await userLogs.count({
        where: {
          client_id: client_id,
          action: actionFor,
          created_at: {
            [Op.between]: [start_date, end_date]
          }
        }
      });
      let orderIdObj = { order_id: order_id, is_billed: 1 };
      await module.exports.updateBulkOrderId('user_logs', orderIdObj, { where: { client_id: client_id, action: actionFor, created_at: { [Op.between]: [start_date, end_date] } } });
      utils.log(loginCount + ' --> Login Data', 'debug');
      return loginCount;
    } catch (error) {
      utils.log(client_name + ': Login Data Error: ' + product + ' ===== ' + error, 'error');
      return 0;
    }
  },

  getStorageData: async (client_id, start_date, end_date, client_name) => {
    try {
      let totalData = 0;
      let storageData = await Files.findAll({
        where: {
          client_id: client_id,
          is_folder: 0,
          deleted_at: { [Op.is]: null },
          created_at: {
            [Op.between]: [start_date, end_date]
          }
        },
        attributes: [
          [Sequelize.fn("SUM", Sequelize.cast(Sequelize.col("size"), 'integer')), "total_size"]
        ]
      });
      let taskFilesData = await TaskFiles.findAll({
        where: {
          client_id: client_id,
          deleted_at: { [Op.is]: null },
          created_at: {
            [Op.between]: [start_date, end_date]
          }
        },
        attributes: [
          [Sequelize.fn("SUM", Sequelize.cast(Sequelize.col("size"), 'integer')), "total_size"]
        ]
      });

      let taskCommentFilesData = await TaskCommentFiles.findAll({
        where: {
          client_id: client_id,
          deleted_at: { [Op.is]: null },
          created_at: {
            [Op.between]: [start_date, end_date]
          }
        },
        attributes: [
          [Sequelize.fn("SUM", Sequelize.cast(Sequelize.col("size"), 'integer')), "total_size"]
        ]
      });

      let companyFilesData = await Company.findAll({
        where: {
          client_id: client_id,
          deleted_at: { [Op.is]: null },
          created_at: {
            [Op.between]: [start_date, end_date]
          }
        },
        attributes: [
          [Sequelize.fn("SUM", Sequelize.cast(Sequelize.col("size"), 'integer')), "total_size"]
        ]
      });

      let userProfileFilesData = await UserProfile.findAll({
        where: {
          client_id: client_id,
          deleted_at: { [Op.is]: null },
          created_at: {
            [Op.between]: [start_date, end_date]
          }
        },
        attributes: [
          [Sequelize.fn("SUM", Sequelize.cast(Sequelize.col("size"), 'integer')), "total_size"]
        ]
      });

      let signatureFilesData = await Signatures.findAll({
        where: {
          client_id: client_id,
          deleted_at: { [Op.is]: null },
          created_at: {
            [Op.between]: [start_date, end_date]
          }
        },
        attributes: [
          [Sequelize.fn("SUM", Sequelize.cast(Sequelize.col("filesize"), 'integer')), "total_size"]
        ]
      });

      let contractFilesData = await Cf_installation.findAll({
        where: {
          client_id: client_id,
          deleted_at: { [Op.is]: null },
          created_at: {
            [Op.between]: [start_date, end_date]
          }
        },
        attributes: [
          [Sequelize.fn("SUM", Sequelize.cast(Sequelize.col("filesize"), 'integer')), "total_size"]
        ]
      });

      let storageDataCount = (await storageData[0].dataValues.total_size) ? parseInt(storageData[0].dataValues.total_size) : 0;
      let taskFilesDataCount = (await taskFilesData[0].dataValues.total_size) ? parseInt(taskFilesData[0].dataValues.total_size) : 0;
      let taskCommentFilesDataCount = (await taskCommentFilesData[0].dataValues.total_size) ? parseInt(taskCommentFilesData[0].dataValues.total_size) : 0;
      let companyFilesDataCount = (await companyFilesData[0].dataValues.total_size) ? parseInt(companyFilesData[0].dataValues.total_size) : 0;
      let userProfileFilesDataCount = (await userProfileFilesData[0].dataValues.total_size) ? parseInt(userProfileFilesData[0].dataValues.total_size) : 0;
      let signatureFilesDataCount = (await signatureFilesData[0].dataValues.total_size) ? parseInt(signatureFilesData[0].dataValues.total_size) : 0;
      let contractFilesDataCount = (await contractFilesData[0].dataValues.total_size) ? parseInt(contractFilesData[0].dataValues.total_size) : 0;

      totalData = storageDataCount + taskFilesDataCount + taskCommentFilesDataCount +
        companyFilesDataCount + userProfileFilesDataCount + signatureFilesDataCount + contractFilesDataCount;

      const dataInSize = await module.exports.bytesToSize(totalData);
      utils.log(dataInSize + ' --> Storage Data', 'debug');
      return dataInSize;
    } catch (error) {
      utils.log(client_name + ': Storage Data Error: ' + error, 'error');
      return 0;
    }
  },

  getEsignData: async (client_id, start_date, end_date, order_id, client_name) => {
    try {
      let esignMonthlyData = await Signatures.getMonthlyEsign(client_id, start_date, end_date);
      let esignResendData = await SignatureLogs.getResendDoc(client_id, 'RE_SEND', start_date, end_date);
      let contractMonthlyData = await Cf_installation.getMonthlyContract(client_id, start_date, end_date);
      let contractResendDoc = await CfActivityLogs.getResendExpireDoc(client_id, 'RE_SEND', start_date, end_date);
      let esign_sum = 0;
      let contract_sum = 0;
      let reSendesign_sum = 0;
      let contractExpire_sum = 0;
      let orderIdObj = { order_id: order_id };
      await module.exports.updateBulkOrderId('Signatures', orderIdObj, { where: { client_id: client_id, created_at: { [Op.between]: [start_date, end_date] } } });
      await module.exports.updateBulkOrderId('cf_installation', orderIdObj, { where: { client_id: client_id, created_at: { [Op.between]: [start_date, end_date] } } });
      esignResendData = esignResendData.map(m => m.total_members);
      esignMonthlyData = esignMonthlyData.map(m => m.total_members);
      contractMonthlyData = contractMonthlyData.map(m => m.total_members);
      contractResendDoc = contractResendDoc.map(m => m.total_members);

      if (esignMonthlyData.length > 0) {
        esign_sum = esignMonthlyData.reduce((sum, a) => sum + a, 0);
      }
      if (contractMonthlyData.length > 0) {
        contract_sum = contractMonthlyData.reduce((sum, a) => sum + a, 0);
      }
      if (esignResendData.length > 0) {
        reSendesign_sum = esignResendData.reduce((sum, a) => sum + a, 0);
      }
      if (contractResendDoc.length > 0) {
        contractExpire_sum = contractResendDoc.reduce((sum, a) => sum + a, 0);
      }
      const allDocuments = (await parseInt(esign_sum)) + parseInt(contract_sum) + parseInt(reSendesign_sum) + parseInt(contractExpire_sum);
      utils.log(allDocuments + ' --> Esign Data', 'debug');
      return allDocuments;

    } catch (error) {
      utils.log(client_name + ': Esign Data Error: ' + error, 'error');
      return 0;
    }
  },

  getClientFeesData: async (client_id, product, client_name) => {
    try {
      const companyData = await Company.findAll({
        where: {
          client_id: client_id,
          deleted_at: { [Op.is]: null }
        },
        attributes: ['id']
      });
      utils.log(companyData.length + ' --> Client Fees Data', 'debug');
      return companyData.length;
    } catch (error) {
      utils.log(client_name + ': Client Fees Data Error: ' + product + ' ===== ' + error, 'error');
      return 0;
    }
  },

  getSingleData: async (client_id, product, products_id, client_name) => {
    try {
      const orderData = await OrderProducts.findOne({
        where: {
          client_id: client_id,
          products_id: products_id
        },
        attributes: ['id']
      });
      if (orderData) {
        return 0;
      } else {
        return 1;
      }
    } catch (error) {
      utils.log(client_name + ': Single Data Error: ' + product + ' ===== ' + error, 'error');
      return 0;
    }
  },

  getAmlData: async (client_id, product, start_date, end_date, client_name) => {
    try {
      const amlCount = await AmlApiLogs.count({
        where: {
          client_id: client_id,
          created_at: {
            [Op.between]: [start_date, end_date]
          }
        }
      });
      utils.log(amlCount + ' --> AML Data', 'debug');
      return amlCount;
    } catch (error) {
      utils.log(client_name + ': AML Data Error: ' + product + ' ===== ' + error, 'error');
      return 0;
    }
  },

  getProffData: async (client_id, product, start_date, end_date, order_id, client_name) => {
    try {
      const actionFor = 'refresh';
      const loginCount = await userLogs.count({
        where: {
          client_id: client_id,
          action: actionFor,
          created_at: {
            [Op.between]: [start_date, end_date]
          }
        }
      });
      let orderIdObj = { order_id: order_id, is_billed: 1 };
      await module.exports.updateBulkOrderId('user_logs', orderIdObj, { where: { client_id: client_id, action: actionFor, created_at: { [Op.between]: [start_date, end_date] } } });
      utils.log(loginCount + ' --> Owners Data', 'debug');
      return loginCount;
    } catch (error) {
      utils.log(client_name + ': Owners Data Error: ' + product + ' ===== ' + error, 'error');
      return 0;
    }
  },

  bytesToSize: async (bytes) => {
    // var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    // if (bytes == 0) return '0 Byte';
    // var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));

    let gbValue = (bytes / Math.pow(10, 9));
    return Math.ceil(gbValue);
    // return Math.round(bytes / Math.pow(1024, i), 2);
    // return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
  },

  updateBulkOrderId: async (modelType, updateData, condition) => {
    return new Promise(async (resolve, reject) => {
      try {
        const data = await models[modelType].update(updateData, condition);
        resolve(data);
      } catch (err) {
        reject(err);
      }
    });
  },
};
