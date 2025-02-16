import { Component, ElementRef, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { HospitalService } from './hospital.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { LocalStorageService } from '../core/auth/local-storage.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  locationQuery: string = ''; // User's search query
  currentLocation: string = ''; // Default or current location
  hospitalQuery: string = ''; // New property for hospital name search
  doctorQuery: string = ''; // New property for doctor name search
  searchResults: any[] = [];
  showSuggestions: boolean = false;
  private destroy$: Subject<void> = new Subject<void>();
  private searchSubscription: Subject<string> = new Subject<string>();
  loginData: any;

  constructor(
    private hospitalService: HospitalService,
    private http: HttpClient,
    private elementRef: ElementRef ,// Inject ElementRef
    private router: Router,
    private localStorage: LocalStorageService,
  ) {}

  ngOnInit(): void {
    // Retrieve and set the default or current location here
    this.getCurrentLocation();
    // Set up subscription for search
    this.setupSearchSubscription();
    this.loginData = this.localStorage.getCookies('userData');
  }

  location(hospitalName: string) {
    console.log('------------------------', hospitalName)
    // Navigate to the hospital click page and pass the selected hospital name
    this.router.navigate(['/hospital'], { queryParams: { name: hospitalName } });
  }
  
  hospital(hospitalName: string) {
    // Navigate to the hospital click page and pass the selected hospital name
    this.router.navigate(['/search-hos'], { queryParams: { name: hospitalName } });
}


getCurrentLocation() {
  const options: PositionOptions = {
    enableHighAccuracy: true, // Request high accuracy
    timeout: 10000, // Increase timeout to 10 seconds (adjust as needed)
    maximumAge: 0 // Maximum age of cached location data
  };

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        console.log('Geolocation Coordinates:', { latitude, longitude });
        this.getLocationName(latitude, longitude);
      },
      error => {
        console.error('Geolocation error:', error.message);
        // Handle specific geolocation errors here
        if (error.code === error.PERMISSION_DENIED) {
          console.error('User denied geolocation request.');
        } else if (error.code === error.TIMEOUT) {
          console.error('Geolocation request timed out.');
        } else {
          console.error('Unknown geolocation error.');
        }
      },
      options // Pass options to getCurrentPosition
    );
  } else {
    console.error('Geolocation is not supported by this browser.');
    // Handle the case where geolocation is not supported by the browser
  }
}

getLocationName(latitude: number, longitude: number) {
  // Use reverse geocoding service to get location name based on coordinates
  const apiUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;

  this.http.get(apiUrl).subscribe(
    (data: any) => {
      if (data && data.address && data.address.suburb) {
        const suburb = data.address.suburb;
        console.log('Suburb:', suburb);
        this.currentLocation = suburb;
      } else {
        console.error('Suburb data not found in API response.');
        // Handle the case where suburb data is not available or structure has changed
      }
    },
    error => {
      console.error('Error fetching location name:', error);
      // Handle API request errors here
    }
  );
}



  setupSearchSubscription(): void {
    this.searchSubscription
      .pipe(
        debounceTime(300), // Debounce for 300ms
        distinctUntilChanged(), // Only emit if the value has changed
        takeUntil(this.destroy$) // Unsubscribe when component is destroyed
      )
      .subscribe((query: string) => {
        if (query.trim() !== '') {
          this.search(query); // Pass the query to the search method
        } else {
          this.showSuggestions = false; // Hide suggestions if query is empty
          this.searchResults = []; // Clear search results
        }
      });
  }

  search(query: string): void {
    // Call the hospital service to fetch search results based on the query
    const resultQuery = query ? query : this.currentLocation;
    this.hospitalService.searchAll(resultQuery).subscribe(
      (results: any[]) => {
        this.searchResults = results; // Update the search results array
        this.showSuggestions = true; // Show the suggestions dropdown
      },
      error => {
        console.error('Error fetching search results:', error);
        // Handle errors if needed
      }
    );
  }

  fetchResults(query: string): void {
    // Trigger search for location
    this.searchSubscription.next(query);
    
    // Trigger search for hospital name
    this.search(query);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showSuggestions = false; // Close the dropdown when clicking outside
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubscription.complete();
  }
}
