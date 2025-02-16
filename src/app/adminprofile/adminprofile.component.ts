import { Component } from '@angular/core';

@Component({
  selector: 'app-adminprofile',
  templateUrl: './adminprofile.component.html',
  styleUrls: ['./adminprofile.component.scss']
})
export class AdminprofileComponent {
  isCollapsed = false;

  ngOnInit(): void {}

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  activeTab: string = 'about';  // Default to 'about' tab being active

  setActiveTab(tabName: string) {
      this.activeTab = tabName;
  }
}
