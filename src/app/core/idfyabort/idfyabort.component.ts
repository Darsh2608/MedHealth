import { Component, OnInit } from '@angular/core';
import { AppSettings } from '../../appSettings';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UiControlService } from '../../shared/uicontrol.service';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { LocalStorageService } from '../auth/local-storage.service';
const authUrl = AppSettings.API_ENDPOINT + '/auth/';

@Component({
  selector: 'app-idfyabort',
  templateUrl: './idfyabort.component.html',
  styleUrls: ['./idfyabort.component.scss']
})
export class IdfyabortComponent implements OnInit {
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
