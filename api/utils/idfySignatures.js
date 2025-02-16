const constants = require('../config/constant');
const { IdfyClient } = require('@idfy/sdk');
const pdf2base64 = require('pdf-to-base64');

const client_id = constants.IDFY_CLIENT_ID;
const client_secret = constants.IDFY_CLIENT_SECRET;
const scope = ['identify','document_read', 'document_write', 'document_file', 'event'];
const company_name = constants.SUPPORT_NAME;
const company_email = constants.SUPPORT_EMAIL;
// const client = new IdfyClient(client_id, client_secret, scope);

module.exports = {
/**
 * 
 * @param {string} docTitle 
 * @param {string} docDesc 
 * @param {string} signatureUuid 
 * @param {string} fileUrl 
 * @param {string} fileName 
 * @param {array} signersData 
 */
  async createDocument(docTitle, docDesc, signatureUuid, fileUrl, fileName, signersData = []) {    
    const base64Str = await pdf2base64(fileUrl);     
    const documentCreateOptions = {
      // title: docTitle,
      title: fileName,
      description: docDesc,
      externalId: signatureUuid,
      dataToSign: {
        base64Content: base64Str,
        fileName: fileName,
        description: "Document description",
        // convertToPDF: true
      },
      contactDetails: { // The company's contact information.
        name: company_name,
        email: company_email, // required params
      },
      signers: signersData
    };

    const client = new IdfyClient(client_id, client_secret, scope);
    return new Promise((resolve, reject) => {
      client.signature.createDocument(documentCreateOptions).then(async (response) => {
        resolve(response);
      }).catch(error => {
        console.log('idfy error', error.body.errors);
        console.log('idfy error----', error);
        reject(error);
      });
    });
  },

  async createSigner(documentId, signerOptions) {
    const client = new IdfyClient(client_id, client_secret, scope);
    return new Promise((resolve, reject) => {
      client.signature.createSigner(documentId, signerOptions).then(async (response) => {
        resolve(response);
      }).catch(error => {
        console.log('idfy error........', error.body.errors);
        reject(error);
      });
    });
  },

  async cancelDocument(documentId) {

    const reason = 'Company has deleted document.';
    const client = new IdfyClient(client_id, client_secret, scope);
    return new Promise((resolve, reject) => {
      client.signature.cancelDocument(documentId, reason).then(async (response) => {
        resolve(response);
      }).catch(error => {
        console.log('idfy error........', error.body.errors);
        reject(error);
      });
    });
  },

  async deleteSigner(documentId, signerId) {

    const client = new IdfyClient(client_id, client_secret, scope);
    await client.signature.deleteSigner(documentId, signerId).then(async (response) => {
      console.log(response);
      return true;
    }).catch(error => {
      console.log(error);
    });
  },

  async getSignedDocument(documentId) {

    const client = new IdfyClient(client_id, client_secret, scope);
    return new Promise((resolve) => { 
      client.signature.getFile(documentId, 'pades').then(async (response) => {
        // let buff = new Buffer(response);
        // let base64data = await buff.toString('base64');
        console.log('idfy response', response);
        resolve(response);
      }).catch(error => {
        console.log('idfy error', error);
        resolve(error);
      });
    });
    // await client.signature.getFile(documentId, 'native').then(async (response) => {
    //   // let buff = new Buffer(response);
    //   // let buff = Buffer.from(response);
    //   // let base64data = await buff.toString('base64');
    //  // console.log(base64data);
    //  return response;
    // }).catch(error => {
    //   console.log('in err');
    //   console.log(error.body);
    //   // let buff = new Buffer(error.body);
    //   let buff = Buffer.from(error.body);
    //   let base64data = buff.toString('base64');
    //   console.log(base64data);
    // });
  },

  async getDocumentStatus(documentId) {

    const client = new IdfyClient(client_id, client_secret, scope);
    return new Promise((resolve) => {
      client.signature.getDocument(documentId).then(async (response) => {
        // let buff = new Buffer(response);
        // let base64data = await buff.toString('base64');
        resolve(response);
      }).catch(error => {
        console.log('idfy error', error);
        resolve(error);
      });
    });
  },

  async getDocumentDetails(documentId, signerId) {

    const client = new IdfyClient(client_id, client_secret, scope);
    return new Promise((resolve) => {
      client.signature.getSigner(documentId, signerId).then(async (response) => {
        // let buff = new Buffer(response);
        // let base64data = await buff.toString('base64');
        resolve(response);
      }).catch(error => {
        console.log('idfy error', error);
        resolve(error);
      });
    });
  },

  async createWebhook() {
    const client = new IdfyClient(client_id, client_secret, scope);

    const options = {
      name: 'Taskline-Webhook',
      active: true,
      events: [
        "document_created",
        "document_signed",
        "document_canceled",
        "document_deleted",
        "document_expired",
        "document_link_opened",
        "document_form_signed",
        "document_partially_signed"
      ],
      config: {
        url: constants.BASE_URL + constants.WEBHOOK_END_POINT,
      }
    };

    return new Promise((resolve, reject) => {
      client.notification.createWebhook(options).then(async (response) => {
        resolve(response);
      }).catch(error => {
        console.log('idfy error', error);
        reject(error);
      });
    });
  },

  async updateWebhook() {
    const client = new IdfyClient(client_id, client_secret, scope);
    const webHookId = 184069;
    const options = {
      config: {
        // url: constants.BASE_URL + constants.WEBHOOK_END_POINT,
        url: constants.WEBHOOK_END_POINT,
        secret: "taskline-16043",
        deliveryLogging: "failed",
      }
    };

    return new Promise((resolve, reject) => {
      client.notification.updateWebhook(webHookId, options).then(async (response) => {
        resolve(response);
      }).catch(error => {
        console.log('idfy error', error);
        reject(error);
      });
    });
  },

  async pingWebhook() {
    const client = new IdfyClient(client_id, client_secret, scope);
    const webHookId = 184069;
    await client.notification.pingWebhook(webHookId);
    return true;
  },

  async listWebhooks() {
    const client = new IdfyClient(client_id, client_secret, scope);
    // const option = {
    //   eventType: 'document_expired'
    // };
    return new Promise((resolve, reject) => {
      client.notification.listWebhooks().then(async (response) => {
        resolve(response);
      }).catch(error => {
        console.log('idfy error', error);
        reject(error);
      });
    });
  }
};
