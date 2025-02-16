import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private headers: HttpHeaders;

  constructor(private http: HttpClient) {
    this.headers = new HttpHeaders().set('Content-Type', 'application/json');
  }

  bookAppointment(appointmentData: any): Observable<any> {
    const bookingUrl = `${environment.config.API_ENDPOINT}/bookings/create`; // Assuming your booking route is '/bookings'
    const body = JSON.stringify(appointmentData);

    return this.http.post(bookingUrl, body, { headers: this.headers }).pipe(
      map((response: any) => response),
      catchError(err => throwError(err.error.errors))
    );
  }

  bookAppointmentList(): Observable<any> {
    const bookingUrl = `${environment.config.API_ENDPOINT}/bookings/list`;

    return this.http.get<any>(bookingUrl, { headers: this.headers }).pipe(
      map((response: any) => response),
      catchError(err => throwError(err.error.errors)) // Adjust this based on your API error structure
    );
  }
}
