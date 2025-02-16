import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { WebsiteComponent } from './website/website.component';
import { DocregisterComponent } from './docregister/docregister.component';
import { BookingformComponent } from './bookingform/bookingform.component';
import { BlogsComponent } from './blogs/blogs.component';
import { AdminComponent } from './admin/admin.component';
import { ChatComponent } from './chat/chat.component';
import { HoslistComponent } from './hoslist/hoslist.component';
import { DocdashComponent } from './docdash/docdash.component';
import { HospitalComponent } from './hospital/hospital.component';
import { MypatientsComponent } from './mypatients/mypatients.component';
import { AdminprofileComponent } from './adminprofile/adminprofile.component';
import { DoctorprofileComponent } from './doctorprofile/doctorprofile.component';
import { DocsearchComponent } from './docsearch/docsearch.component';
import { AdminsettingComponent } from './adminsetting/adminsetting.component';
import { HistoryComponent } from './history/history.component';
import { VideocallComponent } from './videocall/videocall.component';
import { PatientlistComponent } from './patientlist/patientlist.component';
import { DoctorlistComponent } from './doctorlist/doctorlist.component';
import { CalendarComponent } from './calendar/calendar.component';
import { AuthGuard } from './core/auth/auth.guard'; // Import the AuthGuard
import { SearchComponent } from './search/search.component';

const routes: Routes = [
  {
    path:'',
    redirectTo:'website',
    pathMatch:'full'
  },
  {
    path:'searchhospital',
    component:SearchComponent
  },
  {
    path:'scheduler',
    component:CalendarComponent,
    canActivate: [AuthGuard]

  },
  {
    path:'doctorlist',
    component:DoctorlistComponent,
    canActivate: [AuthGuard]
  },
  {
    path:'patientlist',
    component:PatientlistComponent,
    canActivate: [AuthGuard]
  },
  {
    path:'videocall',
    component:VideocallComponent,
    canActivate: [AuthGuard]
  },
  {
    path:'my-appointment',
    component:HistoryComponent,
    canActivate: [AuthGuard]
  },
  {
    path:'admin-setting',
    component:AdminsettingComponent,
    canActivate: [AuthGuard]
  },
  {
    path:'search',
    component:DocsearchComponent,
    canActivate: [AuthGuard]
  },
  {
    path:'profilesettings',
    component:DoctorprofileComponent,
    canActivate: [AuthGuard]
  },
  {
    path:'admin-profile',
    canActivate: [AuthGuard],
    component:AdminprofileComponent
  },
  {
    path:'mypatients',
    component:MypatientsComponent,
    canActivate: [AuthGuard]
  },
  {
    path:'hospital',
    component:HospitalComponent,
    canActivate: [AuthGuard]
  },
  {
    path:'hospitallist',
    component:HoslistComponent,
    canActivate: [AuthGuard]
  },
  {
    path:'doctor-dashboard',
    component:DocdashComponent,
    canActivate: [AuthGuard]
  },
  {
    path:'admin',
    component:AdminComponent,
    canActivate: [AuthGuard]
  },
  {
    path:'chat',
    component:ChatComponent,
    canActivate: [AuthGuard]
  },
  {
    path:'blogs',
    component:BlogsComponent,
    canActivate: [AuthGuard]
  },
  {
    path:'bookingform',
    component:BookingformComponent,
    canActivate: [AuthGuard]
  },
  {
    path:'docregister',
    component:DocregisterComponent,
  },
  {
    path:'website',
    component:WebsiteComponent
  },
  {
    path:'footer',
    component:FooterComponent,
  },
  {
    path:'header',
    component:HeaderComponent
  },
  {
    path:'home',
    component:HomeComponent,
    canActivate: [AuthGuard]
  },
  {
    path:'search-hos',
    component:SearchComponent,
    canActivate: [AuthGuard]
  },
  {
    path:'login',
    component:LoginComponent
  },
  {
    path:'register',
    component:RegisterComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
