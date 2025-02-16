
const wkhtmltopdf = require('wkhtmltopdf');
const pdf2base64 = require('pdf-to-base64');
const constant = require("../config/constant");

module.exports = {
  async getAllCategoryData(parent_data, child_data) {
    for (let pd of parent_data) {
      let getData = await module.exports.setCategorySubData(pd, child_data);
      pd = await getData;
    }
    return parent_data;
  },

  async setCategorySubData(pd, child_data) {
    if (pd.id) {
      let new_data = [];
      for (let cd of child_data) {
        if (cd.parent_id == pd.id) {
          await new_data.push(cd);
          pd.sub_data = await new_data;
        }
      }
      if (pd.sub_data) {
        for (let sd of pd.sub_data) {
          await this.setCategorySubData(sd, child_data);
        }
      }
    }
    return pd;
  },

  exportHtmlToPdf: async (html, file, options) => {
    // doc ref. link : https://www.api2pdf.com/documentation/advanced-options-wkhtmltopdf/
    return new Promise(async (resolve, reject) => {
        await wkhtmltopdf(html, {
            output: file,
            pageSize: 'A4',
            marginTop: 20,
            headerSpacing: 10, // in mm
            footerSpacing: 10, // in mm
            headerHtml: constant.BASE_URL + 'pdf-templates/pdf-header.html',
            footerHtml: constant.BASE_URL + 'pdf-templates/pdf-footer.html',
            footerRight: "Side [page] av [topage]",
            footerFontSize: 8
        }, (err) => {
            if (err) {
                console.log('in err');
                reject(err);
            }
            resolve(file);
        });
    });
  },

    exportHtmlToPdfs: async (html, options) => {
        return new Promise(async (resolve, reject) => {
            const buffers = [];
            const pdfStream = wkhtmltopdf(html, {
                output: '-', // Output to stdout
                pageSize: options.pageSize || 'A4',
                marginTop: options.marginTop || 20,
                headerSpacing: options.headerSpacing || 10,
                footerSpacing: options.footerSpacing || 5,
                headerHtml: options.headerHtml || '',
                footerHtml: options.footerHtml || ''
            });

            pdfStream.on('data', (buffer) => {
                buffers.push(buffer);
            });

            pdfStream.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                resolve(pdfBuffer);
            });

            pdfStream.on('error', (err) => {
                console.log('in err');
                reject(err);
            });
        });
    },

  getBase64Str: async (url) => {
    let base64Str = null;
    return new Promise((resolve, reject) => {
        pdf2base64(url).then((data) => {
            base64Str = 'data:application/pdf;base64,' + data;
            resolve(base64Str);
        })
            .catch((error) => {
                utils.log(`${400} - ${'commonFunction.js.' + 'getBase64Str'} - ${error}`, 'error', error);
                reject(error);
            })
    });
  }
}
