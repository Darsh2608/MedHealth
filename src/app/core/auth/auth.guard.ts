import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const isAuthenticated = this.checkAuthentication(); // Example method to check if the user is authenticated

    if (isAuthenticated) {
      return true; // Allow access to the route
    } else {
      this.router.navigate(['/login']); // Redirect to the login page
      return false; // Block access to the route
    }
  }

  private checkAuthentication(): boolean {
    // Logic to check if the user is authenticated (e.g., check for a login token in local storage)
    const token = localStorage.getItem('token');
    return !!token; // Returns true if token is present, false otherwise
  }
}
