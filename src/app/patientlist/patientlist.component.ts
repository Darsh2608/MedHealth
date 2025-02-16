import { Component } from '@angular/core';

interface Patient {
  id: number;
  name: string;
  age: number;
  address: string;
  phone: string;
  lastVisit: string;
  paid: boolean;
}

@Component({
  selector: 'app-patientlist',
  templateUrl: './patientlist.component.html',
  styleUrls: ['./patientlist.component.scss']
})
export class PatientlistComponent {
  isCollapsed = false;

  ngOnInit(): void {}

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  patients: Patient[] = [
    { id: 1, name: "John Doe", age: 30, address: "123 Elm St", phone: "123-456-7890", lastVisit: "2023-04-10", paid: true },
    { id: 2, name: "Jane Smith", age: 25, address: "456 Maple St", phone: "234-567-8901", lastVisit: "2023-04-15", paid: false },
    { id: 3, name: "John Doe", age: 30, address: "123 Elm St", phone: "123-456-7890", lastVisit: "2023-04-10", paid: true },
    { id: 4, name: "Jane Smith", age: 25, address: "456 Maple St", phone: "234-567-8901", lastVisit: "2023-04-15", paid: false },
    { id: 5, name: "John Doe", age: 30, address: "123 Elm St", phone: "123-456-7890", lastVisit: "2023-04-10", paid: true },
    { id: 6, name: "Jane Smith", age: 25, address: "456 Maple St", phone: "234-567-8901", lastVisit: "2023-04-15", paid: false },
    { id: 7, name: "John Doe", age: 30, address: "123 Elm St", phone: "123-456-7890", lastVisit: "2023-04-10", paid: true },
    { id: 8, name: "Jane Smith", age: 25, address: "456 Maple St", phone: "234-567-8901", lastVisit: "2023-04-15", paid: false },
    { id: 9, name: "John Doe", age: 30, address: "123 Elm St", phone: "123-456-7890", lastVisit: "2023-04-10", paid: true },
    { id: 10, name: "Jane Smith", age: 25, address: "456 Maple St", phone: "234-567-8901", lastVisit: "2023-04-15", paid: false },
    { id: 11, name: "Alice Johnson", age: 28, address: "789 Oak St", phone: "345-678-9012", lastVisit: "2023-04-20", paid: true }
];

}
