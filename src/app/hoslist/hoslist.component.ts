import { Component } from '@angular/core';

@Component({
  selector: 'app-hoslist',
  templateUrl: './hoslist.component.html',
  styleUrls: ['./hoslist.component.scss']
})
export class HoslistComponent {
  activeTab: string = 'overview';  // Default to 'overview' tab being active

  setActiveTab(tabName: string) {
      this.activeTab = tabName;
  }
}
