const constants = require('../config/constant');
const EsignClient = require('../services/esign/client.service');

const client_id = constants.ESIGN_CLIENT_ID;
const client_secret = constants.ESIGN_CLIENT_SECRET;
const scope = ['identify'];

module.exports = {

  async createSession(params) {
    const client = new EsignClient(client_id, client_secret, scope);
    return new Promise((resolve, reject) => {
      client.identifiation.createSession(params).then(async (response) => {
        //console.log('===================Esign createSession response::::', response);
        resolve(response.data.data);
      }).catch(error => {
        console.log('===================Esign createSession error::::', error);
        reject(error);
      });
    });
  },

  async createLoginSession(params) {
    const client_id_test = 'tbe23e4321d8af83a8e52d1087b2646ee2d4839be';
    const client_secret_test = '1f45f285246af7ecc445392d7ce7f1a249fbc03d912c2af2b054a9e73b1cba88';
    const Login_url = 'https://bankid.taskline.no';

    const client = new EsignClient(client_id_test, client_secret_test, scope, Login_url);
    return new Promise((resolve, reject) => {
      client.identifiation.createSession(params).then(async (response) => {
        //console.log('===================Esign createSession response::::', response);
        resolve(response.data.data);
      }).catch(error => {
        console.log('===================Esign createSession error::::', error);
        reject(error);
      });
    });
  }
}


