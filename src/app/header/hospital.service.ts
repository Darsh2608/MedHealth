import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable, catchError, filter, forkJoin, map, of } from "rxjs";
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HospitalService {
  private headers: HttpHeaders;
  private baseUrl = environment.config.API_ENDPOINT; // Assuming apiUrl is defined in environment.ts

  constructor(private http: HttpClient) {
    this.headers = new HttpHeaders().set('Content-Type', 'application/json');
  }

  searchAll(data: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/hospital/searchByLocation?data=${data}`, { headers: this.headers });
  }


}
