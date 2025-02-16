import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LocalStorageService } from '../core/auth/local-storage.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  loginData: any;

  constructor(private router: Router, 
    private localStorage: LocalStorageService,

  ) { }

  ngOnInit(): void {
    this.loginData = this.localStorage.getCookies('userData');
  }

  login() {
    this.router.navigate(['/login']);
  }

  bookingform() {
    this.router.navigate(['/bookingform']);
  }

  hospital() {
    this.router.navigate(['/hospital']);
  }

  logout() {
    this.localStorage.clear();
  }
}
