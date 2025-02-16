const rp = require('request-promise');
var fs = require('fs');
var constants = require('../config/constant');
// const models = require("../models");
// const { IdfyClient } = require('@idfy/sdk');
// const pdf2base64 = require('pdf-to-base64');
// const Op = models.Sequelize.Op;
// const UserProfile = models.UserProfile;
// const Client = models.Clients;
// const Category = models.Categories;

module.exports = class Idfy {

  /**
   * idfy constructor.
   * @constructor
   * @param {string} client_id - The client id of the idfy dashboard.
   * @param {string} client_secret - The client secret of the idfy dashboard.
   */
  constructor(client_id, client_secret) {
    this.client_id = client_id;
    this.client_secret = client_secret;
    this.url = 'https://api.idfy.io/';
  }

  /**
   * Creates a access token using client_id and client_secret
   * @return {String}
   */
  createToken() {
    const authCode = Buffer.from(`${this.client_id}:${this.client_secret}`).toString('base64');

    const options = {
      method: 'POST',
      uri: `${this.url}oauth/connect/token`,
      form: {
        grant_type: 'client_credentials',
        scope: 'identify document_write document_read document_file event'
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authCode}`
      },
      rejectUnauthorized: false
    };

    return new Promise((resolve, reject) => {
      this.sendRequest(options)
      .then(res => {
        resolve(res);
      })
      .catch(error => {
        reject(error);
      });
    });
  }

  /**
   * create a document in idfy
   * @param {String} documentPdf
   * @param {String} userId
   * @param {String} fileName
   * @param {String} title
   * @param {String} email
   * @return {String}
   */
  createDocument(accessToken, documentPdf, offerNumber,fileName, title, email, socialSecurityNumber = null) {

    let buff = fs.readFileSync(documentPdf);
    const base64data = buff.toString('base64');
    let signers = [];
    if (socialSecurityNumber) {
      signers.push({
        authentication: {
          mechanism: "eid",
          socialSecurityNumber: socialSecurityNumber
        },
        externalSignerId: 'pipeline-kasseservice-as',
        redirectSettings: {
          // redirectMode: "donot_redirect"
          redirectMode: "redirect",
          success: `${constants.TASKLINE_URL}esign-success`,
          cancel: `${constants.TASKLINE_URL}esign-cancelled`,
          error: `${constants.TASKLINE_URL}esign-error`
        },
        signatureType: {
          signatureMethods: ["NO_BANKID"],
          mechanism: "pkisignature"
        },
        ui: {
          language: "no"
        }
      });
    } else {
      signers.push({
        externalSignerId: 'pipeline-kasseservice-as',
        redirectSettings: {
          // redirectMode: "donot_redirect"
          redirectMode: "redirect",
          success: `${constants.TASKLINE_URL}esign-success`,
          cancel: `${constants.TASKLINE_URL}esign-cancelled`,
          error: `${constants.TASKLINE_URL}esign-error`
        },
        signatureType: {
          signatureMethods: ["NO_BANKID"],
          mechanism: "pkisignature"
        },
        ui: {
          language: "no"
        }
      });
    }
    const body = {
      signers: signers,
      title: title,
      description: "",
      contactDetails :{
        email: email
      },
      dataToSign: {
        fileName: fileName,
        base64Content: base64data
      },
      externalId: offerNumber
    };

    const options = {
      method: 'POST',
      uri: `${this.url}signature/documents`,
      body: JSON.stringify(body),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      rejectUnauthorized: false
    };

    return new Promise((resolve, reject) => {
      this.sendRequest(options)
      .then(res => {
        resolve(res);
      })
      .catch(error => {
        reject(error);
      });
    });
  }

  /**
   * get the stsatus of the document.
   * @param {String} documentId
   * @return Promise
   */
  getDocumentStatus(documentId) {
    const options = {
      method: 'GET',
      uri: `${this.url}signature/documents/${documentId}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`
      },
      rejectUnauthorized: false
    };

    return new Promise((resolve, reject) => {
      this.sendRequest(options)
      .then(res => {
        resolve(res);
      })
      .catch(error => {
        reject(error);
      });
    });
  }

  /**
   * get the signed document back
   * @param {String} documentId
   * @param {String} signerId
   * @return Promise
   */
  getSignedDocument(accessToken, documentId, signerId) {
    const options = {
      method: 'GET',
      uri: `${this.url}signature/documents/${documentId}/files/signers/${signerId}?fileFormat=native`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      resolveWithFullResponse: true,
      rejectUnauthorized: false
    };

    return new Promise((resolve, reject) => {
      this.sendRequest(options)
      .then(res => {
        resolve(res);
      })
      .catch(error => {
        reject(error);
      });
    });
  }

  /**
   * get the signer inbformation
   * @param {String} documentId
   * @param {String} signerId
   * @return Promise
   */
  getSignerInfo(accessToken, documentId, signerId) {
    const options = {
      method: 'GET',
      uri: `${this.url}signature/documents/${documentId}/signers/${signerId}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      rejectUnauthorized: false
    };

    return new Promise((resolve, reject) => {
      this.sendRequest(options)
      .then(res => {
        console.log(res);
        resolve(res);
      })
      .catch(error => {
        reject(error);
      });
    });
  }

  /**
   * create an attachments for offer documents.
   * @param {String} documentId
   * @param {String} fileName
   * @param {String} documentPdf
   * @param {String} title
   * @param {Text} description
   */
  createAttachments(documentId, fileName, documentPdf, title, description) {
    let buff = fs.readFileSync(documentPdf);
    const base64data = buff.toString('base64');

    const options = {
      method: 'POST',
      uri: `${this.url}signature/documents/${documentId}/attachments`,
      body: {
        fileName: fileName,
        title: title,
        data: base64data,
        description: description
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`
      },
      rejectUnauthorized: false
    };

    return new Promise((resolve, reject) => {
      this.sendRequest(options)
      .then(res => {
        console.log("res============", res);
        resolve(res);
      })
      .catch(error => {
        console.log("error============", error);
        reject(error);
      });
    });
  }

  /**
   * Delete attachment
   * @param {String} documentId
   * @param {String} attachmentId
   */
  deleteAttachment(documentId, attachmentId) {
    const options = {
      method: 'DELETE',
      uri: `${this.url}signature/documents/${documentId}/attachments/${attachmentId}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`
      },
      rejectUnauthorized: false
    };

    return new Promise((resolve, reject) => {
      this.sendRequest(options)
      .then(res => {
        resolve(res);
      })
      .catch(error => {
        reject(error);
      });
    });
  }

  /**
   * Cancel offer document
   * @param {String} documentId
   * @param {Text} reason
   */
  cancelDocument(accessToken, documentId, reason) {
    const options = {
      method: 'POST',
      uri: `${this.url}signature/documents/${documentId}/cancel?reason=${reason}`,
      body: '{}',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      rejectUnauthorized: false
    };

    return new Promise((resolve, reject) => {
      this.sendRequest(options)
      .then(res => {
        resolve(res);
      })
      .catch(error => {
        reject(error);
      });
    });
  }

  /**
   * Validate JWT token received from idfy.
   * @param {String} token
   */
  validateJwt(accessToken, jwt) {
    const options = {
      method: 'POST',
      uri: `${this.url}jwt/validate`,
      body: JSON.stringify({
        jwt: jwt
      }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      rejectUnauthorized: false
    };

    return new Promise((resolve, reject) => {
      this.sendRequest(options)
      .then(res => {
        resolve(res);
      })
      .catch(error => {
        reject(error);
      });
    });
  }

  /**
   * create a webhook in idfy
   * @param {String} accessToken
   */
  createWebhook(accessToken) {
    const options = {
      method: 'POST',
      uri: `${this.url}notification/webhooks`,
      body: JSON.stringify({
        name: "Pipeline-Webhook",
        active: true,
        events: [
          "document_created",
          "document_signed",
          "document_canceled",
          "document_deleted",
          "document_expired",
          "document_link_opened"
        ],
        config: {
          url: `${constants.BASE_URL}idfy-webhook-response`,
          // url: 'https://test-booking.kasseservice.no:3030/idfy-webhook-response',
          secret: "kasseservice-pipeline-15093",
          deliveryLogging: "failed"
        }
      }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      rejectUnauthorized: false
    };

    return new Promise((resolve, reject) => {
      this.sendRequest(options)
      .then(res => {
        resolve(res);
      })
      .catch(error => {
        reject(error);
      });
    });
  }

  listWebhooks(accessToken) {
    const options = {
      method: 'GET',
      uri: `${this.url}notification/webhooks`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      rejectUnauthorized: false
    };

    return new Promise((resolve, reject) => {
      this.sendRequest(options)
      .then(res => {
        resolve(res);
      })
      .catch(error => {
        reject(error);
      });
    });
  }

  validateSdo(accessToken, sdo) {
    // https://api.idfy.io/validation/no/bankid/validate

    let buff = fs.readFileSync(sdo);
    const base64data = buff.toString('base64');

    const options = {
      method: 'POST',
      uri: `${this.url}validation/no/bankid/validate`,
      body: JSON.stringify({
        sdoData: base64data
      }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      rejectUnauthorized: false
    };

    return new Promise((resolve, reject) => {
      this.sendRequest(options)
      .then(res => {
        resolve(res);
      })
      .catch(error => {
        reject(error);
      });
    });
  }

  /**
   * Http call to idfy
   * @param {Object} options
   * @return Promise
   */
  sendRequest(options) {
    return rp(options);
  }
};
