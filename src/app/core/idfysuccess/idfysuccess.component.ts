import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription, Observable} from 'rxjs';
import {SetAuthenticated} from '../auth/actions/auth.actions';
import {AuthService} from '../auth/auth.service';
import { LoginRedirectComponent } from '../auth/login-redirect/login-redirect.component';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import {ActivatedRoute, Router} from '@angular/router';
import * as appReducer from '../../app.reducer';
import {Store, select} from '@ngrx/store';
import {TranslateService} from '@ngx-translate/core';
import {EncryptDecryptService} from '../auth/encryption-decryption.service';
import {UiControlService} from '../../shared/uicontrol.service';
import {LocalStorageService} from '../auth/local-storage.service';
import {AppSettings} from 'src/app/appSettings';

@Component({
  selector: 'app-idfysuccess',
  templateUrl: './idfysuccess.component.html',
  styleUrls: ['./idfysuccess.component.scss'],
  providers: [AuthService, TranslateService, EncryptDecryptService, LocalStorageService],
})
export class IdfysuccessComponent implements OnInit, OnDestroy {

  sessionId: any;
  externalId: any;

  isLoading$: Observable<boolean>;
  private idfySubscription: Subscription;
  errorMessages: any[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private store: Store<{ ui: appReducer.State }>,
    private localStorageService: LocalStorageService,
    private encryptionDecryptionService: EncryptDecryptService,
    private uiControlService: UiControlService,
    public dialog: MatDialog
  ) {
    this.errorMessages = [];
    this.sessionId = '';
    this.externalId = '';

  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.sessionId = params['requestid'];
      this.externalId = params['externalid'];
    });
    this.authenticateUser();
  }

  loginRedirect(logindata): any {

    if (logindata.has_multiple_access) {
      const dialogRef = this.dialog.open(LoginRedirectComponent, {
        width: '800px',
        data: logindata
      });

      dialogRef.afterClosed().subscribe((result) => {
        console.log('The dialog was closed');
      });
    } else {
      const activeUserProfile: any = logindata.UserProfile[0];
      this.localStorageService.removeCookies('active_profile');
      this.localStorageService.setCookies(
        'active_profile',
        this.encryptionDecryptionService.encryptString(
          JSON.stringify(activeUserProfile)
        ));
      if (activeUserProfile.user_role_id === AppSettings.ACCOUNTANT_ROLE) {
        // this.router.navigate(['/client/tasks']).then();
        this.router.navigate(['/client/my-page']).then();
        // (<any>window).location = "/client/tasks";
      }
      else if (activeUserProfile.user_role_id === AppSettings.CONTACTPERSON_ROLE) {
        this.router.navigate(['/client/company/' + activeUserProfile.company_id]).then();
        // (<any>window).location = "/client/contact-person/oversikt";
      }
      else {
        this.router.navigate(['/']).then();
        // (<any>window).location = "/";
      }
    }
  }

  authenticateUser() {
    console.log('sessionId', this.sessionId);
    console.log('providerid', this.externalId);
    if (this.sessionId !== '' && this.externalId !== '') {
      this.idfySubscription = this.authService.loginIdfy(this.sessionId, this.externalId).subscribe(
        (response) => {
          console.log('idfy success', response);
          // if got user object successfully redirect to authentication page
          let logindata = response.data.userObj;
          this.store.dispatch(new SetAuthenticated());
          this.localStorageService.setCookies(
            'access_token',
            logindata.accessToken);

          this.localStorageService.setCookies(
            'user_data',
            this.encryptionDecryptionService.encryptString(
              JSON.stringify(logindata)
            ));

          this.localStorageService.setCookies(
            'is_admin',
            logindata.isAdmin);

          this.localStorageService.setCookies(
            'user_type',
            logindata.userType);

          this.localStorageService.setExpiry();

          // Redirecting to dashboard
          if (logindata.isAdmin == true) {
            let active_profile = this.createActiveProfile(logindata);
            this.localStorageService.removeCookies('active_profile');
            this.localStorageService.setCookies(
            'active_profile',
            this.encryptionDecryptionService.encryptString(
              JSON.stringify(active_profile)
            ));
            this.router.navigate(['/admin/clients']);
            // (<any>window).location = "/admin/clients";
          } else if (logindata.isClientAdmin == true) {
            let active_profile = this.createActiveProfile(logindata);
            this.localStorageService.removeCookies('active_profile');
            this.localStorageService.setCookies(
            'active_profile',
            this.encryptionDecryptionService.encryptString(
              JSON.stringify(active_profile)
            ));
            // this.router.navigate(['/client/tasks']);
            this.router.navigate(['/client/my-page']);
            // (<any>window).location = "/client/tasks";
          } else {
            this.loginRedirect(logindata);
          }
        },
        (error) => {
          console.log('idfy success error', error);
        }
      );
    }
    // else {
    //   this.router.navigate(['/']);
    // }
  }

  createActiveProfile(data) {

    let activeUserProfile = {
      user_id: data.id,
      user_profile_id: 0,
      user_role_id: data.roles[0].id,
      name: data.name,
      mobile: null,
      email: data.email,
      client_id: (data.clients.length > 0) ? data.clients[0].id : 0,
      company_id: 0,
      photo: data.photo,
      has_multiple_access: false
    };

    return activeUserProfile;
  }

  ngOnDestroy() {

  }

}
