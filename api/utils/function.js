const constants = require("../config/constant");
const models = require("../models");
const sendgrid_mail = require('@sendgrid/mail');
const jwt = require("jsonwebtoken");
const multer = require("multer");
const multerS3 = require("multer-s3");
const fs = require("fs");
const UserProfile = models.UserProfile;
const NotificationReceivers = models.notification_receivers;
const Client = models.Clients;
const ClientPermissions = models.client_permissions;
const Category = models.Categories;
const Status = models.Statuses;
const Department = models.Departments;
const qa_masters = models.qa_masters;
const Folder = models.Folder;
const cf_masters = models.cf_masters;
const Tasks = models.Tasks;
const TaskDetails = models.TaskDetails;
const TaskComments = models.TaskComments;
const TaskCommentFiles = models.TaskCommentFiles;
const TaskChecklists = models.task_checklists;
const TaskChecklistsStatus = models.task_checklists_status;
const TaskActivityLogs = models.task_logs;
const TaskFiles = models.taskFiles;
const { v4: uuidv4 } = require('uuid');
const pdf2base64 = require('pdf-to-base64');
const DeptAccountants = models.DeptAccountants;
const Company = models.Companies;
const idfyUtils = require("./idfySignatures");
const esignUtils = require("../utils/esignSignatures");
const rimraf = require('rimraf');
const { mkdirsSync } = require('fs-extra');
const filepreview = require('./filepreview');
const constant = require("../config/constant");
const axios = require('axios');
const path = require('path');
const clientIo = require("socket.io-client");
const i18n = require("i18n");
const { Op, where} = require("sequelize");

const { S3, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const wkhtmltopdf = require('wkhtmltopdf');
const ID = constant.S3_BUCKET_ID;
const SECRET = constant.S3_BUCKET_SECRET;
const REGION = 'eu-west-1';

// The name of the bucket that you have created
const BUCKET_NAME = constant.S3_BUCKET_NAME;
// const ALLOW_TO_S3_STORAGE = utils.allowToS3() ? true : false;
const { debugLogger, errorLogger } = require('../config/winston');
const moment = require("moment/moment");
const defaultPath = constant.DEFAULT_FILES_PATH;
const COLOR_CODES = constant.COLOR_CODES;

module.exports = {
  getCreatedByUpdatedBy: (req) => {

    let created_by, updated_by = req.accesstokendata.token_id;
    let created_by_type, updated_by_type = constants.CREATED_UPDATED_BY_TOKEN;
    if (req.logintokendata !== undefined && Object.keys(req.logintokendata).length > 0) {
      created_by, updated_by = req.logintokendata.id;
      created_by_type, updated_by_type = constants.CREATED_UPDATED_BY_ADMINUSER;
    }
    return {
      created_by: created_by,
      created_by_type: created_by_type,
      updated_by: updated_by,
      updated_by_type: updated_by_type
    };
  },

  bulkCreate: async (model, post_data) => {
    return new Promise(async (resolve, reject) => {

      try {
        const transaction = await models.sequelize.transaction();
        const model_data = await model.bulkCreate(post_data, { transaction });
        await transaction.commit();
        resolve(model_data);
      } catch (err) {
        console.log(err);
        reject(false);
      }
    })
  },

  createData: async (model, post_data) => {
    return new Promise(async (resolve, reject) => {

      try {
        const transaction = await models.sequelize.transaction();
        const model_data = await model.create(post_data, { transaction });
        await transaction.commit();
        resolve(model_data);
      } catch (err) {
        console.log(err);
        reject(false);
      }
    });
  },

  updateData: async (model, post_data, where) => {
    return new Promise(async (resolve, reject) => {
      try {
        const transaction = await models.sequelize.transaction();
        await model.update(post_data, where, { transaction });
        await transaction.commit();
        resolve(true);
      } catch (err) {
        console.log(err);
        reject(false);
      }
    });
  },

  createFileData: async (model, post_data) => {
    return new Promise(async (resolve, reject) => {

      try {
        const transaction = await models.sequelize.transaction();
        const model_data = await model.create(post_data, { transaction });
        await transaction.commit();
        resolve(model_data);
      } catch (err) {
        console.log(err);
        reject(false);
      }
    })
  },

  updateFileData: async (model, post_data, where) => {
    return new Promise(async (resolve, reject) => {
      try {
        const transaction = await models.sequelize.transaction();
        await model.update(post_data, where, { transaction });
        await transaction.commit();
        resolve(true);
      } catch (err) {
        console.log(err);
        reject(false);
      }
    });
  },

  sendEmail: async (data) => {
    let email_status = 0;

    if (constants.ALLOW_EMAIL_SEND) {

      let email_id = data.email_id;
      let email_sender_name = data.email_sender_name;
      let email_sender_email = data.email_sender_email;
      let email_subject = data.email_subject;
      let email_content = data.email_content;

      //Send email with api key
      sendgrid_mail.setApiKey(process.env.SENDGRID_API_KEY);
      const msg = {
        to: email_id,
        from: {
          "email": email_sender_email,
          "name": email_sender_name
        },
        subject: email_subject,
        text: email_content,
        html: email_content,
      };
      try {
        await sendgrid_mail.send(msg);
        email_status = 1;
      } catch (err) {
        email_status = 0;
        console.log(err.response.body.errors);
      }
    } else {
      email_status = 1;
    }
    return email_status;

  },

  saveImage: async (req, res, fld_name, path, img_callback) => {
    // create directories if not exist
    if (!fs.existsSync(path)) {
      let dirName = "";
      let filePathSplit = path.split("/");
      for (let index = 0; index < filePathSplit.length; index++) {
        dirName += filePathSplit[index] + "/";
        if (!fs.existsSync(dirName)) fs.mkdirSync(dirName);
      }
    }

    let storage = multer.diskStorage({
      //multers disk storage settings
      destination: function (req, file, cb) {
        cb(null, path);
      },
      filename: function (req, file, cb) {
        let datetimestamp = Date.now();
        cb(null, datetimestamp + "-" + file.originalname);
      }
    });

    let uploadnew = multer({
      //multer settings
      storage: storage,
      fileFilter: function (req, file, callback) {
        let ext = file.originalname.split(".")[
          file.originalname.split(".").length - 1
        ]; //path.extname(file.originalname)
        if (ext !== "png" && ext !== "jpg" && ext !== "gif" && ext !== "jpeg") {
          img_callback({ success: false, logo: "Only images are allowed" });
          return;
        }
        callback(null, true);
      }
    }).single(fld_name);

    uploadnew(req, res, function (err) {
      if (err) {
        return img_callback({ success: false, logo: err });
        // cb(err, null);
      }
      console.log(req.file.filename, 'file data:', req.file);
      if (!req.file) return img_callback({ success: true, logo: "" });
      return img_callback({ success: true, logo: req.file.filename });
    });
  },

  uploadFile: (req, res, file_name, file_path, fileName = '') => {

    if (!fs.existsSync(file_path)) {
      fs.mkdirSync(file_path);
    }

    let promise = new Promise((resolve, reject) => {
      let storage;
      if (module.exports.allowToS3() && file_name !== 'service-logo') {
        const s3Config = module.exports.awsS3Config();

        storage = multerS3({
          s3: s3Config,
          bucket: BUCKET_NAME,
          metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
          },
          key: function (req, file, cb) {
            let ext = file.originalname.split('.').pop();
            if (!(ext.toLowerCase() == 'png' || ext.toLowerCase() == 'jpg' || ext.toLowerCase() == 'jpeg' || ext.toLowerCase() == 'gif')) {
              console.log('Invalid extention of ' + file.originalname + ' -------------' + ext);
              reject({ message: 'msg_invalid_file', filename: null });
            } else {
              if (fileName) {
                let newFilePath = (file_path.replace('./', '')) + '/' + fileName;
                newFilePath = newFilePath.replace('//', '/');
                cb(null, newFilePath);
              } else {
                fileName = file.fieldname + '-' + Date.now() + "." + ext;
                let newFilePath = (file_path.replace('./', '')) + '/' + fileName;
                newFilePath = newFilePath.replace('//', '/');
                cb(null, newFilePath);
              }
            }
          }
        });
      } else {
        storage = multer.diskStorage({
          destination: function (req, file, cb) {
            cb(null, file_path);
          },
          filename: function (req, file, cb) {
            let ext = file.originalname.split('.').pop();
            if (!(ext.toLowerCase() == 'png' || ext.toLowerCase() == 'jpg' || ext.toLowerCase() == 'jpeg' || ext.toLowerCase() == 'gif')) {
              console.log('Invalid extention of ' + file.originalname + ' -------------' + ext);
              reject({ message: 'msg_invalid_file', filename: null });
            } else {
              if (fileName) {
                cb(null, fileName);
              } else {
                cb(null, file.fieldname + '-' + Date.now() + "." + ext);
              }
            }
            // let ext = file.originalname.split('.').pop();
            // if (ext.toLowerCase() == 'png' || ext.toLowerCase() == 'jpg' || ext.toLowerCase() == 'jpeg' || ext.toLowerCase() == 'gif') {
            //   cb(null, file.fieldname + '-' + Date.now() + "." + ext);
            // } else {
            //   console.log('Invalid extention of ' + file.originalname + ' -------------' + ext);
            //   reject({ message: 'msg_invalid_file', filename: null });
            // }
          }
        });
      }

      let upload = multer({ storage: storage }).single(file_name);

      upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {

          console.log('Upload error: Instance of multererror-------------' + file_name);
          // A Multer error occurred when uploading.
          reject({ message: 'msg_invalid_file', filename: null });
        } else if (err) {

          console.log('Upload error: -------------' + file_name, err);
          // An unknown error occurred when uploading.
          reject({ message: 'msg_invalid_file', filename: null });
        }
        if (req.file == undefined) {

          console.log('Upload error: file undefined-------------' + file_name);
          //resolve(req);
          reject({ message: 'msg_invalid_file', filename: null });
        }

        if (req.file)
          req.file.filename = req.file.filename ? req.file.filename : fileName;

        resolve(req.file);
      });
    });

    return promise.then(
      result => result, // shows result
      error => error // show error
    );
  },

  uploadMultipleFiles: function (req, res, file_name, file_path, s3Upload = false) {
    let newFileName;
    // create directories if not exist
    let promise = new Promise((resolve, reject) => {
      let storage;
      if (module.exports.allowToS3() && s3Upload) {
        const s3Config = module.exports.awsS3Config();
        storage = multerS3({
          s3: s3Config,
          bucket: BUCKET_NAME,
          metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
          },
          key: function (req, file, cb) {
            let ext = file.originalname.split('.').pop();
            let unique_id = uuidv4();

            file_path = file_path.replace("./", '');
            let fileName = file_path + '/' + unique_id + "." + ext;
            newFileName = unique_id + "." + ext;

            fileName = fileName.replace('//', '/');
            cb(null, fileName);
          }
        });
      } else {
        storage = multer.diskStorage({
          destination: function (req, file, cb) {
            cb(null, file_path);
          },
          filename: function (req, file, cb) {
            let ext = file.originalname.split('.').pop();
            let unique_id = uuidv4();
            newFileName = unique_id + "." + ext;
            cb(null, newFileName);
          }
        });
      }

      let upload = multer({ storage: storage }).array(file_name, 20);
      upload(req, res, function (err) {

        if (err instanceof multer.MulterError) {

          console.log('Upload error: Instance of multererror-------------' + file_name);
          // A Multer error occurred when uploading.
          reject({ message: 'msg_invalid_file', filename: null });
        } else if (err) {

          console.log('Upload error: -------------' + file_name, err);
          // An unknown error occurred when uploading.
          reject({ message: 'msg_invalid_file', filename: null });
        }

        for (let i = 0, n = req.files.length; i < n; i++) {
          if (req.files[i].key) {
            let name_of_newfile = req.files[i].key.split('/');
            req.files[i].filename = name_of_newfile[name_of_newfile.length - 1];
            // req.files[i].filename = newFileName;
          }
        }

        resolve(req.files);
      });
    });
    return promise.then(
      result => result, // shows result
      error => error // show error
    );

  },

  isValidEmail: (value) => {
    if (value !== undefined && value.trim() != "" && value.length > 100) {
      let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return re.test(String(value).toLowerCase());
    }
    return true;
  },

  createLog: async (model, data) => {
    return new Promise(async (resolve, reject) => {

      try {
        const transaction = await models.sequelize.transaction();
        const model_data = await model.create(data, { transaction });
        await transaction.commit();
        resolve(model_data);
      } catch (err) {
        console.log(err);
        reject(false);
      }
    });
  },

  createDefaultStatuses: async (model, client_id) => {
    let data = [];

    await constants.DEFAULT_STATUSES.forEach(ele => {
      data.push({
        status: ele.status, client_id: client_id, color_code: ele.color_code,
        sort_order: ele.sort_order, is_default: ele.is_default, state: ele.state
      });
    });

    return new Promise(async (resolve, reject) => {
      try {
        const model_data = await model.bulkCreate(data);
        resolve(model_data);
      } catch (err) {
        console.log(err);
        reject(false);
      }
    });
  },

  createDefaultCategory: async (model, client_id) => {
    let data = [];

    await constants.DEFAULT_CATEGORY.forEach(ele => {
      data.push({
        name: ele.name, client_id: client_id, is_dashboard_display: ele.is_dashboard_display,
        category_description: ele.category_description, sort_order: ele.sort_order,
        background_color: ele.background_color, is_default: ele.is_default,
      });
    });

    return new Promise(async (resolve, reject) => {
      try {
        const model_data = await model.bulkCreate(data);
        resolve(model_data);
      } catch (err) {
        console.log(err);
        reject(false);
      }
    });
  },


  createDefaultDepartment: async (model, client_id) => {
    let data = [];

    await constants.DEFAULT_DEPARTMENT.forEach(ele => {
      data.push({ name: ele.name, client_id: client_id, is_default: ele.is_default, parent_id: ele.parent_id });
    });
    return new Promise(async (resolve, reject) => {
      try {
        const model_data = await model.bulkCreate(data);
        resolve(model_data);
      } catch (err) {
        console.log(err);
        reject(false);
      }
    });
  },

  createLoggedUserData: async (user) => {
    const tokenList = {};
    let userobj = {
      id: user.id,
      email: user.email,
      isAdmin: false,
      isClientAdmin: false,
      name: "",
      roles: [],
      clients: [],
      companies: [],
      UserProfile: [],
      userType: user.type,
      has_multiple_access: false,
      is_dev: user.is_dev,
      two_factor_enabled: user.two_factor_enabled,
      display_file_edit_password: user.display_file_edit_password

    };

    const currentDate = new Date();
    const oneDayTime = 60 * 60 * 24 * 1000;

    let timeout;
    if (currentDate.getDay() == 0 && currentDate.getHours() > 4) {
      // set expiry to next of next monday
      // As it is after Sunday 4:00AM
      timeout = new Date().getTime() + (oneDayTime * 8);
    } else {
      // set expiry to next monday
      timeout = (new Date()).getTime() + ((8 - (new Date()).getDay()) * oneDayTime);
    }

    let hours = (currentDate.getHours() * 60 * 60 * 1000);
    let minutes = (currentDate.getMinutes() * 60 * 1000);
    let seconds = (currentDate.getSeconds() * 1000);
    let timeFromNextMonday = hours - minutes - seconds - (currentDate.getMilliseconds());

    let fourAM = (4 * 60 * 60 * 1000);

    timeout = new Date((timeout - timeFromNextMonday) + fourAM);

    let expiration = Math.ceil((timeout.getTime() - currentDate.getTime()) / 1000);

    const token = jwt.sign({ id: user.id }, constants.JSON_SECRET_TOKEN, {
      expiresIn: (expiration + 's'),
    });

    const refreshToken = jwt.sign(
      { id: user.id },
      constants.JSON_SECRET_REFRESH_TOKEN,
      { expiresIn: (expiration + 's') }
    );
    userobj.accessToken = token;
    userobj.refreshToken = refreshToken;

    tokenList[refreshToken] = {
      token: token,
      refreshToken: refreshToken,
    };

    // console.log(user.type);
    let role = '';
    let client_id = null;
    // let user_profile_id = null;

    switch (user.type) {
      case 0:
        userobj.isAdmin = true;
        userobj.roles.push({ id: 1, name: "superadmin" });
        userobj.name = "Super Admin";
        role = 'superadmin';
        break;
      case 1:
        // console.log('in type 1');
        userobj.isClientAdmin = true;
        userobj.roles.push({ id: 2, name: "clientadmin" });
        await Client.findAll({
          where: {
            user_id: user.id,
          },
        })
          .then((userClients) => {
            userobj.name = userClients[0].name;
            userobj.photo = userClients[0].photo ? userClients[0].photo : '';
            for (let i = 0; i < userClients.length; i++) {
              userobj.clients.push({
                id: userClients[i].id,
                name: userClients[i].name,
                photo: userClients[i].photo,
              });
            }
          })
          .catch((err) => console.log(err));
        role = 'clientadmin';
        client_id = userobj.clients[0].id;
        break;
      case 2:
        await UserProfile.findAll({
          include: [
            {
              model: models.CompanyAccountants,
              attributes: ["id", "company_id"],
            }
          ],
          where: {
            user_id: {
              [Op.eq]: user.id,
            },
            archive_flag: 0
          }
        })
          .then(async (userprofiles) => {
            if (userprofiles.length > 1) {
              userobj.has_multiple_access = true;
            } else if (userprofiles.length == 1) {
              let client_data = await Client.findOne({ where: { id: userprofiles[0].client_id } });
              let client_permissions = await ClientPermissions.findOne({ where: { client_id: userprofiles[0].client_id } });
              client_permissions = client_permissions ? await client_permissions.module_json.filter(f => f.flag == true).map(m => m.state) : [];

              if (userprofiles[0].role_id == 3 || (userprofiles[0].role_id == 4 && userprofiles[0].has_view_access)) {
                userobj.UserProfile.push({
                  user_id: user.id,
                  user_profile_id: userprofiles[0].id,
                  user_role_id: userprofiles[0].role_id,
                  has_view_access: userprofiles[0].has_view_access,
                  name: userprofiles[0].name,
                  mobile: userprofiles[0].mobile,
                  email: userprofiles[0].email,
                  client_id: (userprofiles[0].client_id) ? userprofiles[0].client_id : 0,
                  company_id: (userprofiles[0].company_id) ? userprofiles[0].company_id : 0,
                  photo: userprofiles[0].photo,
                  has_multiple_access: false,
                  is_admin: userprofiles[0].is_admin,
                  allowed_add_company: userprofiles[0].allowed_add_company,
                  companies: userprofiles[0].CompanyAccountants,
                  allowed_review_rule: userprofiles[0].allowed_review_rule,
                  two_factor_enabled: user.two_factor_enabled,
                  display_file_edit_password: user.display_file_edit_password,
                  initials: userprofiles[0].initials,
                  bgcolor: userprofiles[0].bgcolor,
                  fontcolor: userprofiles[0].fontcolor,
                  has_permission_for_timesheet_review: (userprofiles[0].has_permission_for_timesheet_review) || false,
                  skip_approval: userprofiles[0].skip_approval,
                  is_regnskap_norge_member: client_data?.is_regnskap_norge_member,
                  client_permissions: client_permissions
                });
              }
            }
          })
          .catch((err) => console.log(err));
        break;
    }

    return userobj;
  },

  createImpersonateLoggedUserData: async (user, client_id) => {
    const tokenList = {};
    let userobj = {
      id: user.id,
      email: user.email,
      isAdmin: false,
      isClientAdmin: false,
      name: "",
      roles: [],
      clients: [],
      companies: [],
      UserProfile: [],
      userType: user.type,
      has_multiple_access: false,
      is_dev: user.is_dev,
      two_factor_enabled: 0,
      display_file_edit_password: true
    };

    const currentDate = new Date();
    const oneDayTime = 60 * 60 * 24 * 1000;

    let timeout;
    if (currentDate.getDay() == 0 && currentDate.getHours() > 4) {
      // set expiry to next of next monday
      // As it is after Sunday 4:00AM
      timeout = new Date().getTime() + (oneDayTime * 8);
    } else {
      // set expiry to next monday
      timeout = (new Date()).getTime() + ((8 - (new Date()).getDay()) * oneDayTime);
    }

    let hours = (currentDate.getHours() * 60 * 60 * 1000);
    let minutes = (currentDate.getMinutes() * 60 * 1000);
    let seconds = (currentDate.getSeconds() * 1000);
    let timeFromNextMonday = hours - minutes - seconds - (currentDate.getMilliseconds());

    let fourAM = (4 * 60 * 60 * 1000);

    timeout = new Date((timeout - timeFromNextMonday) + fourAM);

    let expiration = Math.ceil((timeout.getTime() - currentDate.getTime()) / 1000);

    const token = jwt.sign({ id: user.id }, constants.JSON_SECRET_TOKEN, {
      expiresIn: (expiration + 's'),
    });

    const refreshToken = jwt.sign(
      { id: user.id },
      constants.JSON_SECRET_REFRESH_TOKEN,
      { expiresIn: (expiration + 's') }
    );
    userobj.accessToken = token;
    userobj.refreshToken = refreshToken;

    tokenList[refreshToken] = {
      token: token,
      refreshToken: refreshToken,
    };

    // console.log(user.type);
    let role = '';
    // let client_id = null;
    // let user_profile_id = null;
    switch (user.type) {
      case 0:
        // userobj.isAdmin = true;
        // userobj.roles.push({ id: 1, name: "superadmin" });
        // userobj.name = "Super Admin"
        role = 'superadmin';
        await UserProfile.findAll({
          include: [
            {
              model: models.CompanyAccountants,
              attributes: ["id", "company_id"],
            }
          ],
          where: {
            user_id: {
              [Op.eq]: user.id,
            },
            client_id: {
              [Op.eq]: client_id,
            }
          }
        })
          .then(async (userprofiles) => {

            for (let i = 0; i < userprofiles.length; i++) {
              if (userprofiles[i].role_id == 3) {
                let client_data = await Client.findOne({ where: { id: userprofiles[i].client_id } })
                let client_permissions = await ClientPermissions.findOne({ where: { client_id: userprofiles[i].client_id } });
                client_permissions = await client_permissions ? client_permissions.module_json.filter(f => f.flag == true).map(m => m.state) : [];

                userobj.UserProfile.push({
                  user_id: user.id,
                  user_profile_id: userprofiles[i].id,
                  user_role_id: userprofiles[i].role_id,
                  name: userprofiles[i].name,
                  mobile: userprofiles[i].mobile,
                  email: userprofiles[i].email,
                  client_id: (userprofiles[i].client_id) ? userprofiles[i].client_id : 0,
                  company_id: (userprofiles[i].company_id) ? userprofiles[i].company_id : 0,
                  photo: userprofiles[i].photo,
                  initials: userprofiles[i].initials,
                  bgcolor: userprofiles[i].bgcolor,
                  fontcolor: userprofiles[i].fontcolor,
                  is_admin: userprofiles[i].is_admin,
                  allowed_add_company: userprofiles[i].allowed_add_company,
                  companies: userprofiles[i].CompanyAccountants,
                  allowed_review_rule: userprofiles[0].allowed_review_rule,
                  two_factor_enabled: user.two_factor_enabled,
                  display_file_edit_password: user.display_file_edit_password,
                  has_permission_for_timesheet_review: userprofiles[i].has_permission_for_timesheet_review,
                  skip_approval: userprofiles[i].skip_approval,
                  is_regnskap_norge_member: client_data?.is_regnskap_norge_member,
                  client_permissions: client_permissions
                });

                if (userprofiles.length > 1) {
                  userobj.has_multiple_access = true;
                }
              }
            }
          })
          .catch((err) => console.log(err));
        break;
      case 1:
        // console.log('in type 1');
        userobj.isClientAdmin = true;
        userobj.roles.push({ id: 2, name: "clientadmin" });
        await Client.findAll({
          where: {
            user_id: user.id,
          },
        })
          .then((userClients) => {
            userobj.name = userClients[0].name;
            userobj.photo = userClients[0].photo ? userClients[0].photo : '';
            for (let i = 0; i < userClients.length; i++) {
              userobj.clients.push({
                id: userClients[i].id,
                name: userClients[i].name,
                photo: userClients[i].photo
              });
            }
          })
          .catch((err) => console.log(err));
        role = 'clientadmin';
        client_id = userobj.clients[0].id;
        break;
      case 2:
        await UserProfile.findAll({
          include: [
            {
              model: models.CompanyAccountants,
              attributes: ["id", "company_id"],
            }
          ],
          where: {
            user_id: {
              [Op.eq]: user.id,
            },
            client_id: {
              [Op.eq]: client_id,
            }
          }
        })
          .then(async (userprofiles) => {

            for (let i = 0; i < userprofiles.length; i++) {
              if (userprofiles[i].role_id == 3 && userprofiles[i].deleted_at == null) {
                let client_data = await Client.findOne({ where: { id: userprofiles[i].client_id } })
                let client_permissions = await ClientPermissions.findOne({ where: { client_id: userprofiles[i].client_id } });
                client_permissions = await client_permissions ? client_permissions.module_json.filter(f => f.flag == true).map(m => m.state) : [];

                userobj.UserProfile.push({
                  user_id: user.id,
                  user_profile_id: userprofiles[i].id,
                  user_role_id: userprofiles[i].role_id,
                  name: userprofiles[i].name,
                  mobile: userprofiles[i].mobile,
                  email: userprofiles[i].email,
                  client_id: (userprofiles[i].client_id) ? userprofiles[i].client_id : 0,
                  company_id: (userprofiles[i].company_id) ? userprofiles[i].company_id : 0,
                  photo: userprofiles[i].photo,
                  initials: userprofiles[i].initials,
                  bgcolor: userprofiles[i].bgcolor,
                  fontcolor: userprofiles[i].fontcolor,
                  is_admin: userprofiles[i].is_admin,
                  allowed_add_company: userprofiles[i].allowed_add_company,
                  companies: userprofiles[i].CompanyAccountants,
                  allowed_review_rule: userprofiles[0].allowed_review_rule,
                  two_factor_enabled: user.two_factor_enabled,
                  display_file_edit_password: user.display_file_edit_password,
                  has_permission_for_timesheet_review: userprofiles[i].has_permission_for_timesheet_review,
                  skip_approval: userprofiles[i].skip_approval,
                  is_regnskap_norge_member: client_data?.is_regnskap_norge_member,
                  client_permissions: client_permissions
                });

                if (userprofiles.length > 1) {
                  userobj.has_multiple_access = true;
                }
              }
            }
          })
          .catch((err) => console.log(err));
        break;
    }

    return userobj;
  },

  createDataTree: (dataset) => {
    let hashTable = Object.create(null)
    dataset.forEach(aData => hashTable[aData.id] = { ...aData, child: [], root: [] })
    let dataTree = []
    dataset.forEach(aData => {
      if (aData.parent_id) {
        let root = hashTable[aData.parent_id]?.root;
        if (root) {
          hashTable[aData.id].root = [...root, aData.parent_id];
          hashTable[aData.parent_id].child.push(hashTable[aData.id]);
        }
      }
      else dataTree.push(hashTable[aData.id])
    })
    return dataTree
  },

  createUniqueString: (length = 20) => {

    let newDate = new Date();
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;

    result = new Array(length).join().split(',').map(function () { return characters.charAt(Math.floor(Math.random() * charactersLength)); }).join('');

    // for (let i = 0; i < length; i++) {
    //   result += characters.charAt(Math.floor(Math.random() * charactersLength));
    // }

    // let dateString = newDate.getDate()
    //   + '' + (newDate.getMonth() + 1)
    //   + '' + newDate.getFullYear()
    //   + '' + newDate.getHours()
    //   + '' + newDate.getMinutes()
    //   + '' + newDate.getSeconds();

    // let dateString = newDate.getTime();

    // result += dateString;

    return result;
  },

  createDefaultTemplate: async (client_id) => {
    let post_data = {
      client_id: client_id,
      json_data: [],
      created_at: new Date(),
      updated_at: new Date(),
    };

    let rawdata = await fs.readFileSync('utils/contract-form-field.json');
    let form_data = await JSON.parse(rawdata);

    post_data.json_data = await form_data;

    //let startdata = await fs.readFileSync('utils/contract-form-field-start.json');
    //let form_data_start = await JSON.parse(startdata);

    const master_data = await module.exports.createData(models.cf_masters, post_data);

    await Category.findAll({
      where: {
        client_id: client_id,
        is_default: 1
      },
    }).then(async (categories_data) => {
      let add_cat1 = {
        "name": "Firma informasjon",
        "description": "",
        "sort_order": "1",
      }
      let add_cat2 = {
        "name": "Om oppdraget",
        "description": "",
        "sort_order": "2",
      }

      await categories_data.unshift(add_cat2);
      await categories_data.unshift(add_cat1);
      for (let [index, cat] of categories_data.entries()) {

        let step_data = {
          cf_master_id: master_data.id,
          category_id: cat.id ? cat.id : null,
          name: cat.name,
          description: cat.description,
          sort_order: cat.sort_order
        }
        // make a steps for contact form
        await module.exports.createData(models.cf_steps, step_data).then(async (steps_data) => {

          for (let frm of master_data.json_data) {

            if (frm.step == index) {
              frm.step_id = steps_data.id;
              frm.name = steps_data.name;
              frm.cf_master_id = master_data.id;
              frm.category_id = cat.id ? cat.id : null;
              frm.sort_order = steps_data.sort_order;
              frm.is_default = 1;
              frm.is_deleted = 0;
              frm.description = steps_data.description;
              frm.background_color = cat.background_color;
              for (let blk of frm.block_data) {

                let sub_cat_data = '';
                if (cat.id != undefined) {
                  let sub_category_data = {
                    client_id: master_data.client_id,
                    cf_master_id: master_data.id,
                    name: blk.title,
                    category_description: blk.description,
                    is_dashboard_display: 1,
                    is_default: 1,
                    background_color: jdata.background_color,
                    sort_oder: 12,
                    parent_id: cat.id
                  }
                  // make a steps for contact form
                  sub_cat_data = await module.exports.createData(models.Categories, sub_category_data);
                }

                let block_data = {
                  client_id: client_id,
                  cf_master_id: master_data.id,
                  cf_step_id: steps_data.id,
                  title: blk.title,
                  description: blk.description,
                  sort_order: blk.sort_order,
                  category_id: sub_cat_data ? sub_cat_data.id : null
                }

                // make a blocks for contact form
                await module.exports.createData(models.cf_blocks, block_data).then(async (blk_data) => {
                  blk.block_id = blk_data.id
                  blk.cf_step_id = steps_data.id;
                  blk.cf_master_id = master_data.id;
                  blk.category_id = blk_data.category_id ? blk_data.category_id : null;
                  blk.is_deleted = 0;
                  blk.description = blk_data.description;
                  let temp_attribute_id = 0;
                  for (let attr of blk.attributes) {
                    let attribute_data = {
                      client_id: client_id,
                      cf_master_id: master_data.id,
                      cf_step_id: blk_data.cf_step_id,
                      cf_block_id: blk_data.id,
                      label: attr.label,
                      description: attr.description,
                      type: attr.type,
                      is_mandetory: attr.is_mandetory,
                      attribute_options: attr.attribute_options,
                      default_value: attr.default_value,
                      is_conditional: attr.is_conditional,
                      show_on_field: attr.show_on_field,
                      show_on_value: attr.show_on_value,
                      sort_order: attr.sort_order
                    }
                    if (attr.is_conditional == 1) {
                      attribute_data.show_on_field = temp_attribute_id;
                    }

                    // make a Attrubutes for contact form
                    let attr_data = await module.exports.createData(models.cf_attributes, attribute_data);
                    attr.attribute_id = attr_data.id;
                    attr.client_id = client_id;
                    attr.cf_master_id = master_data.id;
                    attr.cf_step_id = attr_data.cf_step_id;
                    attr.cf_block_id = attr_data.cf_block_id;
                    attr.show_on_field = attr_data.show_on_field;
                    attr.is_deleted = 0;
                    if (attr_data.type == 'boolean' && attr_data.is_conditional == 0) {
                      temp_attribute_id = attr_data.id;
                      attr.options = attr_data.attribute_options.split("|");
                    }
                    if (attr_data.type == 'selectbox') {
                      temp_attribute_id = attr_data.id;
                      attr.options = attr_data.attribute_options.split("|");
                    }
                  }
                })
              }
            }
          }
        });
      }
      let updated_data = {
        json_data: master_data.json_data
      };

      let where_data = {
        where: {
          id: master_data.id,
        },
      };

      const Updated_data = await module.exports.updateData(
        models.cf_masters,
        updated_data,
        where_data
      );
    });
  },

  createNewTemplate: async (client_id, json_data, attachments) => {
    try {
      let post_data = {
        client_id: client_id,
        json_data: json_data,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const master_data = await module.exports.createData(models.cf_masters, post_data);

      // steps loop
      for (let jdata of json_data) {
        if (jdata.step_id == '') {

          let cat_data;
          if (jdata.category_id !== null) {
            let mcat_data = {
              name: jdata.name,
              category_description: jdata.description ? jdata.description : '',
              background_color: jdata.background_color,
              sort_order: parseInt(jdata.sort_order),
              updated_at: new Date()
            }

            let where_data_mcat = {
              where: {
                id: jdata.category_id,
              },
            };
            cat_data = await module.exports.updateData(
              models.Categories,
              mcat_data,
              where_data_mcat
            );
          } else {
            // Create new category
            let category_data = {
              client_id: client_id,
              // cf_master_id: master_data.id,
              name: jdata.name,
              category_description: jdata.description,
              is_dashboard_display: 1,
              is_default: 1,
              background_color: jdata.background_color,
              sort_oder: jdata.sort_oder
            }

            cat_data = await module.exports.createData(models.Categories, category_data);
          }

          // create new step
          let step_data = {
            cf_master_id: master_data.id,
            category_id: cat_data.id ? cat_data.id : jdata.category_id,
            name: jdata.name,
            description: jdata.category_description,
            sort_order: jdata.sort_order
          }

          await module.exports.createData(models.cf_steps, step_data).then(async (steps_data) => {

            jdata.step_id = steps_data.id;
            jdata.category_id = steps_data.category_id;
            jdata.cf_master_id = master_data.id;
            jdata.client_id = client_id;
            // jdata.is_default = 1;
            // jdata.is_deleted = 0;
            jdata.description = steps_data.description;
            jdata.background_color = jdata.background_color;
          })
        } else {
          // existing step
          if (jdata.category_id !== null) {
            let mcat_data = {
              name: jdata.name,
              category_description: jdata.description ? jdata.description : '',
              background_color: jdata.background_color,
              sort_order: parseInt(jdata.sort_order),
              updated_at: new Date()
            }

            let where_data_mcat = {
              where: {
                id: jdata.category_id,
              },
            };
            saveCat = await module.exports.updateData(
              models.Categories,
              mcat_data,
              where_data_mcat
            );
          }

          let step_data = {
            cf_master_id: master_data.id,
            category_id: jdata.category_id ? jdata.category_id : null,
            name: jdata.name,
            description: jdata.description,
            sort_order: jdata.sort_order
          }
          await module.exports.createData(models.cf_steps, step_data).then(async (steps_data) => {

            jdata.step_id = steps_data.id;
            jdata.category_id = steps_data.category_id;
            jdata.cf_master_id = master_data.id;
            // jdata.client_id = client_id;
            // jdata.is_default = 1;
            // jdata.is_deleted = 0;
            jdata.description = steps_data.description;
            jdata.background_color = jdata.background_color;
          });
        }

        let block_length = jdata.block_data.length;
        if (block_length > 0) {

          // Block loop
          for (let frm of jdata.block_data) {

            // If block not available
            if (frm.block_id == "") {
              // let category_data = await Category.findOne({
              //   where: {
              //     client_id: client_id,
              //     id: jdata.category_id
              //   },
              // })
              let sub_cat_data;
              if (frm.category_id != null) {
                let cat_data = {
                  name: frm.title,
                  category_description: frm.description,
                  sort_order: parseInt(frm.sort_order)
                }

                let where_data_cat = {
                  where: {
                    id: frm.category_id,
                    client_id: client_id
                  },
                };
                sub_cat_data = await module.exports.updateData(
                  models.Categories,
                  cat_data,
                  where_data_cat
                );
              } else {

                let sub_category_data = {
                  client_id: client_id,
                  // cf_master_id: master_data.id,
                  name: frm.title,
                  category_description: frm.description,
                  is_dashboard_display: 1,
                  is_default: 1,
                  background_color: jdata.background_color,
                  sort_oder: block_length,
                  parent_id: jdata.category_id
                }
                // Create new block for step
                sub_cat_data = await module.exports.createData(models.Categories, sub_category_data);
              }

              // Add new entry and update
              let block_data = {
                client_id: client_id,
                cf_master_id: master_data.id,
                cf_step_id: jdata.step_id,
                title: frm.title,
                description: frm.description,
                sort_order: frm.sort_order,
                category_id: sub_cat_data.id ? sub_cat_data.id : frm.category_id
              }

              // create new block data for new step
              await module.exports.createData(models.cf_blocks, block_data).then(async (blocks_data) => {

                frm.cf_step_id = blocks_data.cf_step_id;
                frm.category_id = blocks_data.category_id;
                frm.cf_master_id = master_data.id;
                frm.block_id = blocks_data.id;
                frm.client_id = blocks_data.client_id;
                frm.description = blocks_data.description;
              });

            } else {

              if (frm.category_id != null) {
                let cat_data = {
                  name: frm.title,
                  category_description: frm.description,
                  sort_order: parseInt(frm.sort_order)
                }

                let where_data_cat = {
                  where: {
                    id: frm.category_id,
                    client_id: client_id
                  },
                };
                let saveSubCat = await module.exports.updateData(
                  models.Categories,
                  cat_data,
                  where_data_cat
                );
                // if (saveSubCat) {
                //   continue;
                // }
              }

              // cerate new block data
              let block_data = await {
                client_id: client_id,
                cf_master_id: master_data.id,
                cf_step_id: jdata.step_id,
                title: frm.title,
                description: frm.description,
                sort_order: frm.sort_order,
                category_id: frm.category_id
              }

              // make a blocks for contact form
              await module.exports.createData(models.cf_blocks, block_data).then(async (blocks_data) => {

                frm.cf_step_id = blocks_data.cf_step_id;
                frm.category_id = blocks_data.category_id;
                frm.cf_master_id = blocks_data.cf_master_id;
                frm.block_id = blocks_data.id;
                frm.client_id = blocks_data.client_id;
                frm.description = blocks_data.description;
              });
            }

            // check attributes available or not
            let attr_length = frm.attributes.length;
            if (attr_length > 0) {
              let temp_attribute_id = 0;
              // create attribute data
              for (let attr of frm.attributes) {
                let attribute_data;
                if (attr.is_conditional) {
                  if (attr.show_on_temp_id) {
                    const att_data = await models.cf_attributes.findAll({
                      where: {
                        label: attr.show_on_field,
                        temp_id: attr.show_on_temp_id ? attr.show_on_temp_id : null,
                        cf_master_id: master_data.id,
                        client_id: client_id
                      }
                    });
                    if (att_data.length > 0) {
                      temp_attribute_id = att_data[0].id;
                    }
                  }

                  attribute_data = {
                    client_id: client_id,
                    cf_master_id: master_data.id,
                    cf_step_id: jdata.step_id,
                    cf_block_id: frm.block_id,
                    label: attr.label,
                    description: attr.description,
                    type: attr.type,
                    is_mandetory: attr.is_mandetory,
                    attribute_options: attr.attribute_options,
                    default_value: attr.default_value,
                    is_conditional: attr.is_conditional,
                    // show_on_field: (att_data && att_data.length > 0) ? att_data[0].id : 0,
                    show_on_field: temp_attribute_id ? temp_attribute_id : 0,
                    show_on_value: attr.show_on_value || '',
                    sort_order: attr_length + 1,
                    temp_id: attr.temp_id,
                  }
                } else {

                  // Add new entry and update
                  attribute_data = {
                    client_id: client_id,
                    cf_master_id: master_data.id,
                    cf_step_id: jdata.step_id,
                    cf_block_id: frm.block_id,
                    label: attr.label,
                    description: attr.description,
                    type: attr.type,
                    is_mandetory: attr.is_mandetory,
                    attribute_options: attr.attribute_options,
                    default_value: attr.default_value,
                    is_conditional: attr.is_conditional,
                    show_on_field: 0,
                    show_on_value: '',
                    sort_order: attr_length + 1,
                    temp_id: attr.temp_id,
                  }
                }

                // make a blocks for contact form
                await module.exports.createData(models.cf_attributes, attribute_data).then(async (attributes_data) => {

                  attr.cf_step_id = attributes_data.cf_step_id;
                  attr.category_id = attributes_data.category_id;
                  attr.cf_master_id = master_data.id;
                  attr.cf_block_id = attributes_data.cf_block_id;
                  attr.attribute_id = attributes_data.id;
                  attr.show_on_field = attributes_data.show_on_field;
                  attr.description = attribute_data.description;

                  if (attr.type == 'boolean' || attr.type == 'selectbox') {
                    temp_attribute_id = attributes_data.id;
                    if (attributes_data.attribute_options) {
                      attr.options = attributes_data.attribute_options.split("|");
                    }
                  }
                });
              } // attribute loop end
            } // end attr_length if
          } // block loop end
        } // end block_length if
      } //  step loop end

      let masters_data = {
        json_data: json_data,
        attachments: attachments,
        updated_at: new Date()
      }

      let where_data_mas = {
        where: {
          id: master_data.id,
        }
      }
      module.exports.updateData(
        models.cf_masters,
        masters_data,
        where_data_mas
      );
    } catch (error) {
      console.log(error);
    }
  },

  // convert task repeat string into norwegian
  getRepeatStringTranslations(repeatStr) {
    let translatedRepeatStr = null;
    if (repeatStr !== '') {
      const stringWithoutSpace = repeatStr.split(' ');
      const findOnIndex = stringWithoutSpace.findIndex(element => 'on' === element);  // remove ON from array
      if (findOnIndex >= 0) {
        stringWithoutSpace.splice(findOnIndex, 1);
      }
      if (stringWithoutSpace.length > 0) {
        stringWithoutSpace.forEach((strWord, index, array) => {
          const findData = constants.RECURRING_STRINGS.find(element => strWord === element.key);
          if (findData) {
            array[index] = findData.str;
          }
          const findMonthIndex = constants.MONTHS.findIndex(element => strWord === element);
          if (findMonthIndex >= 0) {
            array[index] = constants.MONTHS_NO[findMonthIndex];
          }
          translatedRepeatStr = array.toString();
          translatedRepeatStr = translatedRepeatStr.replace(/,/g, ' ');
        });
      }
    }
    return translatedRepeatStr;
  },

  getNorwagianString(str, repeat_freq) {
    let keyStr = '';
    if (str) {
      const splitArrayBySpace = str.split(' ');
      if (splitArrayBySpace.length > 0) {
        // tslint:disable-next-line:prefer-for-of
        for (let x = 0; x < splitArrayBySpace.length; x++) {
          // let search = new RegExp(split_array[x] , 'i');
          // let b =  this.recurringArray.filter(item => search.test(item.str));
          const findData = constants.RECURRING_STRINGS.find(element => splitArrayBySpace[x] === element.key);
          if (findData) {
            keyStr += findData.str + ' ';
          } else {
            const splitByComma = splitArrayBySpace[x].split(',');
            if (repeat_freq !== 'year') {
              if (splitByComma.length > 1) {
                for (let y = 0; y < splitByComma.length; y++) {
                  const findDay = constants.RECURRING_STRINGS.find(ele => splitByComma[y] === ele.key);
                  if (findDay) {
                    if (y === (splitByComma.length - 1)) {
                      keyStr += findDay.str + '';
                    } else {
                      keyStr += findDay.str + ',';
                    }
                  } else {
                    if (y === (splitByComma.length - 1)) {
                      keyStr += splitByComma[y] + '';
                    } else {
                      keyStr += splitByComma[y] + ',';
                    }
                  }
                }
              } else {
                keyStr += splitArrayBySpace[x] + ' ';
              }
            } else {
              keyStr += splitArrayBySpace[x] + ' ';
            }
          }
        }
      }
    }
    keyStr = keyStr.replace("th", ".");
    if (repeat_freq == 'year') {
      let tkey = keyStr.split(' ');
      if (tkey[1] == 'jan,mar,may,jul,sep,nov') {
        // keyStr = keyStr.replace("jan,mar,may,jul,sep,nov", "oddetallsmåned");
        keyStr = tkey[3] + " oddetallsmåned (jan, mar, mai...)";
      } else if (tkey[1] == 'feb,apr,jun,aug,oct,dec') {
        // keyStr = keyStr.replace("feb,apr,jun,aug,oct,dec", "partallsmåned");
        keyStr = tkey[3] + " partallsmåned (feb, apr, jun...)";
      } else {
        let newkey = keyStr.split(' ');
        keyStr = "Årlig " + newkey[3] + " " + newkey[1];
      }
    }

    if (repeat_freq == 'month') {
      let newkey = keyStr.split(' ');
      if (newkey[1] == '2') {
        newkey[1] = "andre";
        keyStr = newkey[4] + " " + newkey[0] + " " + newkey[1] + " " + newkey[2];
      } else if (newkey[1] == '3') {
        newkey[1] = "tredje";
        keyStr = newkey[4] + " " + newkey[0] + " " + newkey[1] + " " + newkey[2];
      } else if (newkey[1] == '4') {
        newkey[1] = "fjerde";
        keyStr = newkey[4] + " " + newkey[0] + " " + newkey[1] + " " + newkey[2];
      } else if (newkey[1] == '6') {
        newkey[1] = "sjette";
        keyStr = newkey[4] + " " + newkey[0] + " " + newkey[1] + " " + newkey[2];

      } else {
        keyStr = newkey[3] + " " + newkey[0] + " " + newkey[1];
      }
    }

    if (str == 'every month on last') {
      keyStr = "Siste dag i måneden";
    }

    if (keyStr.trim() == 'hver mandag') {
      keyStr = "Mandager";
    } else if (keyStr.trim() == 'hver tirsdag') {
      keyStr = "Tirsdager";
    } else if (keyStr.trim() == 'hver onsdag') {
      keyStr = "Onsdager";
    } else if (keyStr.trim() == 'hver torsdag') {
      keyStr = "Torsdager";
    } else if (keyStr.trim() == 'hver fredag') {
      keyStr = "Fredager";
    } else if (keyStr.trim() == 'hver lørdag') {
      keyStr = "Lørdager";
    } else if (keyStr.trim() == 'hver søndag') {
      keyStr = "Søndager";
    }

    return keyStr;
  },

  // convert file in base43 string using URL
  getBase64Str(url) {
    let base64Str = null;
    return new Promise((resolve, reject) => {
      pdf2base64(url).then((data) => {
        base64Str = 'data:application/pdf;base64,' + data;
        resolve(base64Str);
      }).catch((error) => {
        reject(error);
      })
    });
  },

  createDataNew: async (model, post_data) => {
    return new Promise(async (resolve, reject) => {

      try {
        const model_data = await model.create(post_data);
        resolve(model_data);
      } catch (err) {
        console.log(err);
        reject(false);
      }
    })
  },

  splitIntoChunk: (inputArray, chunk) => {
    let result = inputArray.reduce((resultArray, item, index) => {
      const chunkIndex = Math.floor(index / chunk)

      if (!resultArray[chunkIndex]) {
        resultArray[chunkIndex] = [] // start a new chunk
      }

      resultArray[chunkIndex].push(item)

      return resultArray
    }, []);

    return result;
  },

  createDefaultStatusesById: async (client_id, clone_client_id) => {
    let data = [];

    const status_data = await Status.findAll({
      where: {
        client_id: clone_client_id,
      }
    });

    await status_data.forEach(ele => {
      data.push({
        status: ele.status, client_id: client_id, color_code: ele.color_code,
        sort_order: ele.sort_order, is_default: ele.is_default, state: ele.state
      });
    });
    return new Promise(async (resolve, reject) => {
      try {
        const model_data = await Status.bulkCreate(data);
        resolve(model_data);
      } catch (err) {
        console.log(err);
        reject(false);
      }
    })
  },

  createDefaultDepartmentById: async (client_id, clone_client_id) => {
    let data = [];

    const department_data = await Department.findAll({
      where: {
        client_id: clone_client_id,
      }
    });

    let parent_data_new = await department_data.filter(element => element.parent_id == 0);
    let child_data = await department_data.filter(element => element.parent_id != 0);
    const data_new = await module.exports.getAllDepartmentData(parent_data_new, child_data);

    await data_new.forEach(async (ele) => {
      let post_department_data = {
        name: ele.name,
        client_id: client_id,
        is_default: ele.is_default,
        parent_id: ele.parent_id
      }
      const dept_data = await module.exports.createData(
        models.Departments,
        post_department_data
      );
      if (ele.sub_data && ele.sub_data.length > 0) {
        module.exports.createChildDeptData(client_id, ele.sub_data, dept_data.id);
      }
    });

    return new Promise(async (resolve, reject) => {
      try {
        resolve(data_new);
      } catch (err) {
        console.log(err);
        reject(false);
      }
    })
  },

  async getAllDepartmentData(parent_data, child_data) {
    for (let pd of parent_data) {
      let getData = await module.exports.setSubDepartmentData(pd, child_data);
      pd = await getData;
    }
    return parent_data;
  },

  async setSubDepartmentData(pd, child_data) {
    if (pd.id) {
      accountans = await DeptAccountants.getAssignedAccountants(pd.id);
      pd.assigned_accountants = await accountans[0].assigned_accountants;
      companies = await Company.getAssignedCompanies(pd.id);
      pd.assigned_companies = await companies[0].assigned_companies;
      let new_data = [];
      for (let cd of child_data) {
        if (cd.parent_id == pd.id) {
          await new_data.push(cd);
          pd.sub_data = await new_data;
        }
      }
      if (pd.sub_data) {
        for (let sd of pd.sub_data) {
          await module.exports.setSubDepartmentData(sd, child_data);
        }
      }
    }
    return pd;
  },

  createChildDeptData: async (client_id, subData, parent_id) => {
    subData.forEach(async (sele) => {
      let post_department_data = {
        name: sele.name,
        client_id: client_id,
        is_default: sele.is_default,
        parent_id: parent_id
      }
      const dept_data = await module.exports.createData(
        models.Departments,
        post_department_data
      );
      if (sele.sub_data && sele.sub_data.length > 0) {
        module.exports.createChildDeptData(client_id, sele.sub_data, dept_data.id);
      }
    })
  },

  createDefaultTemplateById: async (client_id, clone_client_id) => {
    let post_data = {
      client_id: client_id,
      json_data: [],
      created_at: new Date(),
      updated_at: new Date(),
    };

    let contracts = await cf_masters.getTemplate(clone_client_id);

    let no = await contracts.length;
    let contract_data = await contracts[no - 1].json_data;
    const attachments = contracts[no - 1].attachments;
    let cf_master_id = contracts[no - 1].cf_master_id;
    let final_data = await contract_data.sort(function (a, b) {
      return a.sort_order - b.sort_order;
    });

    post_data.json_data = await final_data;
    const master_data = await module.exports.createData(cf_masters, post_data);

    for (let [index, step] of final_data.entries()) {
      let add_step_data;
      if (step.category_id) {
        let category_data = {
          name: step.name,
          category_description: step.description ? step.description : null,
          sort_order: step.sort_order,
          client_id: master_data.client_id,
          is_dashboard_display: 1,
          is_default: 1,
          background_color: step.background_color,
          parent_id: 0
        }

        let parent_category_data = await module.exports.createData(models.Categories, category_data);
        add_step_data = {
          cf_master_id: master_data.id,
          name: step.name,
          description: step.description,
          sort_order: step.sort_order,
          category_id: parent_category_data.id,
          background_color: step.background_color
        }

      } else {
        add_step_data = {
          cf_master_id: master_data.id,
          category_id: null,
          name: step.name,
          description: step.description,
          sort_order: step.sort_order,
          background_color: step.background_color
        }
      }

      // make a steps for contact form
      await module.exports.createData(models.cf_steps, add_step_data).then(async (steps_data) => {

        for (let frm of master_data.json_data) {
          if (frm.sort_order == index + 1) {
            frm.step_id = steps_data.id;
            frm.name = steps_data.name;
            frm.cf_master_id = master_data.id;
            frm.category_id = steps_data.category_id ? steps_data.category_id : null;
            frm.sort_order = steps_data.sort_order;
            frm.is_default = 1;
            frm.is_deleted = 0;
            frm.description = steps_data.description;
            frm.background_color = step.background_color;

            for (let blk of frm.block_data) {

              let sub_cat_data = '';
              if (blk.category_id) {

                let sub_category_data = {
                  client_id: client_id,
                  name: blk.title,
                  category_description: blk.description,
                  is_dashboard_display: 1,
                  is_default: 1,
                  background_color: frm.background_color ? frm.background_color : null,
                  sort_oder: blk.sort_oder || 0,
                  parent_id: frm.category_id
                }

                // make a sub category for contact form
                sub_cat_data = await module.exports.createData(models.Categories, sub_category_data);
              }

              let block_data = {
                client_id: client_id,
                cf_master_id: master_data.id,
                cf_step_id: steps_data.id,
                title: blk.title,
                description: blk.description,
                sort_order: blk.sort_order,
                category_id: sub_cat_data ? sub_cat_data.id : null
              }

              // make a blocks for contact form
              await module.exports.createData(models.cf_blocks, block_data).then(async (blk_data) => {
                blk.block_id = blk_data.id
                blk.cf_step_id = steps_data.id;
                blk.cf_master_id = master_data.id;
                blk.category_id = blk_data.category_id ? blk_data.category_id : null;
                blk.is_deleted = 0;
                blk.description = blk_data.description;
                let temp_attribute_id = 0;
                for (let attr of blk.attributes) {

                  let attribute_data = {
                    client_id: client_id,
                    cf_master_id: master_data.id,
                    cf_step_id: blk_data.cf_step_id,
                    cf_block_id: blk_data.id,
                    label: attr.label,
                    description: attr.description,
                    type: attr.type,
                    is_mandetory: attr.is_mandetory,
                    attribute_options: attr.attribute_options,
                    default_value: attr.default_value,
                    is_conditional: attr.is_conditional,
                    show_on_field: attr.show_on_field,
                    show_on_value: attr.show_on_value,
                    sort_order: attr.sort_order
                  }
                  if (attr.is_conditional == 1) {
                    attribute_data.show_on_field = temp_attribute_id;
                  }

                  // make a Attrubutes for contact form
                  let attr_data = await module.exports.createData(models.cf_attributes, attribute_data);
                  attr.attribute_id = attr_data.id;
                  attr.client_id = client_id;
                  attr.cf_master_id = master_data.id;
                  attr.cf_step_id = attr_data.cf_step_id;
                  attr.cf_block_id = attr_data.cf_block_id;
                  attr.show_on_field = attr_data.show_on_field;
                  attr.is_deleted = 0;
                  if (attr_data.type == 'boolean' && attr_data.is_conditional == 0) {
                    temp_attribute_id = attr_data.id;
                    attr.options = attr_data.attribute_options.split("|");
                  }
                  if (attr_data.type == 'selectbox') {
                    temp_attribute_id = attr_data.id;
                    attr.options = attr_data.attribute_options.split("|");
                  }
                }
              })
            }
          }
        }
      });
    }
    let updated_data = {
      json_data: master_data.json_data
    };

    let where_data = {
      where: {
        id: master_data.id,
      },
    };

    const Updated_data = await module.exports.updateData(
      models.cf_masters,
      updated_data,
      where_data
    );
  },

  createDefaultQATemplateById: async (new_client_id, clone_client_id) => {
    try {
      const qa_templates = await qa_masters.getTemplateRecursive(clone_client_id);
      const idMapping = {};

      for (const template of qa_templates) {
        const unique_id = uuidv4();

        let post_data = {
          client_id: new_client_id,
          uuid: unique_id,
          name: template.name,
          description: template.description,
          json_data: template.json_data,
          created_at: new Date(),
          updated_at: new Date(),
          parent_id: 0, // Initialize with a default value (0 or any other suitable value)
          is_group: template.is_group,
        };

        // Create the new QA template
        const insertedData = await module.exports.createData(qa_masters, post_data);

        // Update the parent_id if it is a group and exists in the mapping
        if (template.is_group === 0 && template.parent_id !== 0) {
          const newParentId = idMapping[template.parent_id] || 0;
          await qa_masters.update({ parent_id: newParentId }, { where: { id: insertedData.id } });
        }

        idMapping[template.id] = insertedData.id;
      }

      return 'QA Data cloned successfully for the new client';
    } catch (error) {
      console.error('Error cloning QA data for the new client', error);
    }
  },

  createDefaultFoldersById: async (client_id, clone_client_id) => {
    let folderList = await Folder.findAll({
      raw: true,
      attributes: ['id', 'name', 'client_id', 'parent_id'],
      order: [
        ['id', 'ASC']
      ],
      where: {
        client_id: clone_client_id
      },
    });

    folderList = await module.exports.createDataTree(folderList);

    await folderList.forEach(async (ele) => {

      let post_folder_data = {
        name: ele.name,
        client_id: client_id,
        parent_id: ele.parent_id,
        created_at: new Date(),
        updated_at: new Date()
      }
      const folder_data = await module.exports.createData(
        Folder,
        post_folder_data
      );
      if (ele.child && ele.child.length > 0) {
        module.exports.createChildFolderData(client_id, ele.child, folder_data.id);
      }
    });
  },

  createChildFolderData: async (client_id, subData, parent_id) => {
    subData.forEach(async (child) => {
      let post_folder_data = {
        name: child.name,
        client_id: client_id,
        parent_id: parent_id,
        created_at: new Date(),
        updated_at: new Date()
      }
      const folder_data = await module.exports.createData(
        Folder,
        post_folder_data
      );

      if (child.child && child.child.length > 0) {
        module.exports.createChildFolderData(client_id, child.child, folder_data.id);
      }
    })
  },

  downloadSignedDocument: async (id, is_contract, is_esign) => {

    if (is_contract) {
      if (id) {
        let installation_data = await models.cf_installation.findAll({
          where: {
            id: id
          },
          attributes: ['id', 'company_id', 'filename', 'idfy_doc_id', 'client_id', 'idfy_expiry_date']
        });

        let uploadPath = "./public/uploads/contract-form-signed/" + installation_data[0].client_id + '/' + installation_data[0].company_id;
        if (!fs.existsSync(uploadPath)) {
          rimraf.sync(uploadPath);
          mkdirsSync(uploadPath);
        }
        let documentId = installation_data[0].idfy_doc_id;
        if (documentId) {
          const result = is_esign ? (await esignUtils.getSignedDocument(documentId)) : (await idfyUtils.getSignedDocument(documentId));
          console.log(result);
          let buff = await Buffer.from(result);
          base64data = await buff.toString('base64');
        }

        fs.writeFile('./public/uploads/contract-form-signed/' + installation_data[0].client_id + '/' + installation_data[0].company_id + '/' + installation_data[0].filename, base64data, { encoding: 'base64' }, function (err) {

          if (module.exports.allowToS3()) {
            let file = './public/uploads/contract-form-signed/' + installation_data[0].client_id + '/' + installation_data[0].company_id + '/' + installation_data[0].filename;
            file = file.replace('./', '');

            module.exports.moveFileToS3Bucket(file, installation_data[0].filename);
          }
        });
      }
    } else {
      if (id) {
        let signatures_data = await models.Signatures.findAll({
          where: {
            id: id
          },
          attributes: ['id', 'company_id', 'filename', 'name', 'idfy_doc_id', 'client_id', 'idfy_expiry_date']
        });
        if (signatures_data?.length > 0) {
          let uploadPath = "./public/uploads/signatures-signed/" + signatures_data[0].client_id + '/' + signatures_data[0].company_id;
          if (!fs.existsSync(uploadPath)) {
            rimraf.sync(uploadPath);
            mkdirsSync(uploadPath);
          }
          let documentId = signatures_data[0].idfy_doc_id;
          if (documentId) {
            const result = is_esign ? (await esignUtils.getSignedDocument(documentId)) : (await idfyUtils.getSignedDocument(documentId));
            console.log(result);
            let buff = await Buffer.from(result);
            base64data = await buff.toString('base64');
          }

          fs.writeFile('./public/uploads/signatures-signed/' + signatures_data[0].client_id + '/' + signatures_data[0].company_id + '/' + signatures_data[0].filename, base64data, { encoding: 'base64' }, function (err) {
            if (module.exports.allowToS3()) {
              let file = './public/uploads/signatures-signed/' + signatures_data[0].client_id + '/' + signatures_data[0].company_id + '/' + signatures_data[0].filename;
              file = file.replace('./', '');
              module.exports.moveFileToS3Bucket(file, signatures_data[0].filename);
            }
          });
        }
      }
    }
  },

  getSignedDocumentDetails: async (documentId, signerId, uuid) => {
    try {
      if (documentId) {
        let signatureDoc = '';
        const result = await esignUtils.getDocumentDetails(documentId, signerId);
        console.log(result);
        if (result) {
          signatureDoc = await models.Signatures.findOne({
            where: { idfy_doc_id: documentId }
          });

          let SSN = await result.documentSignature.socialSecurityNumber.value;
          console.log(signatureDoc, SSN);

          if (signatureDoc && signatureDoc.contact_person_verification) {
            // const uuid = signer.externalSignerId ? signer.externalSignerId : null;
            const signerDetails = await models.Signers.getAssigneeByIdWithStatusNew(uuid);
            if (signerDetails.length > 0 && signerDetails[0].verified) {
              await module.exports.updateData(models.Users, {
                ssn: SSN
              }, {
                where: { id: signerDetails[0].user_id }
              });
              // await activityLogs.signatureLogActivity(signerDetails[0].assignee_role, signerDetails[0].user_id, signerDetails[0].assignee_name, signerDetails[0].user_profile_id, 'CONTACT_PERSON_VERIFIED', signerDetails[0].signature_id, signerDetails[0].assignee_name);
            }
          }
        }
      }
    } catch (err) {
      console.log(err);
      module.exports.log('Get Signed Document details error ' + err.toString(), 'error');
    }
  },

  sendSMS: async (messages) => {

    // let messages = [
    //   {
    //     "recipient": "919099160011",
    //     "message": "This is a test message"
    //   }
    // ];

    const Ref = constant.BOOSTLINE_REF;
    const Token = process.env.BOOSTLINE_TOKEN;
    const Sender_name = constant.BOOSTLINE_SENDER_NAME;

    return new Promise(async (resolve, reject) => {
      try {
        if (constant.ALLOW_SMS_SEND && messages.length > 0 && Token != "" && Sender_name != "") {
          axios({
            url: constant.SMS_SEND_URL,
            method: 'POST',
            data: {
              token: Token,
              ref: Ref,
              messages: messages,
              sender_name: Sender_name
            },
            headers: {
              'Content-Type': 'application/json'
            }
          }).then(response => {
            if (response.data) {
              resolve(true);
            } else {
              resolve(true);
            }
          }).catch(error => {
            console.log(err);
            resolve(true);
          });
        }
      } catch (err) {
        console.log(err);
        reject(err);
      }
    })
  },

  addDefaultAvatar: async (uploadPath, thumbnailPath, isLogo = false) => {
    console.log(uploadPath, thumbnailPath);
    try {
      let defaultAvatar = './public/images/default-avatar.png';
      if (isLogo) {
        defaultAvatar = './public/images/default-logo.png';
      }

      let fileUrl = '';
      let uploadFileName = 'default-avatar-' + Date.now() + ".png";
      let destFileName = uploadPath + '/' + uploadFileName;
      // File "destination.txt" will be created or overwritten by default.
      await fs.copyFile(defaultAvatar, destFileName, (err) => {
        if (err)
          throw err;
      });

      if (!fs.existsSync(uploadPath)) {
        rimraf.sync(uploadPath);
        mkdirsSync(uploadPath);
      }

      if (!fs.existsSync(thumbnailPath)) {
        rimraf.sync(thumbnailPath);
        mkdirsSync(thumbnailPath);
      }

      let options = {
        width: 100,
        quality: 50,
        height: 100,
        // quality: 100,
        // background: '#ffffff',
        // pagerange: '1-2'
      };

      if (!filepreview.generateSyncNew(uploadPath + "/" + uploadFileName, thumbnailPath + "/" + uploadFileName, options)) {
        // console.log('Oops, something went wrong.');
        res.status(200).json({
          code: 200,
          success: false,
          message: "msg_unable_to_get_preview",
        });
      } else {
        fileUrl = constant.BASE_URL + thumbnailPath.replace('./public/', '');
      }
      return uploadFileName;
    } catch (error) {
      console.log("error", error);
    }
  },

  companyCustomNumberExists: async (clientId, companyNumber, companyId = 0) => {
    try {
      let company = await models.Companies.checkCompanyNumberExists(clientId, companyNumber, companyId);
      return company.length > 0 ? true : false;
    } catch (error) {
      console.log(error)
    }
  },

  /**
   * create AWS S3 config
   * @returns AWS S3 instance
   */
  awsS3Config: () => {
    return new S3(
      {
        region: REGION,
        credentials: {
          accessKeyId: ID,
          secretAccessKey: SECRET
        }
      });
  },

  /**
   * Get signed url from AWS
   * @param {*} filePath
   * @returns AWS signed url
   */
  getS3SignedUrl: async (filePath) => {
    try {
      filePath = filePath.replace('//', '/');
      filePath = filePath.replace('./', '');
      const s3 = module.exports.awsS3Config();
      const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: filePath });
      const url = await getSignedUrl(s3, command, { expiresIn: 60 * 5 }); // e
      return url;
    } catch (error) {
      return false;
    }
  },

  /**
   * Get signed url from AWS
   * @param {*} filePath
   * @returns AWS signed url
   */
  getS3Object: async (filePath, callback) => {
    filePath = filePath.replace('//', '/');
    filePath = filePath.replace('./', '');
    try {
      const s3 = module.exports.awsS3Config();
      let params = {
        Bucket: BUCKET_NAME,
        Key: filePath
      };

      return s3.getObject(params, callback);
    } catch (error) {
      console.log('----------error', error);
      return false;
    }
  },

  s3CopyFile: async (filePath, copyPath, callback) => {
    try {
      filePath = filePath.replace('//', '/');
      copyPath = copyPath.replace('//', '/');
      filePath = filePath.replace('./', '');
      copyPath = copyPath.replace('./', '');
      const s3 = module.exports.awsS3Config();
      let params = {
        Bucket: BUCKET_NAME,
        Key: filePath,
        CopySource: '/' + BUCKET_NAME + '/' + copyPath, /* required */
      };

      return s3.copyObject(params).then(callback);
    } catch (error) {
      console.log('========ERROR', error);
      return false;
    }
  },

  s3HeadFile: async (filePath, callback) => {
    try {
      filePath = filePath.replace('//', '/');
      filePath = filePath.replace('./', '');
      const s3 = module.exports.awsS3Config();
      let params = {
        Bucket: BUCKET_NAME,
        Key: filePath
      };

      return s3.headObject(params, callback);
    } catch (error) {
      console.log('========================error', error)
      return false;
    }
  },

  /**
   * Delete s3 object
   * @param {string} key
   * @returns
   */
  s3DeleteFile: async (key) => {
    try {
      key = key.replace('//', '/');
      key = key.replace('./', '');

      let params = {
        Bucket: BUCKET_NAME,
        Key: key
      };

      // Uploading files to the bucket
      const s3 = module.exports.awsS3Config();
      s3.deleteObject(params);
      console.log('File deleted successfully');
    } catch (error) {
      console.log('=========Catch', error.stack);
      return false;
    }
  },

  /**
   * Upload file to s3 bucket
   * @param {*} req
   * @param {*} filePath
   */
  checkFileUploaded: async (uploadedFile, uploadPath, uploadThumb, uploadedFileName = false, isService = false) => {
    if (uploadedFile.key || uploadedFile.filename != null) {
      let uploadedFileName = uploadedFile.filename || uploadedFileName;
      if (uploadedFileName != null) {
        let fileUrl = '';
        try {
          if (!fs.existsSync(uploadThumb)) {
            rimraf.sync(uploadThumb);
            mkdirsSync(uploadThumb);
          }
          let options = { width: 100, quality: 50, height: 100, };
          if (!module.exports.allowToS3() || isService) {
            if (!filepreview.generateSyncNew(uploadPath + "/" + uploadedFileName, uploadThumb + "/" + uploadedFileName, options)) {
              console.log('Oops, something went wrong.');
            } else {
              fileUrl = constant.BASE_URL + uploadThumb.replace('./public/', '');
            }
          } else {
            uploadThumb = uploadThumb.replace('./', '');
            uploadPath = uploadPath.replace('./', '');
            let filePath = uploadPath + '/' + uploadedFileName;
            let signedUrl = await module.exports.getS3SignedUrl(filePath);
            if (!filepreview.generatePreviewImageFromUrl(uploadedFileName, signedUrl, './' + uploadThumb + "/" + uploadedFileName, options)) {
              console.log('Oops, something went wrong.');
            } else {
              // await module.exports.moveFileToS3Bucket(uploadThumb + "/"  + uploadedFileName);
              fileUrl = constant.BASE_URL + uploadThumb.replace('./public/', '');
            }
          }
        } catch (error) {
          return false;
        }
      }
    }

    return uploadedFileName;
  },

  moveFileToS3Bucket: async (file, keyname = '', isMove = false) => {
    try {
      file = file.replace('./', '');
      keyname = keyname.replace('./', '');

      file = file.replace('//', '/');
      let filePath = './' + file;
      let key = isMove ? keyname : file;
      if (fs.existsSync(filePath)) {
        const fs = require('fs');
        let isFile = await path.extname(filePath);

        if (isFile != '') {
          //file_new = await file.client_id + '/' + file.company_id + '/' + file.filename;
          const fileContent = fs.readFileSync(filePath);
          //Setting up S3 upload parameters
          const params = {
            Bucket: BUCKET_NAME,
            Key: key, // File name you want to save as in S3
            Body: fileContent
          };

          // Uploading files to the bucket
          const s3 = module.exports.awsS3Config();
          await s3.putObject(params);
          console.log(`File uploaded successfully. ${filePath}`);

          fs.unlink(filePath, function (err) {
            if (err) return console.log(err);
            console.log('file deleted successfully');
          });

          return true;

        } else {
          console.log('Its Folder.............', file, type);
          return false;
        }
      }
    } catch (error) {
      console.log(error);

      return false;
    }
  },

  moveFileToS3BucketFromOldPathtoNewPath: async (file, keyname = '') => {

    try {
      file = file.replace('./', '');
      keyname = keyname.replace('./', '');

      file = file.replace('//', '/');
      let filePath = './' + file;
      let key = keyname;
      if (fs.existsSync(filePath)) {
        const fs = require('fs');
        let isFile = await path.extname(filePath);

        if (isFile != '') {
          //file_new = await file.client_id + '/' + file.company_id + '/' + file.filename;
          const fileContent = fs.readFileSync(filePath);

          //Setting up S3 upload parameters
          const params = {
            Bucket: BUCKET_NAME,
            Key: key, // File name you want to save as in S3
            Body: fileContent
          };

          // Uploading files to the bucket
          const s3 = module.exports.awsS3Config();
          await s3.putObject(params);
          console.log(`File uploaded successfully. ${filePath}`);

          fs.unlink(filePath, function (err) {
            if (err) return console.log(err);
            console.log('file deleted successfully');
          });

          return true;

        } else {
          console.log('Its Folder.............', file, type);
          return false;
        }
      }
    } catch (error) {
      console.log(error);

      return false;
    }
  },

  getFileUrl: async (filePath, isCompany = false) => {
    let ext = filePath.split(".");
    if (!fs.existsSync(filePath) || ext.length < 3) {
      filePath = './public/images/default-avatar.png';
      if (isCompany) {
        filePath = './public/images/default-logo.png';
      }
    }
    return constant.BASE_URL + filePath.replace('./public/', '');
  },

   createDefaultTaskTemplateById : async (client_id, clone_client_id) => {
    try {
      const task_templates = await models.TaskTemplate.getTemplateByClientId(clone_client_id);

      const idMap = {};

      for (const ele of task_templates) {
        let category_data = await Category.getOne(clone_client_id, ele.category_name);
        const [firstCategory] = category_data;
        const categoryId = firstCategory ? firstCategory.id : null;
        const newParentId = idMap[ele.parent_id] || 0;

        const post_data = {
          title: ele.title,
          note: ele.note,
          category_id: categoryId,
          checklists: ele.checklists,
          recurring_rule: ele.recurring_rule,
          recurring_rule_nor: ele.recurring_rule_nor,
          is_repeat: ele.is_repeat,
          is_group: ele.is_group,
          client_id: client_id,
          parent_id: newParentId,
          created_at: new Date(),
          updated_at: new Date(),
        };

        const master_data = await module.exports.createData(models.TaskTemplate, post_data);

        const task_template_files = await models.TaskTemplateFile.findAll({
          where: { client_id: clone_client_id, task_template_id: ele.id },
        });

        for (const ele_file of task_template_files) {
          const post_files_data = {
            task_template_id: master_data.id,
            client_id: client_id,
            filepath: "task_files/" + ele_file.filepath,
            filename: ele_file.filename,
            originalname: ele_file.originalname,
            created_at: new Date(),
            updated_at: new Date(),
          };
          await module.exports.createData(models.TaskTemplateFile, post_files_data);
        }

        idMap[ele.id] = master_data.id;
      }

      return task_templates;
    } catch (err) {
      console.error(err);
    }
  },

  /**
   * Download file from s3 to local
   * @param {string} filePath
   * @param {string} folder
   */
  downloadInLocalFromS3: async (filePath, downloadPath = null) => {
    try {
      downloadPath = downloadPath ? downloadPath : filePath;
      let s3FileUrl = await module.exports.getS3SignedUrl(downloadPath);

      const got = require('got');
			const response = await got(s3FileUrl, { responseType: 'buffer' });

			fs.writeFileSync(downloadPath, response.body);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  },

  /**
   * Move file to from old folder to new folder
   * @param {string} newFolderPath
   * @param {string} oldFilePath
   * @param {string} oldPath
   * @param {string} s3Status
   */
  moveFile: async (newFolderPath, oldFilePath, oldPath, s3Status = false, qaform = false) => {
 
    try {
      newFolderPath = newFolderPath.replace('//', '/');
      oldFilePath = oldFilePath.replace('//', '/');
      oldPath = oldPath.replace('//', '/');

      if (s3Status) {
        // check for thumbnails folder if not exist then create.
        if (!fs.existsSync(oldPath)) {
          rimraf.sync(oldPath);
          mkdirsSync(oldPath);
        }

        await module.exports.downloadInLocalFromS3(oldFilePath);
        if(!qaform) {
          await module.exports.s3DeleteFile(oldFilePath);
        }
      }

      if (module.exports.allowToS3()) {
        if(qaform) {
          let newfileName = oldFilePath?.split('/').pop();
          await module.exports.moveFileToS3BucketFromOldPathtoNewPath(oldFilePath.replace('./', ''), newFolderPath.replace('./', '') + newfileName)
        } else {
        await module.exports.moveFileToS3Bucket(oldFilePath.replace('./', ''), newFolderPath.replace('./', ''), true)
        }
      } else {
        await fs.rename(oldFilePath, newFolderPath, function (err) {
          if (err) throw err
          console.log('Successfully renamed - AKA moved!')
        })
      }
    } catch (error) {
      console.log(error);
    }
  },

  createNotification: async (title, description, company_id, client_id, sender, receivers, model, model_id, notificationType = "", from = null) => {
    try {

      const type = await constant.NOTIFICATION_TYPES.find(f => f.type == notificationType);
      let data = await models.Notifications.findAll({ where: { title: title, description: description, company_id: company_id, client_id: client_id, type_id: type.id, type: type.type } });

      if (data && data.length > 0 && from == 'IDFY') {
        console.log('Already Exist');
      } else {
        let notification = await models.Notifications.create({
          title: title,
          description: description,
          company_id: company_id || null,
          sender_id: sender,
          client_id: client_id,
          type_id: type && type.id ? type.id : 0,
          type: type && type.type ? type.type : "",
          created_at: new Date(),
          updated_at: new Date(),
        });

        if (Array.isArray(receivers)) {
          for (let receiver of receivers) {
            await NotificationReceivers.create({
              notification_id: notification.id,
              model: model,
              model_id: model_id,
              receiver_id: receiver,
              company_id: company_id || null,
              created_at: new Date(),
              updated_at: new Date(),
            });
          }
        } else {
          await NotificationReceivers.create({
            notification_id: notification.id,
            model: model,
            model_id: model_id,
            receiver_id: receivers,
            company_id: company_id,
            created_at: new Date(),
            updated_at: new Date(),
          });
        }

        let socket = clientIo(constant.SOCKET_ENDPOINT);
        socket.emit('message', { 'loadData': true, client_id: parseInt(client_id) });
      }
    } catch (error) {
      console.log("++++++++++=error", error);
    }
  },

  // controller function to update notification
  addNotification: async (notification_data) => {
    try {

      if (notification_data && notification_data.receiver_ids && notification_data.receiver_ids.length > 0) {
        let task_comment_notification_data = {
          client_id: parseInt(notification_data.client_id),
          company_id: notification_data.company_id ? notification_data.company_id : '',
          title: notification_data.title,
          description: notification_data.description,
          type_id: notification_data.type_id,
          type: notification_data.type,
          sender_id: notification_data.sender_id,
          created_at: new Date(),
          updated_at: new Date(),
        };

        let notification_submitted = await module.exports.createData(
          models.Notifications,
          task_comment_notification_data
        );

        for (let receiver_id of notification_data.receiver_ids) {
          let task_comment_receiver_data = {
            notification_id: notification_submitted.id,
            company_id: notification_data.company_id ? notification_data.company_id : '',
            model: notification_data.model,
            model_id: notification_data.model_id,
            receiver_id: receiver_id,
            is_read: false,
            read_at: null,
            created_at: new Date(),
            updated_at: new Date(),
          };

          let task_comment_notification_submitted = await module.exports.createData(
            NotificationReceivers,
            task_comment_receiver_data
          );
        }

        let socket = clientIo(constant.SOCKET_ENDPOINT);
        socket.emit('message', { 'loadData': true, client_id: parseInt(notification_data.client_id) });
      }
      return true;
    } catch (error) {
      return false;
    }
  },

  // Add subscribers
  addSubscribers: async (task_id, accountant_id) => {
    try {
      if (task_id && accountant_id) {
        let task_subscriber_data = {
          task_id: task_id,
          user_profile_id: accountant_id,
          created_at: new Date(),
          updated_at: new Date(),
        };

        await module.exports.createData(
          models.NotificationSubscribers,
          task_subscriber_data
        );
      }
      return true;
    } catch (error) {
      return false;
    }
  },

  allowToS3() {
    //return parseInt(constant.ALLOW_TO_S3_STORAGE) > 0 ? true : false
    // return constant.ALLOW_TO_S3_STORAGE;
    return process.env.ALLOW_TO_S3_STORAGE;
  },

  createTaskAssignedNotification(userName, clientId, taskTitle, companyId, senderId, recieverId, modelName, modelId) {
    let title = i18n.__('notification_task_assign_title', { user: userName });
    let description = i18n.__('notification_task_assign_description', { user: userName, task: taskTitle });

    let notification_data = {
      client_id: clientId,
      company_id: companyId,
      title: title,
      description: description,
      type_id: 7,
      type: 'TASK_ASSIGNED',
      sender_id: senderId,
      receiver_ids: [recieverId],
      model: modelName,
      model_id: modelId,
      task_user_profile_id: recieverId
    };
    module.exports.addNotification(notification_data);
  },

  // Get background and font color from alphanet
  getIntials: async (name) => {
    const colorGroup = [
      { alpha: 'A', color: '#e15f51', font: '#f4c3be' },
      { alpha: 'B', color: '#f25f90', font: '#fcd5e2' },
      { alpha: 'C', color: '#bc67cb', font: '#e6c6ec' },
      { alpha: 'D', color: '#9672cf', font: '#ddd2f0' },
      { alpha: 'E', color: '#7984cd', font: '#d6daf0' },
      { alpha: 'F', color: '#5d96f9', font: '#d8e6fe' },
      { alpha: 'G', color: '#7bddea', font: '#e9fafc' },
      { alpha: 'H', color: '#46d0e2', font: '#2297a8' },
      { alpha: 'I', color: '#49b6ad', font: '#2b6d68' },
      { alpha: 'J', color: '#52bc89', font: '#2f7955' },
      { alpha: 'K', color: '#9ace5f', font: '#67982e' },
      { alpha: 'L', color: '#d4e34a', font: '#9eac1a' },
      { alpha: 'M', color: '#f9d715', font: '#a48c04' },
      { alpha: 'N', color: '#fac400', font: '#947400' },
      { alpha: 'O', color: '#ffaa00', font: '#996600' },
      { alpha: 'P', color: '#ff8b61', font: '#fee9e1' },
      { alpha: 'Q', color: '#c2c2c2', font: '#ffffff' },
      { alpha: 'R', color: '#8ea3af', font: '#d9e0e4' },
      { alpha: 'S', color: '#a1877d', font: '#6a554d' },
      { alpha: 'T', color: '#a3a3a3', font: '#e3e3e3' },
      { alpha: 'U', color: '#b0b6e3', font: '#ffffff' },
      { alpha: 'V', color: '#b49cdd', font: '#fdfcfe' },
      { alpha: 'W', color: '#c2c2c2', font: '#ffffff' },
      { alpha: 'X', color: '#7bddea', font: '#e9fafc' },
      { alpha: 'Y', color: '#bcaaa4', font: '#f2efee' },
      { alpha: 'Z', color: '#aed77f', font: '#ecf6e0' },
      { alpha: 'Æ', color: '#FAD0C9', font: '#ffffff' },
      { alpha: 'Ø', color: '#56834e', font: '#f8f9f8' },
      { alpha: 'Å', color: '#f9d66e', font: '#efefed' }
    ];

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const randomCharacter = alphabet[Math.floor(Math.random() * alphabet.length)]

    let initialsData = {
      initials: null,
      bgcolor: null,
      fontcolor: null
    }

    try {
      if (name) {
        let initName = name;
        const firstLetters = await initName
          .split(' ')
          .map(word => word[0])
          .join('');

        const stringLength = firstLetters.length;

        let initials = '';
        if (firstLetters.length == 1) {
          initials += (await name.charAt(0)) + name.charAt(1);
        } else if (firstLetters.length > 1) {
          initials += firstLetters.charAt(0) + firstLetters.charAt(stringLength - 1);
        }

        let colorCodes = await colorGroup.find(f => f.alpha == randomCharacter || f.alpha.toLowerCase() == randomCharacter);
        initialsData = await {
          initials: initials.toUpperCase(),
          bgcolor: colorCodes.color,
          fontcolor: colorCodes.font
        }
      } else {
        initialsData = {
          initials: '',
          bgcolor: '#05a8ba',
          fontcolor: '#ffffff'
        }
      }
      return await initialsData;
    } catch (error) {
      return initialsData;
    }
  },

  /**
   *
   * @param message
   * @param type
   */
  log: (message, type = "error", error = null) => {
    switch (type) {
      case "info":
        debugLogger.info(message);
        break;
      case "debug":
        debugLogger.debug(message);
        break;
      case "warn":
        debugLogger.warn(message);
        break;
      case "error":
        errorLogger.error(message);
        module.exports.sendErrorToSlack(message, error);
        break;
      default:
        errorLogger.error(message);
        module.exports.sendErrorToSlack(message, error);
        break;
    }
  },

  sendErrorToSlack: async (message, error) => {
    if (error) {
      let title = error.name;

      let Full_message = error.name + '<br>';
      Full_message += message + '<br>';
      Full_message += error.message + '<br><br>';
      Full_message += error.stack.split("\n").join("<br>");
      let data = {
        email_id: constant.TASKLINE_SLACK_EMAIL,
        email_sender_name: constant.EMAIL_SENDER_NAME,
        email_sender_email: constant.EMAIL_SENDER_EMAIL,
        email_subject: title,
        email_content: Full_message
      }
      module.exports.sendEmail(data);
    }
  },

  taskDelete: async (task_id, client_id, is_deleted = false) => {

    const get_ref_task = await Tasks.getRefTask(task_id);
    const uploaded_pdf_path = "./public/uploads/comment_files/" + client_id + '/';
    const uploaded_file_path = './public/uploads/task_files/' + client_id + '/';
    let taskData;

    for (let res of get_ref_task) {
      if (is_deleted) {
        taskData = await Tasks.getSingleTaskForDelete(res.id, true);
      } else {
        taskData = await Tasks.getSingleTaskForDelete(res.id);
      }

      if (res.id) {
        const refTaskId = await Tasks.findAll({
          attributes: ['id', 'task_ref_id'],
          where: {
            [Op.or]: [
              {
                id: {
                  [Op.eq]: res.id,
                }
              },
              {
                task_ref_id: {
                  [Op.eq]: res.id,
                }
              }
            ]
          },
          paranoid: false
        });

        for (let j = 0; j < refTaskId.length; j++) {

          let post_date = {
            task_ref_id: null,
          };
          let whereData = {
            where: { id: refTaskId[j].id },
            paranoid: false
          }
          await module.exports.updateData(models.Tasks, post_date, whereData);
        }
      }

      if (taskData && taskData.length > 0) {
        for (let i = 0; i < taskData.length; i++) {
          // first check comment file from s3 and ec2
          if (taskData[i] && taskData[i].commentS3upload > 0) {
            let thumbnailPath = uploaded_pdf_path + taskData[i].filename;
            const fileCheck = fs.existsSync(thumbnailPath);
            const s3_upload_path = taskData[i].commentFilePath;
            module.exports.s3DeleteFile(s3_upload_path);

            // ec2 file sync check
            if (fileCheck) {
              fs.unlink(thumbnailPath, function (err) {
                if (err) return console.log(err);
                console.log('file thumbnailPath deleted successfully');
              });
            }
          }

          // check task file from s3 and ec2
          if (taskData && taskData[i].is_template_id === 0) {
            let thumbfilePath = uploaded_file_path + taskData[i].taskFileName;
            let s3_path = 'public/uploads/task_files/' + client_id + '/' + taskData[i].taskFileName;
            module.exports.s3DeleteFile(s3_path);

            // ec2 file sync check
            if (fs.existsSync(thumbfilePath)) {
              fs.unlink(thumbfilePath, function (err) {
                if (err) return console.log(err);
                console.log('file thumbnailPath deleted successfully');
              });
            }
          }

          if (taskData[i] && taskData[i].id) {
            await TaskFiles.findAll({
              where: { task_id: taskData[i].id },
              paranoid: false
            }).then(async (data) => {
              if (data && data.length > 0) {
                await TaskFiles.destroy({
                  where: {
                    task_id: taskData[i].id,
                  },
                  force: true
                });
              }
            });
          }

          if (taskData[i] && taskData[i].taskDetailId) {
            await TaskCommentFiles.findAll({
              where: { task_details_id: taskData[i].taskDetailId },
              paranoid: false
            }).then(async (data) => {
              if (data && data.length > 0) {
                await TaskCommentFiles.destroy({
                  where: {
                    task_details_id: taskData[i].taskDetailId
                  },
                  force: true
                });
              }
            });
          }

          if (taskData[i] && taskData[i].taskDetailId) {
            await TaskComments.findAll({
              where: { task_detail_id: taskData[i].taskDetailId },
              paranoid: false
            }).then(async (data) => {
              if (data && data.length > 0) {
                for (let file of data) {
                  await TaskCommentFiles.destroy({
                    where: {
                      task_comment_id: file.id
                    },
                    force: true
                  });
                }

                await TaskComments.destroy({
                  where: {
                    task_detail_id: taskData[i].taskDetailId,
                  },
                  force: true
                });
              }
            });
          }

          if (taskData[i] && taskData[i].taskDetailId) {
            await TaskChecklistsStatus.findAll({
              where: { task_details_id: taskData[i].taskDetailId },
              paranoid: false
            }).then(async (data) => {
              if (data && data.length > 0) {
                await TaskChecklistsStatus.destroy({
                  where: {
                    task_details_id: taskData[i].taskDetailId,
                  },
                  force: true
                });
              }
            });
          }

          if (taskData[i] && taskData[i].id) {
            await TaskActivityLogs.findAll({
              where: { task_id: taskData[i].id },
              paranoid: false
            }).then(async (data) => {
              if (data && data.length > 0) {
                await TaskActivityLogs.destroy({
                  where: {
                    task_id: taskData[i].id
                  },
                  force: true
                });
              }
            });
          }

          if (taskData[i] && taskData[i].taskDetailId) {
            await TaskDetails.findAll({
              where: { id: taskData[i].taskDetailId },
              paranoid: false
            }).then(async (data) => {
              if (data && data.length > 0) {
                await TaskDetails.destroy({
                  where: {
                    id: taskData[i].taskDetailId,
                  },
                  force: true
                });
              }
            });
          }
        }
      }
      try {
        await TaskChecklists.findAll({
          where: { task_id: res.id },
          paranoid: false
        }).then(async (data) => {
          if (data && data.length > 0) {
            for (let i = 0; i < data.length; i++) {
              await TaskChecklistsStatus.destroy({
                where: {
                  task_id: res.id,
                  task_checklists_id: data[i].id,
                },
                force: true
              });
            }

            await TaskChecklists.destroy({
              where: {
                task_id: res.id
              },
              force: true
            });
          }

          await Tasks.destroy({
            where: {
              id: res.id,
              task_ref_id: null
            },
            force: true
          });
        });

      } catch (error) {
        console.log('======Error2', error);
      }
    }
  },

  updateTaskEndDate: async (task_id, client_id, taskDate, rec_option) => {
    const get_ref_task = await Tasks.getRefTask(task_id);
    const uploaded_pdf_path = "./public/uploads/comment_files/" + client_id + '/';

    await get_ref_task.forEach(async res => {
      const taskData = await Tasks.getSingleTask(res.id, false);
      for (let i = 0; i < taskData.length; i++) {
        if (taskData[i].commentS3upload > 0) {
          let thumbnailPath = uploaded_pdf_path + taskData[i].filename;
          const fileCheck = fs.existsSync(thumbnailPath);
          const s3_upload_path = taskData[i].commentFilePath;
          module.exports.s3DeleteFile(s3_upload_path);
          if (fileCheck) {
            fs.unlink(thumbnailPath, function (err) {
              if (err) return console.log(err);
              console.log('file thumbnailPath deleted successfully');
            });
          }
          await TaskCommentFiles.destroy({
            where: {
              task_details_id: taskData[i].taskDetailId,
            },
            force: true
          });
        }

        await TaskComments.destroy({
          where: {
            task_detail_id: taskData[i].taskDetailId,
          },
          force: true
        });

        await TaskActivityLogs.destroy({
          where: {
            task_id: taskData[i].id,
          },
          force: true
        });

      }

      const TaskId = await Tasks.findAll({
        attributes: ['id', 'task_ref_id'],
        where: {
          [Op.or]: [
            {
              id: {
                [Op.eq]: res.id,
              }
            },
            {
              task_ref_id: {
                [Op.eq]: res.id,
              }
            }
          ]
        },
      });
      for (let j = 0; j < TaskId.length; j++) {
        let post_date = {
          task_ref_id: null,
        };
        let whereData = {
          where: {
            [Op.or]: [
              {
                id: {
                  [Op.eq]: TaskId[j].id,
                }
              },
              {
                task_ref_id: {
                  [Op.eq]: TaskId[j].id,
                }
              }
            ]
          },
        }
        await module.exports.updateData(models.Tasks, post_date, whereData);
      }
      let task_date = moment(taskDate);
      if (rec_option === 'following_task') {
        const before_day = task_date.subtract(1, 'days').format("YYYY-MM-DD");
        let post_task_data = {
          repeat_end: before_day,
        };

        let where_task_data = {
          where: {
            task_date: {
              [Op.lte]: taskDate ? taskDate : null
            },
            id: res.id,
          },
        };
        await module.exports.updateData(models.Tasks, post_task_data, where_task_data);
      }
      await Tasks.update({
        deleted_at: new Date(),
      },
        {
          where: {
            task_date: {
              [Op.gte]: taskDate ? taskDate : null
            },
            id: res.id,
          },
        });
    });

  },

  fileDelete: async (file) => {

    try {
      let defaultPathWithClientId = defaultPath + file.client_id + '/' + file.path;
      let s3_upload_path = defaultPathWithClientId.replace('./', '');

      let thumbnailPath = file.original_name_path;
      let updateData = {
        s3_upload: 0,
        size: null,
        deleted_by: null,
        deleted_at: new Date(),
      };

      let whereData = {
        where: {
          never_deleted: 0,
          id: file.id
        }
      };
      if (file.is_folder === 0 && file.s3_upload > 0 && file.never_deleted === 0) {
        await module.exports.s3DeleteFile(s3_upload_path);
        if (fs.existsSync(thumbnailPath)) {
          fs.unlink(thumbnailPath, function (err) {
            if (err) return console.log(err);
            console.log('file thumbnailPath deleted successfully');
          });
        }
      }

      // updated all file and folders with deleted by and deleted at
      let response = await module.exports.updateFileData(models.Files, updateData, whereData);

      if (response) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  },

  countDeleteRuleDate: async (rule, date) => {
    let end_date;
    let deleteRuleDate;
    if (date !== null) {
      deleteRuleDate = new Date(date);
    } else {
      deleteRuleDate = new Date();
    }
    if (rule === 'every 1 month') {
      const oneMonthFromNow = deleteRuleDate;
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
      end_date = oneMonthFromNow;
    } else if (rule === 'every 3 month') {
      const threeMonthFromNow = deleteRuleDate;
      threeMonthFromNow.setMonth(threeMonthFromNow.getMonth() + 3);
      end_date = threeMonthFromNow;
    } else if (rule === 'every 6 month') {
      const sixMonthFromNow = deleteRuleDate;
      sixMonthFromNow.setMonth(sixMonthFromNow.getMonth() + 6);
      end_date = sixMonthFromNow;
    } else if (rule === 'every 1 year') {
      const oneYearFromNow = deleteRuleDate;
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      end_date = oneYearFromNow;
    } else if (rule === 'every 5 year') {
      const fiveYearFromNow = deleteRuleDate;
      fiveYearFromNow.setFullYear(fiveYearFromNow.getFullYear() + 5);
      end_date = fiveYearFromNow;
    } else if (rule === 'every 10 year') {
      const tenYearFromNow = deleteRuleDate;
      tenYearFromNow.setFullYear(tenYearFromNow.getFullYear() + 10);
      end_date = tenYearFromNow;
    }
    const deleteDate = moment(end_date, 'yyyy-MM-DD').format('yyyy-MM-DD');
    return deleteDate;
  },

  // for soft delete all task related entry
  softAutoDelete: async (task_id, client_id, is_deleted = false) => {
    const get_ref_task = await Tasks.getRefTask(task_id);
    const uploaded_pdf_path = "./public/uploads/comment_files/" + client_id + '/';
    let taskData;

    for (let res of get_ref_task) {
      if (is_deleted) {
        taskData = await Tasks.getSingleTaskForDelete(res.id, true);
      } else {
        taskData = await Tasks.getSingleTaskForDelete(res.id);
      }

      if (taskData && taskData.length > 0) {
        for (let i = 0; i < taskData.length; i++) {
          // first check comment file from s3 and ec2
          if (taskData[i] && taskData[i].commentS3upload > 0) {
            let thumbnailPath = uploaded_pdf_path + taskData[i].filename;
            const fileCheck = fs.existsSync(thumbnailPath);
            const s3_upload_path = taskData[i].commentFilePath;
            module.exports.s3DeleteFile(s3_upload_path);

            // ec2 file sync check
            if (fileCheck) {
              fs.unlink(thumbnailPath, function (err) {
                if (err) return console.log(err);
                console.log('file thumbnailPath deleted successfully');
              });
            }
          }

          if (taskData[i] && taskData[i].taskDetailId) {
            await TaskCommentFiles.findAll({
              where: { task_details_id: taskData[i].taskDetailId },
              paranoid: false
            }).then(async (data) => {
              if (data && data.length > 0) {
                await TaskCommentFiles.destroy({
                  where: {
                    task_details_id: taskData[i].taskDetailId
                  },
                  force: true
                });
              }
            });
          }

          if (taskData[i] && taskData[i].taskDetailId) {
            await TaskComments.findAll({
              where: { task_detail_id: taskData[i].taskDetailId },
              paranoid: false
            }).then(async (data) => {
              if (data && data.length > 0) {
                await TaskComments.destroy({
                  where: {
                    task_detail_id: taskData[i].taskDetailId,
                  },
                  force: true
                });
              }
            });
          }

          if (taskData[i] && taskData[i].taskDetailId) {
            await TaskChecklistsStatus.findAll({
              where: { task_details_id: taskData[i].taskDetailId },
              paranoid: false
            }).then(async (data) => {
              if (data && data.length > 0) {
                await TaskChecklistsStatus.destroy({
                  where: {
                    task_details_id: taskData[i].taskDetailId,
                  },
                  force: true
                });
              }
            });
          }


          if (taskData[i] && taskData[i].taskDetailId) {
            await TaskDetails.findAll({
              where: { id: taskData[i].taskDetailId },
              paranoid: false
            }).then(async (data) => {
              if (data && data.length > 0) {
                await TaskDetails.update({
                  deleted_at: new Date(),
                }, {
                  where: {
                    is_completed: 1,
                    id: taskData[i].taskDetailId,
                  },
                });
              }
            });
          }
        }
      }
    }
  },

  checkTaskEndDate: async () => {
    const today_date = moment().format("YYYY-MM-DD");
    // get all the tasks where applied delete rule
    const get_tasks = await Tasks.getDeletedRuleAppliedTasks();

    if (get_tasks.length > 0) {
      for (let res of get_tasks) {
        if (res.delete_string && res.repeat_end) {
          let deleteDate = await module.exports.countDeleteRuleDate(res.delete_string, res.repeat_end);

          let post_date = {
            task_ref_id: null,
            date_delete: deleteDate
          };
          let whereData = {
            where: { id: res.id },
            paranoid: false
          }
          await module.exports.updateData(models.Tasks, post_date, whereData);
        }
      }
    }

    // get all the task details where applied delete rule
    const get_task_details = await TaskDetails.getDeletedRuleAppliedTaskDetails(today_date);
    if (get_task_details.length > 0) {
      for (let res of get_task_details) {
        if (res.date_delete <= today_date) {

          let post_data = {
            deleted_at: today_date
          };
          let whereData = {
            where: { id: res.id },
            paranoid: false
          }
          await module.exports.updateData(TaskDetails, post_data, whereData);
        }
      }
    }
  },

  calculatePercentage: async (total, amount) => {

    let value = await (amount * 100 / total);
    return parseFloat(value).toFixed(2)
  },

  getColorDetails: async (color) => {
    let colorData = await COLOR_CODES.find(f => f.code == color);
    return colorData;
  },

  exportHtmlToPdf: async (html, file, options) => {
    return new Promise(async (resolve, reject) => {
      await wkhtmltopdf(html,
        {
          output: file,
          pageSize: 'A4',
          marginTop: 20,
          headerSpacing: 10, // in mm
          footerSpacing: 5, // in mm
          headerHtml: constant.BASE_URL + 'pdf-templates/pdf-header.html',
          footerHtml: constant.BASE_URL + 'pdf-templates/pdf-footer.html'
        },
        (err) => {
          if (err) {
            console.log('in err');
            reject(err);
          }
          resolve(file);
        });
    });
  },

  async generateThumbnail(pdfPath, thumbnailImagePath, filename = '', s3Status = false) {
    let options = { width: 300, quality: 50, height: 450, pagerange: '1-1' };
    let flag = false;
    if (s3Status) {
      pdfPath = await module.exports.getS3SignedUrl(filename);
      flag = !filepreview.generatePreviewImageFromUrl(filename, pdfPath, thumbnailImagePath, options) ? false : true;
    } else {
      flag = !filepreview.generateSync(pdfPath, thumbnailImagePath, options) ? false : true;
    }
    return flag;
  },

  async contractDelete(client_id) {
    const cfMasterId = await models.cf_masters.findAll({
      where: {
        client_id: client_id
      }
    });


    for (let cf of cfMasterId) {
      if (cf && cf.id) {
        await models.CfActivityLogs.findAll({
          where: { cf_master_id: cf.id },
          paranoid: false
        }).then(async (data) => {
          if (data && data.length > 0) {
            await models.CfActivityLogs.destroy({
              where: {
                cf_master_id: cf.id
              },
              force: true
            });
          }
        });
      }

      if (cf && cf.id) {
        await models.cf_attributes.findAll({
          where: { cf_master_id: cf.id },
          paranoid: false
        }).then(async (data) => {
          if (data && data.length > 0) {

            for (let ds of data) {
              await models.cf_installation_data.destroy({
                where: {
                  cf_attribute_id: ds.id
                },
                force: true
              });
            }

            await models.cf_attributes.destroy({
              where: {
                cf_master_id: cf.id
              },
              force: true
            });
          }
        });
      }


      if (cf && cf.id) {
        await models.cf_blocks.findAll({
          where: { cf_master_id: cf.id },
          paranoid: false
        }).then(async (data) => {
          if (data && data.length > 0) {
            for (let ds of data) {
              await models.cf_installation_data.destroy({
                where: {
                  cf_block_id: ds.id
                },
                force: true
              });
            }

            await models.cf_blocks.destroy({
              where: {
                cf_master_id: cf.id
              },
              force: true
            });
          }
        });
      }


      if (cf && cf.id) {
        await models.cf_steps.findAll({
          where: { cf_master_id: cf.id },
          paranoid: false
        }).then(async (data) => {
          if (data && data.length > 0) {
            for (let ds of data) {
              await models.cf_installation_data.destroy({
                where: {
                  cf_step_id: ds.id
                },
                force: true
              });
            }

            await models.cf_steps.destroy({
              where: {
                cf_master_id: cf.id
              },
              force: true
            });
          }
        });
      }

      if (cf && cf.id) {
        await models.cf_installation.findAll({
          attributes: ['id', 'company_id', 'filename'],
          where: { cf_master_id: cf.id },
          paranoid: false
        }).then(async (data) => {
          if (data && data.length > 0) {
            for (let ds of data) {
              // if (ds.filename) {
              //   const url = 'public/uploads/contract-form-pdfs/' + client_id + "/" + ds.company_id + "/merged/" + ds.filename;
              //   await module.exports.s3DeleteFile(url);
              // }
              await models.CfActivityLogs.destroy({
                where: {
                  cf_installation_id: ds.id
                },
                force: true
              });

              await models.cf_installation_data.destroy({
                where: {
                  cf_installation_id: ds.id
                },
                force: true
              });

              await models.Signers.destroy({
                where: {
                  cf_installation_id: ds.id
                },
                force: true
              });
            }
          }
        });

        await models.cf_installation.destroy({
          where: {
            cf_master_id: cf.id
          },
          force: true
        });

      }
    }

    await models.cf_masters.destroy({
      where: {
        client_id: client_id
      },
      force: true
    });
  },

  deleteFilesFromS3: async (client_id) => {

    try {
      // Remove File archive files from S3 bucket
      let defaultPathWithClientId = constant.DEFAULT_FILES_PATH + client_id + '/';
      let s3_upload_path = defaultPathWithClientId.replace('./', '');

      let thumbnailPath = constant.DEFAULT_FILES_PATH + 'thumbnails/' + client_id;
      let s3_thumbnails_path = thumbnailPath.replace('./', '');


      let isFolderAvailable = fs.existsSync(s3_thumbnails_path);
      if (client_id && client_id > 0) {
        // Remove file
        await module.exports.s3DeleteFolder(s3_upload_path);
        if (isFolderAvailable) {
          rimraf(s3_thumbnails_path, function (err) {
            if (err) {
              module.exports.log(`${404} - ${'Utils ' + 'deleteFilesFromS3'} - ${err}`, 'error');
            } else {
              module.exports.log(`${client_id} - File thumbnails deleted successfully`, 'debug');
            }
          });
        }
        // Remove task comment files
        let task_comment_path = "./public/uploads/comment_files/" + client_id + '/';
        module.exports.log(`${client_id} - task_comment_path File deleted successfully`, 'debug');

        await module.exports.s3DeleteFolder(task_comment_path);
        module.exports.log(`${client_id} - task_comment_path File deleted successfully`, 'debug');

        // Remove task files
        let task_file_path = './public/uploads/task_files/' + client_id + '/';
        await module.exports.s3DeleteFolder(task_file_path);
        module.exports.log(`${client_id} - task_file_path File deleted successfully`, 'debug');

        // Remove contract files
        let contract_file_path = './public/uploads/contract-form-pdfs/' + client_id + "/";
        let contract_signed_file_path = './public/uploads/contract-form-signed/' + client_id + "/";
        let contract_task_file_path = './public/uploads/contract-form-task-files/' + client_id + "/";
        await module.exports.s3DeleteFolder(contract_file_path);
        module.exports.log(`${client_id} - contract_file_path File deleted successfully`, 'debug');

        await module.exports.s3DeleteFolder(contract_signed_file_path);
        module.exports.log(`${client_id} - contract_signed_file_path File deleted successfully`, 'debug');

        await module.exports.s3DeleteFolder(contract_task_file_path);
        module.exports.log(`${client_id} - contract_task_file_path File deleted successfully`, 'debug');

        // Remove qa-form files
        let qa_file_path = './public/uploads/qa-form-pdfs/' + client_id + "/";
        let qa_forms_file_path = './public/uploads/qa-forms/' + client_id + "/";
        await module.exports.s3DeleteFolder(qa_file_path);
        module.exports.log(`${client_id} - qa_file_path File deleted successfully`, 'debug');

        await module.exports.s3DeleteFolder(qa_forms_file_path);
        module.exports.log(`${client_id} - qa_forms_file_path File deleted successfully`, 'debug');

        // Remove qa-form files
        let ra_file_path = './public/uploads/risk-assessment-forms/' + client_id + "/";
        await module.exports.s3DeleteFolder(ra_file_path);
        module.exports.log(`${client_id} - ra_file_path File deleted successfully`, 'debug');

        // Remove Signature files
        let esign_file_path = './public/uploads/signatures/' + client_id + "/";
        let esign_signed_file_path = './public/uploads/signatures-signed/' + client_id + "/";
        await module.exports.s3DeleteFolder(esign_file_path);
        module.exports.log(`${client_id} - esign_file_path File deleted successfully`, 'debug');

        await module.exports.s3DeleteFolder(esign_signed_file_path);
        module.exports.log(`${client_id} - esign_signed_file_path File deleted successfully`, 'debug');

        // Remove Template PDF
        let template_file_path = './public/uploads/template-pdfs/' + client_id + "/";
        await module.exports.s3DeleteFolder(template_file_path);
        module.exports.log(`${client_id} - template_file_path File deleted successfully`, 'debug');
      }

      if (isFolderAvailable) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      module.exports.log(`${404} - ${'Utils ' + 'deleteFilesFromS3'} - ${error}`, 'error');
      return false;
    }
  },

  /**
   * Delete s3 object
   * @param {string} key
   * @returns
   */
  s3DeleteFolder: async (key) => {
    try {

      key = key.replace('//', '/');
      key = key.replace('./', '');
      const s3 = module.exports.awsS3Config();

      let params = {
        Bucket: BUCKET_NAME,
        Prefix: key,
        MaxKeys: 1000
      };
      let allKeys = [];
      s3.listObjectsV2(params, function (err, data) {
        if (err) {
          console.log(err, err); // an error occurred
          module.exports.log(`${key} - File not found - ${err}`, 'error');
          return false;
        } else {
          let contents = data.Contents;
          contents.forEach(function (content) {
            allKeys.push({ Key: content.Key });
          });

          if (data.IsTruncated) {
            params.ContinuationToken = data.NextContinuationToken;
            console.log("get further list...");
            s3DeleteFolder(key);
          }
          if (allKeys && allKeys.length > 0) {
            let deleteParams = { Bucket: BUCKET_NAME, Delete: { Objects: allKeys } };

            s3.deleteObjects(deleteParams, function (err) {
              if (err) {
                console.log(err);
                module.exports.log(`${key} - File not found - ${err}`, 'error');
                return false;
              } else {
                module.exports.log(`${key} - File deleted successfully`, 'debug');
                console.log('File deleted successfully');
                return true;
              }
            });
          }
        }
      });
    } catch (error) {
      return false;
    }
  },

  checkNumberExists: async (TimesheetClassModel, number) => {
    try {
      const existingRecord = await TimesheetClassModel.findOne({
        where: {
          number: number,
          deleted_at: null
        }
      });

      return existingRecord !== null;
    } catch (error) {
      // Handle error or throw it to the calling function
      throw error;
    }
  },

  createDefaultTimesheetClassAndSetting: async (client_id, clone_client_id) => {

    const timesheet_classes_data = await models.TimesheetClass.getAllList(clone_client_id);

    const setting_data = await models.timesheet_settings.findOne({
      where: {
        client_id: clone_client_id,
      }
    });

    for (let ele of timesheet_classes_data) {
      let category_data = await Category.findOne({ where: { name: ele.category_name, parent_id: { [Op.ne]: 0 }, client_id: client_id } });

      if (category_data) {
      let post_class_data = {
        client_id: client_id,
        category_id: category_data.id,
        number: ele.number,
        name: ele.name,
        type: ele.type,
        tax_rate: ele.tax_rate,
        created_at: new Date(),
        updated_at: new Date()
      }
      await module.exports.createData(
        models.TimesheetClass,
        post_class_data
      );
      }
    }

    if (setting_data) {
      let post_setting_data = {
        client_id: client_id,
        hourly_rate: setting_data.hourly_rate,
        min_working_hrs: setting_data.min_working_hrs,
        rounding_min: setting_data.rounding_min,
        rounding_ratio: setting_data.rounding_ratio,
        allow_stopwatch: setting_data.allow_stopwatch,
        created_at: new Date(),
        updated_at: new Date()
      }
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> post_setting_data', post_setting_data,'<<<<<<<<<<<<<<<<<<<<<<<<<<<<');

      await module.exports.createData(
        models.timesheet_settings,
        post_setting_data
      );
    }

    return new Promise(async (resolve, reject) => {
      try {
        resolve(true);
      } catch (err) {
        console.log(err);
        reject(false);
      }
    })
  },

  updateUsersData: async (data) => {

    let existing_user_data = await models.Users.findOne({
      where: {
        ssn: data.ssn
      },
    })

    if (existing_user_data) {
      const user_profile_data = {
        user_id: existing_user_data.id,
      };

      let profile_where_data = {
        where: {
          user_id: data.user_id,
        },
      };

      await module.exports.updateData(models.UserProfile, user_profile_data, profile_where_data);

    } else {

      const user_data = {
        ssn: data.ssn,
      };

      let where_data = {
        where: {
          id: data.user_id,
        },
      };

      await module.exports.updateData(models.Users, user_data, where_data);
    }
    const active_data = {
      is_activated: 1
    };

    let active_where_data = {
      where: {
        id: data.id,
      },
    };

    await module.exports.updateData(models.UserActivationUrls, active_data, active_where_data);
  },

  createReviewTemplates: async (client_id, clone_client_id) => {

      const timesheet_review_rule_data = await models.ReviewRule.getMasterList(clone_client_id);

      if (timesheet_review_rule_data?.length > 0) {
        for (let rule of timesheet_review_rule_data) {
          const data = {
            client_id: client_id,
            name: rule.name,
            description: rule.description,
            created_at: new Date(),
            updated_at: new Date()
          };
          let submited_master_rule = await models.MasterReviewRule.create(data);

          await models.ReviewRule.getReviewRulesList(rule.id).then(async (reviewRules) => {

            if (reviewRules?.length > 0) {
              for (let rr of reviewRules) {
                let category_data = await Category.findOne({
                  where: {
                    client_id: client_id,
                    name: rr.category_name,
                    parent_id: {
                      [Op.ne]: 0
                    }
                  }
                })
               
                if (category_data) {
                const data = {
                  category_id: category_data.id,
                  min_per: rr.min_per,
                  min_number: rr.min_number,
                  master_review_rule_id: submited_master_rule.id
                };
                await models.ReviewRule.create(data);
                }
              }
            }
          });

        }
      }

    return new Promise(async (resolve, reject) => {
      try {
        resolve(true);
      } catch (err) {
        console.log(err);
        reject(false);
      }
    })
  },

  createTextTemplates : async (client_id, clone_client_id) => {
    try {
      const textTemplateData = await models.TextTemplate.getAllTemplatesOfClients(clone_client_id);

      if (textTemplateData.length > 0) {
        // Map to store the mapping between original template IDs and newly created template IDs
        const idMap = {};

        for (const template of textTemplateData) {
          // Determine the new parent_id based on the mapping
          const newParentId = idMap[template.parent_id] || 0;

          const postTextTemplateData = {
            client_id: client_id,
            title: template.title,
            description: template.description,
            parent_id: newParentId,
            is_group: template.is_group,
            created_at: new Date(),
            updated_at: new Date(),
          };

          const createdTemplate = await module.exports.createData(models.TextTemplate, postTextTemplateData);

          // Update the idMap with the mapping between original and new template IDs
          idMap[template.id] = createdTemplate.id;
        }
      }

      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  },

  createDefaultTags: async (client_id, clone_client_id) => {

    const timesheet_tags_data = await models.Tags.getAllList(clone_client_id);

    if (timesheet_tags_data?.length > 0) {
      for (let ele of timesheet_tags_data) {

        let post_tags_data = {
          client_id: client_id,
          name: ele.name,
          sort_oder: 0,
          bgcolor: ele.bgcolor,
          fontcolor: ele.fontcolor,
          bordercolor: ele.bordercolor,
          created_at: new Date(),
          updated_at: new Date()
        }
        await module.exports.createData(
          models.Tags,
          post_tags_data
        );
      }
    }

    return new Promise(async (resolve, reject) => {
      try {
        resolve(true);
      } catch (err) {
        console.log(err);
        reject(false);
      }
    })
  },

  uploadFileOnS3: async (filePath, key) => {
    const newPath = filePath.replace(/^\/public/, 'public');
    // Read the file
    const fileContent = fs.readFileSync(newPath);

    const s3Client = new S3({
      region: REGION,
      credentials: {
        accessKeyId: ID,
        secretAccessKey: SECRET,
      },
    });

    // Upload the file to S3
    const params = {
      Bucket: BUCKET_NAME,
      Key: key, // specify the new path here
      Body: fileContent,
    };

    try {
      const data = await s3Client.send(new PutObjectCommand(params));
      console.log('File uploaded successfully:', data);
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },


};
