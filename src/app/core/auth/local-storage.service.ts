import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  constructor() { }

  // Store data in local storage
  setItem(key: string, value: any): void {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  }

  // Retrieve data from local storage
  getItem(key: string): any {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }

  // Remove item from local storage
  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  // Clear all items from local storage
  clear(): void {
    localStorage.clear();
  }

  // Store data in local storage with cookie-like API
  setCookies(key: string, value: any): void {
    this.setItem(key, value);
  }

  // Retrieve data from local storage with cookie-like API
  getCookies(key: string): any {
    return this.getItem(key);
  }

  // Remove data from local storage with cookie-like API
  removeCookies(key: string): void {
    this.removeItem(key);
  }

  // Clear all data from local storage with cookie-like API
  removeAllCookies(): void {
    this.clear();
  }
}
