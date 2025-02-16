import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { catchError, map, Observable, throwError } from "rxjs";
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private headers: HttpHeaders;

  constructor(private http: HttpClient) {
    this.headers = new HttpHeaders().set('Content-Type', 'application/json');
  }

  login(email: string, password: string): Observable<any> {
    const loginUrl = `${environment.config.API_ENDPOINT}/auth/login`;
    const body = JSON.stringify({ email, password });

    return this.http.post(loginUrl, body, { headers: this.headers }).pipe(
      map((response: any) => response),
      catchError(err => throwError(err.error.errors))
    );
  }

  register(username: string, email: string, password: string, type: any): Observable<any> {
    const registerUrl = `${environment.config.API_ENDPOINT}/user/users`;
    const body = JSON.stringify({ username, email, password, type });

    return this.http.post(registerUrl, body, { headers: this.headers }).pipe(
      map((response: any) => response),
      catchError(err => throwError(err.error.errors))
    );
  }

  getUserData(): Observable<any> {
    const userDataUrl = `${environment.config.API_ENDPOINT}/user`;
    return this.http.get(userDataUrl).pipe(
      map((response: any) => response),
      catchError(err => throwError(err.error.errors))
    );
  }
}
