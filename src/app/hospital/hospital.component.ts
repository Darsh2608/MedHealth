import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-hospital',
  templateUrl: './hospital.component.html',
  styleUrls: ['./hospital.component.scss']
})
export class HospitalComponent {
  hospitalName: string | undefined;
  hostLocation: any;
  hospitals: { 
    name: string, 
    specialties: string[],
    ratings: number, 
    location: string, 
    services: string[],
    googleMapLink: string,
    consultationFee: number,
    imageUrl: string
  }[] = [];
  hos: any;
  list: any;
  imageUrls = [
    '../assets/img/images (1).jpeg',
    '../assets/img/images.jpeg',
    '../assets/img/download (2).jpeg',
    '../assets/img/download (1).jpeg',
    '../assets/img/download.jpeg'
  ];
  constructor(
    private route: ActivatedRoute
  ) {
    for (let i = 1; i <= 15; i++) {
      const specialties = this.generateSpecialties();
      const location = this.generateLocation();
      const services = this.generateServices(specialties.length); // Pass the number of specialties
      const googleMapLink = `https://www.google.com/maps?q=${location}`; // Generate Google Maps link dynamically

      const hospital = {
        name: `Hospital ${i}`,
        specialties: specialties,
        ratings: this.generateRandomRating(),
        location: location,
        services: services,
        googleMapLink: googleMapLink,
        consultationFee: Math.floor(Math.random() * 500) + 100,
        imageUrl: this.imageUrls[this.getRandomIndex()]
      };
        this.hospitals.push(hospital);
    }
  }
  getRandomIndex(): number {
    return Math.floor(Math.random() * this.imageUrls.length);
  }

 // Function to generate random ratings
 generateRandomRating(): number {
  return Math.floor(Math.random() * 5) + 1;
}

// Function to generate random specialties
generateSpecialties(): string[] {
  const specialtiesList = ["Cardiology", "Orthopedics", "General Surgery", "Dermatology", "Neurology"];
  const numSpecialties = Math.floor(Math.random() * 5) + 1; // Generate 1-5 random specialties
  return specialtiesList.slice(0, numSpecialties); // Select a random subset of specialties
}

 // Function to generate random location
  generateLocation(): string {
    const locationsList = ["Manjalpur, Vadodara", "Gotri, Vadodara", "Tandalja, Vadodara", "Sama, Vadodara", "Alkapuri, Vadodara"];
    const randomIndex = Math.floor(Math.random() * locationsList.length);
    return locationsList[randomIndex];
  }

// Function to generate random services
generateServices(numSpecialties: number): string[] {
  const servicesList = ["Dental Fillings", "Teeth Whitening", "Orthopedic Surgery", "Eye Care", "Physical Therapy"];
  if (numSpecialties === 5) { // If all specialties are included, return all services
    return servicesList;
  } else {
    const randomServices = [];
    const numServices = Math.floor(Math.random() * 3) + 1; // Generate 1-3 random services
    for (let i = 0; i < numServices; i++) {
      const randomIndex = Math.floor(Math.random() * servicesList.length);
      randomServices.push(servicesList[randomIndex]);
    }
    return randomServices;
  }
}

// Function to generate random feedback count
generateRandomFeedbackCount(): number {
  return Math.floor(Math.random() * 50) + 1;
}

getMaxHospitalsToShow(location: string): number {
  this.hos = this.hospitals.filter(hospital => hospital.location === location);
  const numHospitals = this.hospitals.filter(hospital => hospital.location === location).length;
  return Math.min(numHospitals, 5); // Limit to a maximum of 5 hospitals
}

  ngOnInit(): void {
    // Retrieve the 'name' query parameter from the route
    this.route.queryParams.subscribe(params => {
      this.hospitalName = params['name'] + ',' + ' Vadodara';
      this.getMaxHospitalsToShow(this.hospitalName);
      // Now you have the hospitalName, you can process it as needed
      console.log('Hospital Name:', this.hospitalName, this.hos);
      this.list = this.hos.length > 0 ? this.hos : this.hospitals;
      // You can also call a method here to fetch data based on the hospitalName
      // this.fetchHospitalData(this.hospitalName);
    });
  }

  // Method to fetch hospital data based on the hospitalName
  // fetchHospitalData(hospitalName: string) {
  //   // Implement your logic to fetch hospital data
  // }

}
