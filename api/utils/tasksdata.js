const models = require("../models");
// const constants = require("../config/constant");
const TaskDetails = models.TaskDetails;
const moment = require("moment");
const utils = require("../utils/function");
const Tasks = models.Tasks;
const TaskChecklists = models.task_checklists;
const TaskChecklistsStatus = models.task_checklists_status;
let { RRule } = require('rrule');

// moment.updateLocale('nb');

module.exports = {

    getOverDueTasksNew: async (today_date, start_date, client_id, split_by_comma, status_comp_id, status, user_profile_id, all, comapny, accessibleCompanies) => {
        let new_pending_task = [];

        let accessible_comm = String(accessibleCompanies);
        let taskDetails = await TaskDetails.getOverDueTasks(today_date, start_date, client_id, split_by_comma, status_comp_id, status, user_profile_id, all, comapny, accessible_comm);

        for (let ptsk of taskDetails) {

            const task_files = await Tasks.getTaskFiles(ptsk.id, ptsk.company_id, ptsk.task_ref_id);
            let task_checklists = await TaskChecklists.getTaskCheckListCount(ptsk.task_id);
            let task_checklists_count = await task_checklists.filter(ff => ff.deleted_at == null).map(m => m.id);
            let task_checklists_status_count = await TaskChecklistsStatus.getTaskCheckListStatusCount(ptsk.task_id, ptsk.id);

            let checklist_count_completed = [];

            for (let tcc of task_checklists) {
                if (tcc.deleted_at == null) {
                    for (let tcsc of task_checklists_status_count) {
                        if (tcsc.task_checklists_id == tcc.id) {
                            checklist_count_completed.push(tcc);
                        }
                    }
                } else {
                    checklist_count_completed.push(tcc);
                }
            }
            checklist_count_completed = checklist_count_completed.map(m => m.id);
            let difference_check = task_checklists_count.filter(x => !checklist_count_completed.includes(x));

            let pending_task = {
                id: ptsk.id,
                task_id: ptsk.task_id,
                task_detail_id: ptsk.id,
                title: ptsk.title,
                status_id: ptsk.status_id,
                status: ptsk.status,
                color_code: ptsk.color_code,
                category_color: ptsk.category_color,
                state: ptsk.state ? ptsk.state : 'open',
                user_profile_id: ptsk.user_profile_id,
                accountant_name: ptsk.accountant_name,
                accountant_photo: ptsk.accountant_photo,
                category_id: ptsk.category_id ? ptsk.category_id : null,
                category_name: ptsk.category_name,
                company_id: ptsk.company_id,
                company_name: ptsk.company_name,
                company_logo: ptsk.company_logo,
                note: ptsk.note,
                is_repeat: ptsk.is_repeat,
                task_start_date: ptsk.task_start_date,
                task_end_date: ptsk.task_end_date,
                repeat_freq: ptsk.repeat_freq,
                comments: 0,
                task_date: moment(ptsk.task_date).format('YYYY-MM-DD'),
                task_date_short: moment(ptsk.task_date).format('D. MMM').toLowerCase(),
                deleted_at: ptsk.deleted_at,
                repeat_string: ptsk.repeat_string,
                is_completed: 0,
                task_files: task_files,
                task_checklists_count: difference_check,
                task_checklists_status_count: checklist_count_completed ? checklist_count_completed : [],
                initials: ptsk.initials,
                fontcolor: ptsk.fontcolor,
                bgcolor: ptsk.bgcolor,
                company_initials: ptsk.company_initials,
                company_fontcolor: ptsk.company_fontcolor,
                company_bgcolor: ptsk.company_bgcolor,
                review_color_code: "#FFFFFF",
                review_status: 0,
                review_status_name: "status-not-review",
                date_delete: ptsk.date_delete,
                delete_string: ptsk.delete_string,
                category_fontcolor: ptsk.category_fontcolor,
                category_bordercolor: '1px solid ' + ptsk.category_bordercolor,
                status_fontcolor: ptsk.status_fontcolor,
                status_bordercolor: '1px solid ' + ptsk.status_bordercolor,
                company_archive_flag: ptsk.archive_flag
            };
            new_pending_task.push(pending_task);

        }
        return new_pending_task;
    },

    addedOverdueTasks: async (pending_task) => {
        try {

            for (let tsks of pending_task) {
                if (tsks.task_detail_id == null) {
                    const get_data = await Tasks.getSingleTask(tsks.task_id, false);
                    const get_task = await get_data[0];
                    let dateDelete;
                    const today_date = moment().format("YYYY-MM-DD");
                    if (get_task.categoryDeleteRule !== null) {
                        dateDelete = await utils.countDeleteRuleDate(get_task.categoryDeleteRule, today_date);
                    }
                    let task_details_data = {
                        task_id: get_task.id,
                        client_id: get_task.client_id,
                        user_profile_id: get_task.user_profile_id,
                        company_id: get_task.company_id,
                        category_id: get_task.category_id,
                        title: get_task.title,
                        note: get_task.note,
                        task_date: tsks.task_date,
                        status_id: tsks.status_id,
                        created_at: new Date(),
                        updated_at: new Date(),
                        date_delete: dateDelete ? dateDelete : null,
                    };

                    await utils.createData(
                        models.TaskDetails,
                        task_details_data
                    );

                } else {
                    let post_data;

                    if (!tsks.date_delete) {
                        const task_details_before = await TaskDetails.getSingleTask(tsks.task_detail_id);
                        let dateDelete;
                        const today_date = moment().format("YYYY-MM-DD");
                        if (task_details_before[0].delete_string !== null) {
                            dateDelete = await utils.countDeleteRuleDate(task_details_before[0].delete_string, today_date);
                        }

                        post_data = {
                            updated_at: new Date(),
                            date_delete: dateDelete ? dateDelete : null,
                        };

                        let where_data = {
                            where: {
                                id: tsks.task_detail_id,
                            },
                        };

                        await utils.updateData(models.TaskDetails, post_data, where_data);
                    }
                }
            }
            return true;
        } catch (error) {
            console.log('Error', error);
            return false;
        }
    },

    getOverDueTasksOld: async (tasks_data, all, status_comp_id, company_ids) => {
        let new_pending_task = [];
        const today = moment();
        const today_date = today.format("YYYY-MM-DD");
        const yesterday = today.subtract(1, 'days').format("YYYY-MM-DD 00:00:00");
        try {
            if (tasks_data && tasks_data.length > 0) {
                for (let ptsk of tasks_data) {
                    const task_files = await Tasks.getTaskFiles(ptsk.id, ptsk.company_id, ptsk.task_ref_id);
                    let task_checklists = await TaskChecklists.getTaskCheckListCount(ptsk.id);
                    let task_checklists_count = await task_checklists.filter(ff => ff.deleted_at == null);
                    let p_all_dates = [];
                    if (ptsk.is_repeat == 1 && ptsk.repeat_string) {

                        let options;
                        try {
                            options  = RRule.parseText(ptsk.repeat_string);
                          } catch (err){
                              utils.log('Incorrect repeat string ' + ptsk.repeat_string, 'debug');
                          }
                        let arrayOfOccurence;
                        if (options) {
                            //options.tzid = 'Europe/Oslo';
                            // options.dtstart = new Date(moment(ptsk.task_date).format());
                            // options.until = new Date(yesterday);
                            options.dtstart = moment.utc(ptsk.task_date).toDate();
                            options.until = moment.utc(yesterday).toDate();
                            //options.interval = ptsk.repeat_interval;
                            var rule = new RRule(options);
                            arrayOfOccurence = await rule.all();
                            for (let occurence of arrayOfOccurence) {
                                //  const checkData = await TaskDetails.checkTaskDetailsWithStatus(ptsk.id,moment(occurence).format('YYYY-MM-DD'),status_comp.id);
                                //  if(checkData.length > 0){
                                //    if(checkData[0].status_id != status_comp.id){
                                //     checkData[0].task_detail_id = checkData[0].id
                                //     checkData[0].task_date_short = moment(checkData[0].task_date).format('DD. MMM').toLowerCase()
                                //     new_pending_task.push(checkData[0]);
                                //    }
                                //  }else{
                                p_all_dates.push(moment(occurence).format('YYYY-MM-DD'));
                                if (ptsk.task_end_date >= moment(occurence).format('YYYY-MM-DD') || ptsk.task_end_date == null) {
                                    let pending_task = {
                                        id: null,
                                        task_id: ptsk.id,
                                        task_detail_id: null,
                                        title: ptsk.title,
                                        status_id: ptsk.status_id,
                                        status: ptsk.status,
                                        color_code: ptsk.color_code,
                                        category_color: ptsk.category_color,
                                        state: ptsk.state ? ptsk.state : 'open',
                                        user_profile_id: ptsk.user_profile_id,
                                        accountant_name: ptsk.accountant_name,
                                        accountant_photo: ptsk.accountant_photo,
                                        category_id: ptsk.category_id ? ptsk.category_id : null,
                                        category_name: ptsk.category_name,
                                        company_id: ptsk.company_id,
                                        company_name: ptsk.company_name,
                                        company_logo: ptsk.company_logo,
                                        note: ptsk.note,
                                        is_repeat: ptsk.is_repeat,
                                        task_start_date: ptsk.task_start_date,
                                        task_end_date: ptsk.task_end_date,
                                        repeat_freq: ptsk.repeat_freq,
                                        comments: 0,
                                        task_date: moment(occurence).format('YYYY-MM-DD'),
                                        task_date_short: moment(occurence).format('D. MMM').toLowerCase(),
                                        deleted_at: ptsk.deleted_at,
                                        repeat_string: ptsk.repeat_string,
                                        is_completed: 0,
                                        task_files: task_files,
                                        task_checklists_count: task_checklists_count.length,
                                        task_checklists_status_count: 0,
                                        old_user_profile_id: ptsk.id,
                                        initials: ptsk.initials,
                                        fontcolor: ptsk.fontcolor,
                                        bgcolor: ptsk.bgcolor,
                                        company_initials: ptsk.company_initials,
                                        company_fontcolor: ptsk.company_fontcolor,
                                        company_bgcolor: ptsk.company_bgcolor,
                                        review_color_code: "#FFFFFF",
                                        review_status: 0,
                                        review_status_name: "status-not-review"
                                    };
                                    new_pending_task.push(pending_task);
                                }
                            }
                            if (ptsk.details_counts > 0) {
                                // Getting all data from task details if have similar dates enties
                                if (p_all_dates.length > 0) {

                                    // let taskDetails = await module.exports.getTaskDetails(ptsk.id, p_all_dates);
                                    let taskDetails = await TaskDetails.getTaskDetailsListNew(ptsk.id, p_all_dates);

                                    for (let tdetail of taskDetails) {

                                        let task_checklists_status_count = await TaskChecklistsStatus.getTaskCheckListStatusCount(tdetail.task_id, tdetail.id);

                                        let checklist_count = 0;
                                        for (let tcc of task_checklists) {
                                            if (tcc.deleted_at != null) {
                                                for (let tcsc of task_checklists_status_count) {
                                                    if (tcsc.task_checklists_id == tcc.id) {
                                                        checklist_count++;
                                                    }
                                                }
                                            } else {
                                                checklist_count++;
                                            }
                                        }

                                        // comment code because of edit task not getting in list - krunal
                                        //  let same_data_index = await new_pending_task.findIndex(f => f.task_date == tdetail.task_date && f.title == tdetail.title);
                                        let same_data_index = await new_pending_task.findIndex(f => f.task_date == tdetail.task_date && f.task_id == tdetail.task_id);
                                        // if (tdetail.is_completed == 1 || tdetail.deleted_at != null) {
                                        // new_pending_task[same_data_index] = ''
                                        // new_pending_task.splice(same_data_index, 1);
                                        // } else {
                                        if (same_data_index > -1) {
                                            new_pending_task[same_data_index].id = tdetail.id;
                                            new_pending_task[same_data_index].task_detail_id = tdetail.id;
                                            new_pending_task[same_data_index].title = tdetail.title;
                                            new_pending_task[same_data_index].status_id = tdetail.status_id;
                                            new_pending_task[same_data_index].status = tdetail.status;
                                            new_pending_task[same_data_index].color_code = tdetail.color_code;
                                            new_pending_task[same_data_index].category_color = tdetail.category_color;
                                            new_pending_task[same_data_index].state = tdetail.state;
                                            new_pending_task[same_data_index].user_profile_id = tdetail.user_profile_id;
                                            new_pending_task[same_data_index].accountant_name = tdetail.accountant_name;
                                            new_pending_task[same_data_index].accountant_photo = tdetail.accountant_photo;
                                            new_pending_task[same_data_index].category_id = tdetail.category_id ? tdetail.category_id : null;
                                            new_pending_task[same_data_index].category_name = tdetail.category_name;
                                            new_pending_task[same_data_index].company_id = tdetail.company_id;
                                            new_pending_task[same_data_index].company_name = tdetail.company_name;
                                            new_pending_task[same_data_index].company_logo = tdetail.company_logo;
                                            new_pending_task[same_data_index].note = tdetail.note;
                                            new_pending_task[same_data_index].is_repeat = tdetail.is_repeat;
                                            new_pending_task[same_data_index].task_start_date = tdetail.task_start_date;
                                            new_pending_task[same_data_index].task_end_date = tdetail.task_end_date;
                                            new_pending_task[same_data_index].repeat_freq = tdetail.repeat_freq;
                                            new_pending_task[same_data_index].comments = tdetail.comments;
                                            new_pending_task[same_data_index].task_date = tdetail.task_date;
                                            new_pending_task[same_data_index].task_date_short = moment(tdetail.task_date).format('D. MMM').toLowerCase();
                                            new_pending_task[same_data_index].deleted_at = tdetail.deleted_at;
                                            new_pending_task[same_data_index].is_completed = tdetail.is_completed;
                                            new_pending_task[same_data_index].task_checklists_count = checklist_count;
                                            new_pending_task[same_data_index].task_checklists_status_count = task_checklists_status_count.length;
                                            new_pending_task[same_data_index].old_user_profile_id = ptsk.id;
                                            new_pending_task[same_data_index].initials = tdetail.initials;
                                            new_pending_task[same_data_index].bgcolor = tdetail.bgcolor;
                                            new_pending_task[same_data_index].fontcolor = tdetail.fontcolor;
                                            new_pending_task[same_data_index].company_initials = ptsk.company_initials;
                                            new_pending_task[same_data_index].company_fontcolor = ptsk.company_fontcolor;
                                            new_pending_task[same_data_index].company_bgcolor = ptsk.company_bgcolor;
                                        }
                                        // }
                                    }
                                }
                            }
                        }

                    } else {
                        // Fetch single day from task details if have similar date entry
                        // changes start_date to today_date
                        if (ptsk.is_repeat == 0 && ptsk.task_start_date < today_date) {

                            let checkData = await TaskDetails.checkTaskDetailsWithStatusNew(ptsk.id, moment(ptsk.task_start_date).format('YYYY-MM-DD'), status_comp_id, company_ids);

                            if (all == '3') {
                                // checkData = await checkData.filter(f => f.user_profile_id == null);
                            }

                            if (checkData.length > 0) {
                                let task_checklists_status_count = await TaskChecklistsStatus.getTaskCheckListStatusCount(checkData[0].task_id, checkData[0].id);

                                if (checkData[0].status_id != status_comp_id) {
                                    checkData[0].task_detail_id = checkData[0].id;
                                    checkData[0].task_date_short = moment(checkData[0].task_date).format('DD. MMM').toLowerCase();
                                    checkData[0].deleted_at = null;
                                    checkData[0].task_files = task_files;
                                    checkData[0].task_checklists_count = task_checklists_count.length;
                                    checkData[0].task_checklists_status_count = task_checklists_status_count ? task_checklists_status_count.length : 0;
                                    new_pending_task.push(checkData[0]);
                                }
                            } else {

                                if (ptsk.deleted_at == null) {
                                    p_all_dates.push(moment(ptsk.task_date).format('YYYY-MM-DD'));
                                    let pending_task = {
                                        id: null,
                                        task_id: ptsk.id,
                                        task_detail_id: null,
                                        title: ptsk.title,
                                        status_id: ptsk.status_id,
                                        status: ptsk.status,
                                        color_code: ptsk.color_code,
                                        category_color: ptsk.category_color,
                                        // state: ptsk.state,
                                        user_profile_id: ptsk.user_profile_id,
                                        accountant_name: ptsk.accountant_name,
                                        accountant_photo: ptsk.accountant_photo,
                                        category_id: ptsk.category_id ? ptsk.category_id : null,
                                        category_name: ptsk.category_name ? ptsk.category_name : null,
                                        company_id: ptsk.company_id ? ptsk.company_id : null,
                                        company_name: ptsk.company_name ? ptsk.company_name : null,
                                        company_logo: ptsk.company_logo ? ptsk.company_logo : null,
                                        note: ptsk.note,
                                        is_repeat: ptsk.is_repeat,
                                        task_start_date: ptsk.task_start_date,
                                        task_end_date: ptsk.task_end_date,
                                        repeat_freq: ptsk.repeat_freq,
                                        comments: 0,
                                        task_date: ptsk.task_date,
                                        task_date_short: moment(ptsk.task_date).format('D. MMM').toLowerCase(),
                                        deleted_at: ptsk.deleted_at,
                                        repeat_string: ptsk.repeat_string,
                                        task_files: task_files,
                                        task_checklists_count: task_checklists_count.length,
                                        task_checklists_status_count: 0,
                                        old_user_profile_id: ptsk.id,
                                        initials: ptsk.initials,
                                        fontcolor: ptsk.fontcolor,
                                        bgcolor: ptsk.bgcolor,
                                        company_initials: ptsk.company_initials,
                                        company_fontcolor: ptsk.company_fontcolor,
                                        company_bgcolor: ptsk.company_bgcolor,
                                        review_color_code: "#FFFFFF",
                                        review_status: 0,
                                        review_status_name: "status-not-review"
                                    };
                                    new_pending_task.push(pending_task);
                                }
                            }
                        }
                    }
                }
            }
            return new_pending_task;
        } catch (error) {
            console.log('>>>>>>>>>>>>>>>>>>>error', error, '<<<<<<<<<<<<<<<<<<<<<<<<<<<');
        }
    },

    getOverDueTasksListOnly: async (tasks_data, all, status_comp_id, company_ids) => {
        let new_pending_task = [];
        const today = moment();
        const today_date = today.format("YYYY-MM-DD");
        const yesterday = today.subtract(1, 'days').format("YYYY-MM-DD 00:00:00");
        try {
            if (tasks_data && tasks_data.length > 0) {
                for (let ptsk of tasks_data) {
                    let p_all_dates = [];
                    if (ptsk.is_repeat == 1 && ptsk.repeat_string) {
                        let options;
                        try {
                            options  = RRule.parseText(ptsk.repeat_string);
                          } catch (err){
                              utils.log('Incorrect repeat string ' + ptsk.repeat_string, 'debug');
                          }
                        let arrayOfOccurence;
                        if (options) {
                            options.dtstart = moment.utc(ptsk.task_date).toDate();
                            options.until = moment.utc(yesterday).toDate();
                            var rule = new RRule(options);
                            arrayOfOccurence = await rule.all();
                            for (let occurence of arrayOfOccurence) {
                                p_all_dates.push(moment(occurence).format('YYYY-MM-DD'));
                                if (ptsk.task_end_date >= moment(occurence).format('YYYY-MM-DD') || ptsk.task_end_date == null) {
                                    let pending_task = {
                                        id: null,
                                        task_id: ptsk.id,
                                        task_detail_id: null,
                                        title: ptsk.title,
                                        status_id: ptsk.status_id,
                                        status: ptsk.status,
                                        color_code: ptsk.color_code,
                                        category_color: ptsk.category_color,
                                        state: ptsk.state ? ptsk.state : 'open',
                                        user_profile_id: ptsk.user_profile_id,
                                        accountant_name: ptsk.accountant_name,
                                        accountant_photo: ptsk.accountant_photo,
                                        category_id: ptsk.category_id ? ptsk.category_id : null,
                                        category_name: ptsk.category_name,
                                        company_id: ptsk.company_id,
                                        company_name: ptsk.company_name,
                                        company_logo: ptsk.company_logo,
                                        note: ptsk.note,
                                        is_repeat: ptsk.is_repeat,
                                        task_start_date: ptsk.task_start_date,
                                        task_end_date: ptsk.task_end_date,
                                        repeat_freq: ptsk.repeat_freq,
                                        comments: 0,
                                        task_date: moment(occurence).format('YYYY-MM-DD'),
                                        task_date_short: moment(occurence).format('D. MMM').toLowerCase(),
                                        deleted_at: ptsk.deleted_at,
                                        repeat_string: ptsk.repeat_string,
                                        is_completed: 0,
                                        old_user_profile_id: ptsk.id,
                                        initials: ptsk.initials,
                                        fontcolor: ptsk.fontcolor,
                                        bgcolor: ptsk.bgcolor,
                                        company_initials: ptsk.company_initials,
                                        company_fontcolor: ptsk.company_fontcolor,
                                        company_bgcolor: ptsk.company_bgcolor,
                                        review_color_code: "#FFFFFF",
                                        review_status: 0,
                                        review_status_name: "status-not-review"
                                    };
                                    new_pending_task.push(pending_task);
                                }
                            }
                            if (ptsk.details_counts > 0) {
                                // Getting all data from task details if have similar dates enties
                                if (p_all_dates.length > 0) {
                                    // let taskDetails = await module.exports.getTaskDetails(ptsk.id, p_all_dates);
                                    let taskDetails = await TaskDetails.getTaskDetailsListNew(ptsk.id, p_all_dates);
                                    for (let tdetail of taskDetails) {
                                        // comment code because of edit task not getting in list - krunal
                                        //  let same_data_index = await new_pending_task.findIndex(f => f.task_date == tdetail.task_date && f.title == tdetail.title);
                                        let same_data_index = await new_pending_task.findIndex(f => f.task_date == tdetail.task_date && f.task_id == tdetail.task_id);
                                        if (same_data_index > -1) {
                                            new_pending_task[same_data_index].id = tdetail.id;
                                            new_pending_task[same_data_index].task_detail_id = tdetail.id;
                                            new_pending_task[same_data_index].title = tdetail.title;
                                            new_pending_task[same_data_index].status_id = tdetail.status_id;
                                            new_pending_task[same_data_index].status = tdetail.status;
                                            new_pending_task[same_data_index].color_code = tdetail.color_code;
                                            new_pending_task[same_data_index].category_color = tdetail.category_color;
                                            new_pending_task[same_data_index].state = tdetail.state;
                                            new_pending_task[same_data_index].user_profile_id = tdetail.user_profile_id;
                                            new_pending_task[same_data_index].accountant_name = tdetail.accountant_name;
                                            new_pending_task[same_data_index].accountant_photo = tdetail.accountant_photo;
                                            new_pending_task[same_data_index].category_id = tdetail.category_id ? tdetail.category_id : null;
                                            new_pending_task[same_data_index].category_name = tdetail.category_name;
                                            new_pending_task[same_data_index].company_id = tdetail.company_id;
                                            new_pending_task[same_data_index].company_name = tdetail.company_name;
                                            new_pending_task[same_data_index].company_logo = tdetail.company_logo;
                                            new_pending_task[same_data_index].note = tdetail.note;
                                            new_pending_task[same_data_index].is_repeat = tdetail.is_repeat;
                                            new_pending_task[same_data_index].task_start_date = tdetail.task_start_date;
                                            new_pending_task[same_data_index].task_end_date = tdetail.task_end_date;
                                            new_pending_task[same_data_index].repeat_freq = tdetail.repeat_freq;
                                            new_pending_task[same_data_index].comments = tdetail.comments;
                                            new_pending_task[same_data_index].task_date = tdetail.task_date;
                                            new_pending_task[same_data_index].task_date_short = moment(tdetail.task_date).format('D. MMM').toLowerCase();
                                            new_pending_task[same_data_index].deleted_at = tdetail.deleted_at;
                                            new_pending_task[same_data_index].is_completed = tdetail.is_completed;
                                            new_pending_task[same_data_index].old_user_profile_id = ptsk.id;
                                            new_pending_task[same_data_index].initials = tdetail.initials;
                                            new_pending_task[same_data_index].bgcolor = tdetail.bgcolor;
                                            new_pending_task[same_data_index].fontcolor = tdetail.fontcolor;
                                            new_pending_task[same_data_index].company_initials = ptsk.company_initials;
                                            new_pending_task[same_data_index].company_fontcolor = ptsk.company_fontcolor;
                                            new_pending_task[same_data_index].company_bgcolor = ptsk.company_bgcolor;
                                        }
                                        // }
                                    }
                                }
                            }
                        }
                    } else {
                        // Fetch single day from task details if have similar date entry
                        // changes start_date to today_date
                        if (ptsk.is_repeat == 0 && ptsk.task_start_date < today_date) {
                            let checkData = await TaskDetails.checkTaskDetailsWithStatusNew(ptsk.id, moment(ptsk.task_start_date).format('YYYY-MM-DD'), status_comp_id, company_ids);
                            if (checkData.length > 0) {
                                if (checkData[0].status_id != status_comp_id) {
                                    checkData[0].task_detail_id = checkData[0].id;
                                    checkData[0].task_date_short = moment(checkData[0].task_date).format('DD. MMM').toLowerCase();
                                    checkData[0].deleted_at = null;
                                    new_pending_task.push(checkData[0]);
                                }
                            } else {
                                if (ptsk.deleted_at == null) {
                                    p_all_dates.push(moment(ptsk.task_date).format('YYYY-MM-DD'));
                                    let pending_task = {
                                        id: null,
                                        task_id: ptsk.id,
                                        task_detail_id: null,
                                        title: ptsk.title,
                                        status_id: ptsk.status_id,
                                        status: ptsk.status,
                                        color_code: ptsk.color_code,
                                        category_color: ptsk.category_color,
                                        // state: ptsk.state,
                                        user_profile_id: ptsk.user_profile_id,
                                        accountant_name: ptsk.accountant_name,
                                        accountant_photo: ptsk.accountant_photo,
                                        category_id: ptsk.category_id ? ptsk.category_id : null,
                                        category_name: ptsk.category_name ? ptsk.category_name : null,
                                        company_id: ptsk.company_id ? ptsk.company_id : null,
                                        company_name: ptsk.company_name ? ptsk.company_name : null,
                                        company_logo: ptsk.company_logo ? ptsk.company_logo : null,
                                        note: ptsk.note,
                                        is_repeat: ptsk.is_repeat,
                                        task_start_date: ptsk.task_start_date,
                                        task_end_date: ptsk.task_end_date,
                                        repeat_freq: ptsk.repeat_freq,
                                        comments: 0,
                                        task_date: ptsk.task_date,
                                        task_date_short: moment(ptsk.task_date).format('D. MMM').toLowerCase(),
                                        deleted_at: ptsk.deleted_at,
                                        repeat_string: ptsk.repeat_string,
                                        old_user_profile_id: ptsk.id,
                                        initials: ptsk.initials,
                                        fontcolor: ptsk.fontcolor,
                                        bgcolor: ptsk.bgcolor,
                                        company_initials: ptsk.company_initials,
                                        company_fontcolor: ptsk.company_fontcolor,
                                        company_bgcolor: ptsk.company_bgcolor,
                                        review_color_code: "#FFFFFF",
                                        review_status: 0,
                                        review_status_name: "status-not-review"
                                    };
                                    new_pending_task.push(pending_task);
                                }
                            }
                        }
                    }
                }
            }
            return new_pending_task;
        } catch (error) {
            console.log('>>>>>error', error, '<<<<<<<<<<<');
        }
    },
};
