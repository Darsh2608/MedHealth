import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '../login/login.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  constructor(private router: Router, private loginService: LoginService) { }

  ngOnInit(): void {
  }

  website() {
    this.router.navigate(['/website']);
  }

  register() {
    const usernameElement = document.getElementById('username') as HTMLInputElement;
    const passwordElement = document.getElementById('password') as HTMLInputElement;
    const emailElement = document.getElementById('email') as HTMLInputElement;

    if (usernameElement && passwordElement) {
        const username = usernameElement.value;
        const email = emailElement.value;
        const password = passwordElement.value;
        const type = 2;
     
        this.loginService.register(username, email, password, type).subscribe({
            next: (response) => {
                // Handle successful login
                console.log('Login successful', response);
                // Redirect to website or perform other actions as needed
                this.router.navigate(['/login']);
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
