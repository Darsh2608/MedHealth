import { Component, OnInit } from '@angular/core';
import { AppSettings } from '../../appSettings';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { UiControlService } from '../../shared/uicontrol.service';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { of } from 'rxjs';
import { LocalStorageService } from '../auth/local-storage.service';
const authUrl = AppSettings.API_ENDPOINT + '/auth/';

@Component({
  selector: 'app-idfyerror',
  templateUrl: './idfyerror.component.html',
  styleUrls: ['./idfyerror.component.scss']
})
export class IdfyerrorComponent implements OnInit {
  private headers: HttpHeaders;

  constructor( private router: Router,
    private http: HttpClient,
    private localStorageService: LocalStorageService,
    private authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private uiControlService: UiControlService) {
      this.headers = new HttpHeaders()
      .append('Accept', 'application/json')
      .append('Authorization', this.localStorageService.getCookies('access_token'));
     }

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe(params => {
      const request_id = params['requestid'];
      const external_id = params['externalid'];
      var data = { external_id: external_id, request_id: request_id };
      const body = JSON.stringify(data);
      let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
      this.http.post(authUrl + 'reset-idfy-request' , body, { headers: headers }).subscribe(
        (response) => {},
        (error) => {},
        () => {
          this.router.navigate(['/']);
        }
      );  
    });
  }
}
