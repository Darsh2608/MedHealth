import { Component } from '@angular/core';  
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService } from './booking.service';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-bookingform',
  templateUrl: './bookingform.component.html',
  styleUrls: ['./bookingform.component.scss']
})
export class BookingformComponent {
  bookingForm: FormGroup;
  hospitalName: string | null = null;

  constructor(private formBuilder: FormBuilder, private bookingService: BookingService, private activatedRoute: ActivatedRoute, private router: Router) {
    this.bookingForm = this.formBuilder.group({
      patientName: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      gender: ['', Validators.required], // Set required validator for gender
      hospital: ['', Validators.required],
      consulting: ['', Validators.required],
      location: ['', Validators.required],
      services: ['', Validators.required],
      appointmentDate: ['', Validators.required],
      appointmentTime: ['', Validators.required]
    });

    // Custom validation for gender radio buttons
    this.bookingForm.get('gender')?.setValidators(this.validateGender);
    this.bookingForm.get('hospital')?.patchValue(this.hospitalName);
  }

  ngOnInit(): void {
    // Subscribe to changes in query parameters
    this.activatedRoute.queryParams.subscribe(params => {
      // Check if 'name' parameter exists in the query params
      if (params['name']) {
        this.hospitalName = params['name'];
        // You can perform additional actions here based on the hospital name
        console.log('Hospital Name 78:', this.hospitalName);
        this.bookingForm.get('hospital')?.patchValue(this.hospitalName);

      }
    });
  }

  // Custom validator function for gender radio buttons
  validateGender(control: AbstractControl): { [key: string]: boolean } | null {
    const value = control.value;
    if (value !== 'male' && value !== 'female' && value !== 'other') {
      return { 'invalidGender': true }; // Return validation error if an invalid option is selected
    }
    return null; // Validation passed
  }

  bookAppointment(): void {
    if (this.bookingForm.valid) {
      const formData = this.bookingForm.value;
      console.log('===============data', formData);
      // Call your booking service method here to submit the form data
      this.bookingService.bookAppointment(formData).subscribe(
        (response) => {
          console.log('Booking successful:', response);
              this.router.navigate(['/my-appointment']);
          // Reset the form after successful booking
          this.bookingForm.reset();
        },
        (error) => {
          console.error('Error booking appointment:', error);
        }
      );
    } else {
      // Handle form validation errors if needed
    }
  }

  bookAppointmentLs(): void {
      this.bookingService.bookAppointmentList().subscribe(
        (response) => {
          console.log('Booking successful list:', response);
        },
        (error) => {
          console.error('Error booking appointment:', error);
        }
      );
  }

 
}


