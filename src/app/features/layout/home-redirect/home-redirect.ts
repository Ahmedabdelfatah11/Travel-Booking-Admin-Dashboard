// home-redirect.component.ts
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../../core/services/auth';

@Component({
  template: '',
  standalone: true
})
export class HomeRedirect {
  private auth = inject(Auth);
  private router = inject(Router);

  constructor() {

    if (this.router.url === '/login') {
      return; // Let login page render
    }

    if (this.auth.hasRole('SuperAdmin')) {
      this.router.navigate(['/admin/dashboard'], { replaceUrl: true });
    }
    else if (this.auth.hasRole('TourAdmin')) {
      this.router.navigate(['/tour-admin/dashboard'], { replaceUrl: true });
    }
    else if (this.auth.hasRole('FlightAdmin')) {
      this.router.navigate(['/flight-admin/dashboard'], { replaceUrl: true });
    }
    else if (this.auth.hasRole('HotelAdmin')) {
      this.router.navigate(['/hotel-admin/dashboard'], { replaceUrl: true });
    }
    else if (this.auth.hasRole('CarRentalAdmin')) {
      this.router.navigate(['/car-admin/dashboard'], { replaceUrl: true });
    }
    else if (this.auth.isLoggedIn()) {
      this.router.navigate(['/unauthorized'], { replaceUrl: true });
    }

  }
}