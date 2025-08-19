import { Component, inject, Input } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-flight-agency-layout',
  imports: [RouterOutlet,RouterLink],
  templateUrl: './flight-agency-layout.html',
  styleUrl: './flight-agency-layout.css'
})
export class FlightAgencyLayout {
   @Input() isSpecialPage = false;
  auth = inject(Auth);
  router = inject(Router);

  logout() {
    this.auth.Logout();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
   isFlightAdmin(): boolean {
    return this.auth.hasRole('FlightAdmin');
  }
}


