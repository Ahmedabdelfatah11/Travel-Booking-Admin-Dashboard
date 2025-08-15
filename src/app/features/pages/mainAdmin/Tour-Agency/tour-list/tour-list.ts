import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-tour-list',
  imports: [CommonModule],
  templateUrl: './tour-list.html',
  styleUrl: './tour-list.css'
})
export class TourList {
  tours: any[] = [
    { id: 110, image: 'assets/imgs/tour1.jpg', title: 'Visit', country: 'USA', duration: '1 Day', cost: '100$', status: 'Active' },
    { id: 120, image: 'assets/imgs/tour2.jpg', title: 'Business Tour', country: 'UAE', duration: '3 days', cost: '350$', status: 'Expired' },
    { id: 212, image: 'assets/imgs/tour3.jpg', title: 'Vacational Tour', country: 'Canada', duration: '1 Week', cost: '200$', status: 'Draft' },
    { id: 214, image: 'assets/imgs/tour4.jpg', title: 'Business Tour', country: 'Paris', duration: '4 Days', cost: '300$', status: 'Featured' },
    { id: 215, image: 'assets/imgs/tour5.jpg', title: 'Vacational Tour', country: 'USA', duration: '1 Day', cost: '100$', status: 'Featured' },
  ];

  getStatusClass(status: string): string {
    switch (status) {
      case 'Active': return 'badge bg-success';
      case 'Expired': return 'badge bg-danger';
      case 'Draft': return 'badge bg-warning';
      case 'Featured': return 'badge bg-primary';
      default: return 'badge bg-secondary';
    }
  }
}