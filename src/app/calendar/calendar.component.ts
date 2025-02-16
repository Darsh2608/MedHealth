import { Component } from '@angular/core';
import { Appointment, Service } from './calendar.service';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  providers: [Service],
})
export class CalendarComponent {
  title = 'scheduler';
  appointmentsData: Appointment[];

  currentDate: Date = new Date(2024, 3, 27);

  constructor(service: Service) {
    this.appointmentsData = service.getAppointments();
  }
}
