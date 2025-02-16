const models = require("../models");
const Files = models.Files;
const TaskFiles = models.taskFiles;
const TaskCommentFiles = models.TaskCommentFiles;
const utils = require("./function");

// var AWS = require('aws-sdk');
var S3 = require('@aws-sdk/client-s3');

S3.config.update({ region: 'us-west-2' });
const path = require('path');
const constant = require("../config/constant");

const ID = constant.S3_BUCKET_ID;
const SECRET = constant.S3_BUCKET_SECRET;

// The name of the bucket that you have created
const BUCKET_NAME = constant.S3_BUCKET_NAME;

module.exports = {

  getFilesFunction: async () => {

    await Files.getListWithRecursive(0, null, false, null).then(async data => {
      console.log("Files Cron Job Every Second.......", data);
      for (let ff of data) {
        await module.exports.uploadFiles(ff, 'files');
      }
    });

    await TaskFiles.findAll({
      raw: true,
      attributes: ['id', 'filename', 'client_id', 'company_id'],
      where: {
        s3_upload: 0
      }
    }).then(async data => {
      console.log("TaskFiles Cron Job Every Second.......", data);
      for (let tf of data) {
        await module.exports.uploadFiles(tf, 'task_files');
      }
    });

    await TaskCommentFiles.findAll({
      raw: true,
      attributes: ['id', 'filename', 'client_id', 'company_id'],
      where: {
        s3_upload: 0
      }
    }).then(async data => {
      console.log("TaskCommentFiles Cron Job Every Second.......", data);
      for (let tc of data) {
        await module.exports.uploadFiles(tc, 'comment_files');
      }
    });
  },

  // function for uploading files from local server to S3 Bucket
  uploadFiles: async (file, type) => {
    let downloadPath;
    let file_new;
    const s3 = new S3({
      accessKeyId: ID,
      secretAccessKey: SECRET
    });

    const fs = require('fs');
    if (type == 'files') {

      downloadPath = await path.resolve('public/uploads/files/' + file.client_id + '/' + file.actual_path + '/' + file.filepath);
      file_new = (await file.client_id) + '/' + file.company_id + '/files/' + file.actual_path + '/' + file.filepath;
    } else if (type == 'task_files') {
      downloadPath = await path.resolve('public/uploads/task_files/' + file.filename);
      file_new = (await file.client_id) + '/' + file.company_id + '/task_files/' + file.filename;
    } else if (type == 'comment_files') {
      downloadPath = await path.resolve('public/uploads/comment_files/' + file.filename);
      file_new = (await file.client_id) + '/' + file.company_id + '/comment_files/' + file.filename;
    } else {
      downloadPath = '';
    }

    let isFile = await path.extname(downloadPath);
    if (isFile != '') {
      //file_new = await file.client_id + '/' + file.company_id + '/' + file.filename;
      const fileContent = fs.readFileSync(downloadPath);
      //Setting up S3 upload parameters
      const params = {
        Bucket: BUCKET_NAME,
        Key: file_new, // File name you want to save as in S3
        Body: fileContent
      };

      //Uploading files to the bucket
      await s3.upload(params).promise();
      console.log(`File uploaded successfully. ${downloadPath}`);

      await module.exports.updateBucketFlag(file.id, type);
    } else {
      console.log('Its Folder.............', file, type);
    }
  },

  updateBucketFlag: async (file_id, type) => {
    let post_data = {
      s3_upload: 1
    };

    let where_data = {
      where: {
        id: file_id,
      },
    };

    if (type == 'files') {
      await utils.updateData(models.Files, post_data, where_data);
      //await fs.unlink(downloadPath,function(err){ });
    } else if (type == 'task_files') {
      await utils.updateData(models.taskFiles, post_data, where_data);
      //await fs.unlink(downloadPath,function(err){ });
    } else if (type == 'comment_files') {
      await utils.updateData(models.TaskCommentFiles, post_data, where_data);
      //await fs.unlink(downloadPath,function(err){ });
    } else {
      // downloadPath = '';
      console.log('==== file_id: ', file_id);
    }
  }
};