import { Component } from '@angular/core';

@Component({
  selector: 'app-adminsetting',
  templateUrl: './adminsetting.component.html',
  styleUrls: ['./adminsetting.component.scss']
})
export class AdminsettingComponent {
  isCollapsed = false;

  ngOnInit(): void {}

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }
}
