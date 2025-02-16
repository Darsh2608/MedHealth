import { Component } from '@angular/core';
import { BookingService } from '../bookingform/booking.service';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent {
  appointmentData: any;
  constructor(private bookingService: BookingService) {
  
  }

  ngOnInit(): void {
    this.bookAppointmentLs();
    // Additional initialization logic if needed
  }
  bookAppointmentLs(): void {
    this.bookingService.bookAppointmentList().subscribe(
      (response) => {
        this.appointmentData = response;
        console.log('Booking successful list:', response);
      },
      (error) => {
        console.error('Error booking appointment:', error);
      }
    );
}
}
