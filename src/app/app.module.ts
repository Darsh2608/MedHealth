import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { WebsiteComponent } from './website/website.component';
import { BookingformComponent } from './bookingform/bookingform.component';
import { DocregisterComponent } from './docregister/docregister.component';
import { BlogsComponent } from './blogs/blogs.component';
import {FormsModule} from "@angular/forms";
import {HttpClientModule} from "@angular/common/http";
import { AdminComponent } from './admin/admin.component';
import { ChatComponent } from './chat/chat.component';
import { DocdashComponent } from './docdash/docdash.component';
import { HoslistComponent } from './hoslist/hoslist.component';
import { HospitalComponent } from './hospital/hospital.component';
import { MypatientsComponent } from './mypatients/mypatients.component';
import { AdminprofileComponent } from './adminprofile/adminprofile.component';
import { DoctorprofileComponent } from './doctorprofile/doctorprofile.component';
import { DocsearchComponent } from './docsearch/docsearch.component';
import { AdminsettingComponent } from './adminsetting/adminsetting.component';
import { HistoryComponent } from './history/history.component';
import { VideocallComponent } from './videocall/videocall.component';
import { DoctorlistComponent } from './doctorlist/doctorlist.component';
import { PatientlistComponent } from './patientlist/patientlist.component';
import { CalendarComponent } from './calendar/calendar.component';
import { DxSchedulerModule } from 'devextreme-angular';
import { SearchComponent } from './search/search.component';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LoginComponent,
    RegisterComponent,
    HeaderComponent,
    FooterComponent,
    WebsiteComponent,
    BookingformComponent,
    DocregisterComponent,
    BlogsComponent,
    AdminComponent,
    ChatComponent,
    DocdashComponent,
    HoslistComponent,
    HospitalComponent,
    MypatientsComponent,
    AdminprofileComponent,
    DoctorprofileComponent,
    DocsearchComponent,
    AdminsettingComponent,
    HistoryComponent,
    VideocallComponent,
    DoctorlistComponent,
    PatientlistComponent,
    CalendarComponent,
    SearchComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    DxSchedulerModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
