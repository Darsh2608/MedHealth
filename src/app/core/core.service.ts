// import { HttpClient,HttpHeaders,HttpResponse } from "@angular/common/http";
import { Injectable } from '@angular/core';
import { AppSettings } from "../appSettings";
// import { map,catchError } from "rxjs/operators"; 
// import { Observable } from 'rxjs';
// const loginUrl = AppSettings.API_ENDPOINT + "/auth/signin/";

@Injectable({
  providedIn: 'root'
})
export class CoreService {

//  constructor(private http: HttpClient)  { }

  // Login(user): Observable<LoginResponse> {
  //   const body = JSON.stringify(user);
  //   let headers = new HttpHeaders({ "Content-Type": "application/json" });
  //   return this.http
  //     .post(loginUrl, body, { headers: headers })
  //     .pipe(map((response: any ) => response ),catchError((error: any)=> error ))
  // }
}
