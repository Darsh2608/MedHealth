import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-docsearch',
  templateUrl: './docsearch.component.html',
  styleUrls: ['./docsearch.component.scss']
})
export class DocsearchComponent {
  hospitalName: string | null = null;


  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}


  ngOnInit(): void {
    // Subscribe to changes in query parameters
    this.activatedRoute.queryParams.subscribe(params => {
      // Check if 'name' parameter exists in the query params
      if (params['name']) {
        this.hospitalName = params['name'];
        // You can perform additional actions here based on the hospital name
        console.log('Hospital Name 123:', this.hospitalName);
      }
    });
  }
}
