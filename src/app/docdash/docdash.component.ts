import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LocalStorageService } from '../core/auth/local-storage.service';

@Component({
  selector: 'app-docdash',
  styleUrls: ['./docdash.component.scss'],
  templateUrl: './docdash.component.html',
})
export class DocdashComponent{
  activeTab: string = 'upcoming';  // Default to 'today' tab being active
  constructor(private router: Router, 
    private localStorage: LocalStorageService,

  ) { }

  setActiveTab(tabName: string) {
      this.activeTab = tabName;
  }

  logout() {
    this.localStorage.clear();
  }
}