// encryption-decryption.service.ts

import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class EncryptionDecryptionService {

  constructor() { }

  // Encrypt a string using AES encryption
  encryptString(data: string, key: string): string {
    return CryptoJS.AES.encrypt(data, key).toString();
  }

  // Decrypt an encrypted string using AES decryption
  decryptString(encryptedData: string, key: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}
