const constants = require("../config/constant");
const models = require("../models");
const functions = require("./function");
const moment = require("moment");

module.exports = {

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
		})
	 },

	clientadminLogActivity: async (client_id, user_id, action, action_for, action_for_id, action_for_name, notes,user_profile_id,user_name, action_reference = null) => {
		//if (constants.ALLOW_ACTIVITY_LOG) {
			let userLog = {
				role: 'accountantadmin',
				user_id: user_id,
				user_name: user_name,
				user_profile_id: user_profile_id,
				client_id: client_id,
				action: action,
				action_for: action_for,
				action_for_id: action_for_id,
				action_for_name: action_for_name,
				notes: notes,
				action_reference: action_reference,
				created_at: new Date(),
				updated_at: new Date(),
			};
			await module.exports.createLog(
				models.user_logs,
				userLog
			);
		//}
	},

	filesLogActivity: async (role, user_id, user_name, user_profile_id, action, file_id, file_name, notes = null) => {
		// if (constants.ALLOW_ACTIVITY_LOG) {

			const fileLog = {
				role: role,
				user_id: user_id,
				user_name: user_name,
				user_profile_id: user_profile_id,
				action: action,
				file_id: file_id,
				file_name: file_name,
				notes: notes ? notes : action,
				created_at: new Date(),
				updated_at: new Date()
			};

			await module.exports.createLog(
				models.FileLogs,
				fileLog
			);

			await models.Files.update({
				updated_at: new Date(),
				updated_by: user_profile_id
			  },{
				where: {
					id:file_id
				}
			  });

			return true;
	},

	taskLogActivity: async (client_id,role, user_id, user_name, user_profile_id, action, task_id, task_name, notes, task_details_id) => {
		//if (constants.ALLOW_ACTIVITY_LOG) {
			let taskLog = {
				role: role,
				user_id: user_id,
				user_name: user_name,
				user_profile_id: user_profile_id,
				action: action,
				task_id: task_id,
				task_name: task_name,
				notes: notes,
				created_at: new Date(),
				updated_at: new Date(),
				task_details_id: task_details_id ? task_details_id : null,
			};
			
			const log = await module.exports.createLog(
				models.task_logs,
				taskLog
			);
		//}
	},

	taskLogActivityFromOld: async (client_id,role, user_id, user_name, user_profile_id, action, task_id, task_name, notes,created_at, task_detail_id = null) => {
		//if (constants.ALLOW_ACTIVITY_LOG) {
			let taskLog = {
				role: role,
				user_id: user_id,
				user_name: user_name,
				user_profile_id: user_profile_id,
				action: action,
				task_id: task_id,
				task_name: task_name,
				notes: notes,
				created_at: created_at,
				updated_at: created_at,
				task_details_id: task_detail_id
			};
			const log = await module.exports.createLog(
				models.task_logs,
				taskLog
			);
		//}
	},

	signatureLogActivity: async (role, user_id, user_name, user_profile_id, action, signature_id, notes) => {
		let signatureLog = {
			role: role,
			user_id: user_id,
			user_profile_id: user_profile_id,
			user_name: user_name,
			action: action,
			data_id: signature_id,
			notes: notes,
			created_at: new Date(),
			updated_at: new Date()
		};
		await module.exports.createLog(models.SignatureLogs, signatureLog);
	},

	contractLogActivity: async (user_id, user_name, user_profile_id, action, installation_id, notes, master_id = null) => {
		let contrsctLog = {
			user_id: user_id,
			user_profile_id: user_profile_id,
			user_name: user_name,
			action: action,
			cf_installation_id: installation_id,
			cf_master_id: master_id,
			notes: notes,
			created_at: new Date(),
			updated_at: new Date()
		};
		await module.exports.createLog(models.CfActivityLogs, contrsctLog);
	},

	qaLogActivity: async (user_id, user_name, user_profile_id, action, installation_id, notes, master_id = null) => {
		let contrsctLog = {
			user_id: user_id,
			user_profile_id: user_profile_id,
			user_name: user_name,
			action: action,
			qa_installation_id: installation_id,
			qa_master_id: master_id,
			notes: notes,
			created_at: new Date(),
			updated_at: new Date()
		};
		
		await module.exports.createLog(models.qa_activity_logs, contrsctLog);
	},

	systemLogActvity: async (client_id, company_id, module_name, module_id, notes) => {
		let systemLog = {
			client_id: client_id,
			for_company: company_id,
			module_name: module_name,
			module_id: module_id,
			notes: notes,
			created_at: new Date(),
		};
		await module.exports.createLog(
			models.SystemLogs,
			systemLog
		);
	},

}
