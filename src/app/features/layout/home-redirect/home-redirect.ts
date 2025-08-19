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
    // ✅ Only redirect if not already on /login
    if (this.router.url === '/login') {
      return; // Let login page render
    }

    if (this.auth.hasRole('SuperAdmin')) {
      this.router.navigate(['/admin/dashboard'], { replaceUrl: true });
    } else if (this.auth.hasRole('TourAdmin')) {
      this.router.navigate(['/tour-admin/dashboard'], { replaceUrl: true });
    } else if (this.auth.isLoggedIn()) {
      this.router.navigate(['/unauthorized'], { replaceUrl: true });
    }
    // ✅ If not logged in, do nothing — let the user go to /login
  }
}