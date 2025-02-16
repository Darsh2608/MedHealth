import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {LoginService} from "./login.service";
import { LocalStorageService } from '../core/auth/local-storage.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
    constructor(private router: Router,
         private loginService: LoginService,
         private localStorage: LocalStorageService,
        ) {
    }

    ngOnInit(): void {
    }

    website() {
        this.router.navigate(['/website']);
    }

    login() {
        const usernameElement = document.getElementById('username') as HTMLInputElement;
        const passwordElement = document.getElementById('password') as HTMLInputElement;
    
        if (usernameElement && passwordElement) {
            const email = usernameElement.value;
            const password = passwordElement.value;
    
            this.loginService.login(email, password).subscribe({
                next: (response) => {
                    // Handle successful login
                    console.log('Login successful', response);
                    this.localStorage.setCookies('token', response.token); // Example: Set 'token' cookie for 30 days
                    this.localStorage.setCookies('userData', response.user); // Example: Set 'token' cookie for 30 days

                    if (response.user.type == 1) {
                     // Redirect to website or perform other actions as needed
                    this.router.navigate(['/doctor-dashboard']);
                    } else {
                      // Redirect to website or perform other actions as needed
                    this.router.navigate(['/website']);
                    }
                    
                },
                error: (error) => {
                    // Handle login error
                    console.error('Login failed:', error);
                    // You can display error messages to the user or perform other actions
                }
            });
        } else {
            console.error('Username or password element not found');
            // Handle the case where the elements are not found on the page
        }
    }
    
}
