import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppRoutingModule } from './../app-routing.module';
import { MaterialModule } from './../material.module';
import { AuthModule } from './auth/auth.module';
import { AuthService } from './auth/auth.service';
import { LoginRedirectService } from './auth/login-redirect/loginRedirect.service';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { IdfysuccessComponent } from './idfysuccess/idfysuccess.component';
import { IdfyerrorComponent } from './idfyerror/idfyerror.component';
import { IdfyabortComponent } from './idfyabort/idfyabort.component';

@NgModule({
  declarations: [IdfysuccessComponent, IdfyerrorComponent, IdfyabortComponent],
  imports: [
    CommonModule,
    AuthModule,
    MaterialModule,
    AppRoutingModule,
    FormsModule,
    SharedModule,
  ],
  exports: [MaterialModule],
  providers: [AuthService],
})
export class CoreModule {
  constructor(
    @Optional()
    @SkipSelf()
    parentModule: CoreModule
  ) {
    // Import guard
    if (parentModule) {
      throw new Error(
        `${parentModule} has already been loaded. Import Core module in the AppModule only.`
      );
    }
  }
}
