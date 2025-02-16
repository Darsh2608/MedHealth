const models = require("../models");
const Op = models.Sequelize.Op;
const CompanyChargesWithCategories = models.CompanyChargesWithCategories;
const TimesheetClass = models.TimesheetClass;
const Company = models.Companies;
const Client = models.Clients;
const timesheetInvoice = models.TimesheetInvoice;
const TimesheetInvoiceItems = models.TimesheetInvoiceItems;
const timesheetLogs = models.TimesheetLogs;
const TimesheetSettings = models.timesheet_settings;
const CompanyFixedChargesWithClass = models.CompanyFixedChargesWithClass;
const fs = require('fs');
const constant = require("../config/constant");
const { mkdirsSync } = require('fs-extra');
const rimraf = require('rimraf');
const commonFunction = require("../utils/commonFunction");
const utils = require("../utils/function");
const ejs = require('ejs');
let xlsx = require("json-as-xlsx");
const moment = require("moment");
const ShortMonths = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

module.exports = {

  getTimeDiff(startDate, endDate) {

    return new Promise((resolve, reject) => {
      try {
        let diff = endDate.diff(startDate);
        let days = Math.floor(diff / (60 * 60 * 24 * 1000));
        let hours = Math.floor(diff / (60 * 60 * 1000)) - (days * 24);
        let minutes = Math.floor(diff / (60 * 1000)) - ((days * 24 * 60) + (hours * 60));
        let seconds = Math.floor(diff / 1000) - ((days * 24 * 60 * 60) + (hours * 60 * 60) + (minutes * 60));

        let timer = hours + ':' + minutes + ':' + seconds;
        resolve(timer);;
      } catch (err) {
        reject('00:00:00')
      }
    })
  },

  addTimers(start, end) {
    return new Promise((resolve, reject) => {
      try {
        let times = [];
        let times1 = start.split(':');
        let times2 = end.split(':');

        for (let i = 0; i < 3; i++) {
          times1[i] = (isNaN(parseInt(times1[i]))) ? 0 : parseInt(times1[i])
          times2[i] = (isNaN(parseInt(times2[i]))) ? 0 : parseInt(times2[i])
          times[i] = times1[i] + times2[i];
        }

        let seconds = times[2];
        let minutes = times[1];
        let hours = times[0];

        if (seconds % 60 === 0) {
          hours += seconds / 60;
        }

        if (minutes % 60 === 0) {
          let res = (minutes / 60) | 0;
          hours += res;
          minutes = minutes - (60 * res);
        }

        if (seconds > 60) {
          seconds = seconds % 60;
          minutes = minutes + 1;
        }

        if (minutes > 60) {
          minutes = minutes % 60;
          hours = hours + 1;
        }

        if (hours > 24) {
          seconds = 59;
          minutes = 59;
          hours = 23;
        }
        resolve(hours + ':' + minutes + ':' + seconds)
      } catch (error) {
        reject('false');
      }
    })
  },

  getHourlyPriceOfCompany: async (client_id, company_id, class_id, date = null) => {
    let today_date = date ? moment(date).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD');
    const month = date ? moment(date).month() : moment().month();
    let classFixedPrice = await CompanyFixedChargesWithClass.getFixedPriceForCurrentMonth(company_id, today_date);


    let shortMonth = ShortMonths[month];
    let class_amount = classFixedPrice.length > 0 ? classFixedPrice[0].fix_amounts.filter(f=> f.class_id == class_id) : null;
    
    if (class_amount && class_amount[0][shortMonth] > 0) {
      return { isFixed: true, amount: class_amount[0][shortMonth] }
    } else {

    let classData = await TimesheetClass.findOne({
      where: {
        id: class_id
      },
    });

    let chargesData = await CompanyChargesWithCategories.findOne({
      where: {
        company_id: company_id,
        category_id: classData.category_id
      }
    });

    if (chargesData?.hourly_amount) {
      if (chargesData.type == 'hourly_rate') {
        return { isFixed: false, amount: chargesData.hourly_amount }
      }
    } else {

      let companyData = await Company.findOne({
        where: {
          id: company_id
        },
        attributes: ['id', 'hourly_amount'],
      });

      if (companyData?.hourly_amount) {
        return { isFixed: false, amount: companyData.hourly_amount }
      } else {
        let adminData = await TimesheetSettings.findOne({
          where: {
            client_id: client_id
          },
        });

        if (adminData?.hourly_rate) {
          return { isFixed: false, amount: adminData.hourly_rate }
        } else {
          return { isFixed: false, amount: 0 }
        }
      }
    }
  }
  },

  generateInvoice: async (client_id, company_list, user_profile_id) => {

    const today = Date.now();
    const base_url = constant.BASE_URL;
    const clientData = await Client.getSingleClient(client_id);
    let pdfFileName;

    try {
      for (let company of company_list) {

        pdfFileName = 'Fakturagrunnlag_' + today + '.pdf';
        const INVOICE_PATH = 'uploads/invoices/' + client_id + '/' + company.company_id + '/';

        const invoice_count = await timesheetInvoice.max('invoice_number');
        let invoice_number = (invoice_count && invoice_count > 0) ? parseInt(invoice_count) + 1 : 1000;

        // Update PDF Header & Footer templates
        let headerTemplate = './public/pdf-templates/pdf-header.html';
        if (fs.existsSync(headerTemplate)) {
          let headerHtmlStr = '<!DOCTYPE html><head></head><html><body><div style="height: 90px; padding: 0 23px;"><div style="text-align: right">';
          if (clientData[0].photo) {
            const clientLogo = constant.BASE_URL + 'uploads/clients-photo/thumb/' + clientData[0].photo;
            headerHtmlStr += '<img src="' + clientLogo + '" alt="' + clientData[0].name + '" style="max-width: 150px; max-height:100px;">';
          } else {
            headerHtmlStr += '<p style="margin-top: 0; font-size: 24px; font-weight: bold; font-family: Arial,Helvetica, sans-serif; letter-spacing:1px"></p>';
          }
          const title = 'Fakturagrunnlag';
          const current_date = moment().format('DD.MM.YYYY');
          const company_number = company.company_number;
          const company_name = company.company_name;

          headerHtmlStr += '</div><div>';
          headerHtmlStr += '<table class="hidden-border"><th class="hidden-border"></th>';
          headerHtmlStr += '<tr class="hidden-border"><td colspan="2" style="width:70%;" vertical-align="top"><h2 style="margin-bottom: 0px; font-size: 30px;">' + title + ' ' + invoice_number + '</h2>';
          headerHtmlStr += '<span>' + company_name + '</span></td><td class="hidden-border">';
          headerHtmlStr += '<table class="hidden-border" style="font-size:12px;"><tr class="hidden-border"><td class="hidden-border">Fakturagrunnlag</td><td>' + invoice_number + '</td></tr>';
          headerHtmlStr += '<tr class="hidden-border"><td class="hidden-border">Dato</td><td>' + current_date + '</td></tr>';
          headerHtmlStr += '<tr class="hidden-border"><td class="hidden-border" style="width: 130px;">Kundenr</td><td>' + company_number + '</td></tr>'; 
          headerHtmlStr += '</table></td></tr></table>';
          headerHtmlStr += '</div></div></body></html>';
          fs.writeFile(headerTemplate, headerHtmlStr, err => {
          });
        }

        let footerTemplate = './public/pdf-templates/pdf-footer.html';
        if (fs.existsSync(footerTemplate)) {
          const currentTime = moment().format('DD.MM.YYYY HH:mm');
          let footerHtmlStr = '<!DOCTYPE html><head></head><html><body><div style="height:75px;"><img src="../images/taskline-logo-dark.png" alt="Taskline" style="width: 100px"><p style="margin-top: 0;font-family: Arial,Helvetica, sans-serif; font-size:12px;">Generert i Taskline ' + currentTime + '</p></div></body></html>';
          console.log("footerHtmlStr", footerHtmlStr);
          fs.writeFile(footerTemplate, footerHtmlStr, err => {
          });
        }
        // End of Header and Footer
        const currentDate = moment().format('DD.MM.YYYY');
        let file = fs.readFileSync('views/invoices/invoice.ejs', 'ascii');
        let rendered = await ejs.render(file, {
          base_url: base_url,
          title: 'Fakturagrunnlag',
          data: company,
          invoice_number: invoice_number,
          current_date: currentDate,
          lbl_total_amount: 'Beløp'
        });

        let invoice_dir = "./public/" + INVOICE_PATH;
        if (!fs.existsSync(invoice_dir)) {
          rimraf.sync(invoice_dir);
          mkdirsSync(invoice_dir);
        }

        // Call wkhtmltopdf and convert pdf to base64 string
        let pdfFile = null;
        pdfFile = await commonFunction.exportHtmlToPdf(rendered, invoice_dir + pdfFileName, { pageSize: 'A4' });

        await module.exports.generateExcel(client_id, invoice_number, currentDate, company, pdfFileName);
        await module.exports.postCreateInvoiceData(client_id, company, user_profile_id, pdfFile, pdfFileName, invoice_number);
      }

    } catch (error) {
      utils.log(`${400} - ${'timesheetInvoiceontroller.' + 'generateInvoice'} - ${error}`, 'error', error);
    }
  },

  generateExcel: async (client_id, invoice_number, currentDate, company, pdfFileName) => {

    try {
      let FileName = pdfFileName.replace('.pdf', '');
      const filepath = './public/uploads/invoices/' + client_id + '/' + company.company_id + '/' + FileName;

      let invoice_data = [{
        columns: [
          { label: "Kunde", value: "Kunde" },
          { label: "Fakturagrunnlag", value: "Fakturagrunnlag" },
          { label: "Dato", value: "Dato" },
          { label: "Kundenr", value: "Kundenr" },
          { label: "", value: "" }
        ],
        content: [{
          Kunde: company.company_name,
          Fakturagrunnlag: invoice_number,
          Dato: currentDate,
          Kundenr: company.company_number,
          "": ""
        }]
      }]

      if (company?.accountant_list.length > 0) {
        invoice_data[0].content.push({
          Kunde: "",
          Fakturagrunnlag: "",
          Dato: "",
          Kundenr: "",
          "": ""
        })
        invoice_data[0].content.push({
          Kunde: "Medarbeider",
          Fakturagrunnlag: "",
          Dato: "",
          Kundenr: "",
          "": ""
        })
        invoice_data[0].content.push({
          Kunde: "Beskrivelse",
          Fakturagrunnlag: "Antall",
          Dato: "",
          Kundenr: "",
          "": ""
        })
        for (let result of company.accountant_list) {
          const data = {
            Kunde: result.accountant_name,
            Fakturagrunnlag: result.billable_hours,
            Dato: "",
            Kundenr: "",
            "": ""
          }
          invoice_data[0].content.push(data);
        }
        invoice_data[0].content.push({
          Kunde: "",
          Fakturagrunnlag: company.total_accountant_hours,
          Dato: "",
          Kundenr: "",
          "": ""
        })
      }

      if (company?.class_list.length > 0) {
        invoice_data[0].content.push({
          Kunde: "",
          Fakturagrunnlag: "",
          Dato: "",
          Kundenr: "",
          "": ""
        })
        invoice_data[0].content.push({
          Kunde: "Timeart",
          Fakturagrunnlag: "",
          Dato: "",
          Kundenr: "",
          "": ""
        })
        invoice_data[0].content.push({
          Kunde: "Beskrivelse",
          Fakturagrunnlag: "Sats",
          Dato: "Antall",
          Kundenr: "MVA-sats",
          "": "Beløp"
        })
        for (let result2 of company.class_list) {
          let class_name;
          if (result2.rate_type == 'fixed') {
            class_name = result2.class_name + " Fastpris " + result2.fixed_price_month + " " + result2.fixed_price_year; 
          } else if(result2.rate_type == 'basic') {
            class_name = (result2.external_note ? result2.external_note : '') + " " + result2.fixed_price_month + " " + result2.fixed_price_year; 
          } else {
            class_name = result2.class_name; 
          }

          const data = {
            Kunde: class_name,
            Fakturagrunnlag: result2.rate,
            Dato: result2.qty,
            Kundenr: result2.vat + '%',
            "": result2.amount,
          }
          invoice_data[0].content.push(data);
        }
        invoice_data[0].content.push({
          Kunde: "",
          Fakturagrunnlag: "",
          Dato: "",
          Kundenr: "",
          "": company.total_class_amount,
        })
      }

      let settings = {
        fileName: filepath, // Name of the resulting spreadsheet
        extraLength: 3, // A bigger number means that columns will be wider
        writeMode: "writeFile", // The available parameters are 'WriteFile' and 'write'. This setting is optional. Useful in such cases https://docs.sheetjs.com/docs/solutions/output#example-remote-file
        writeHeader: true
      }

      xlsx(invoice_data, settings);

    } catch (error) {
      utils.log(`${400} - ${'timesheetFunctions.' + 'generateExcel'} - ${error}`, 'error', error);
    }
  },

  postCreateInvoiceData: async (client_id, company, user_profile_id, pdfFile, pdfFileName, invoice_number) => {
    try {

      let data = {
        client_id: client_id,
        company_id: company.company_id,
        invoice_number: invoice_number,
        invoiced_date: new Date(),
        created_by: user_profile_id,
        is_paid: false,
        amount: company.total_class_amount,
        filename: pdfFileName,
        filepath: pdfFile,
        s3_upload: 1,
        created_at: new Date(),
        updated_at: new Date()
      }

      const timeSheetInvoice = await utils.createData(timesheetInvoice, data);

      if (timeSheetInvoice) {
        for (let item of company.list) {
          let post_data = {
            timesheet_invoice_id: timeSheetInvoice.id || null,
            timesheet_log_detail_id: item.timesheet_log_detail_id,
            item_name: item ? item.class_name + '-' + item.accountant_name + '-' + item.journal_year : null,
            description: item.internal_note || null,
            hours: item.effective_hours || null,
            amount: item.total_amount,
            created_at: new Date(),
            updated_at: new Date(),
          };
          await utils.createData(TimesheetInvoiceItems, post_data);
        }
      }

      let ids = await company.list.map(m => m.timesheet_log_id);
      await timesheetLogs.update({
        status: 'invoiced',
      }, {
        where: {
          id: ids
        }
      });

      if (utils.allowToS3()) {
        let s3FilePath = (pdfFile).replace('./', '');
        await utils.moveFileToS3Bucket(s3FilePath, pdfFileName);

        let xls_file_name = await pdfFileName.replace('.pdf', '.xlsx');
        let xls_file_path = await s3FilePath.replace('.pdf', '.xlsx');
        await utils.moveFileToS3Bucket(xls_file_path, xls_file_name);
      }
      utils.log('Create TimesheetInvoice & TimesheetDetailInvoice ' + timeSheetInvoice.id + ' by ' + user_profile_id, 'debug');
    } catch (error) {
      utils.log(`${400} - ${'timesheetInvoiceontroller.' + 'postCreatTimesheetInvoice'} - ${error}`, 'error');
    }
  },
};
