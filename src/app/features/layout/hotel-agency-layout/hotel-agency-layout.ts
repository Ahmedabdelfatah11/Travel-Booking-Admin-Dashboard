import { Component, inject, Input } from '@angular/core';
import { Router, RouterModule } from "@angular/router";
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-hotel-agency-layout',
  imports: [RouterModule],
  templateUrl: './hotel-agency-layout.html',
  styleUrl: './hotel-agency-layout.css'
})
export class HotelAgencyLayout {
   @Input() isSpecialPage = false;
  auth = inject(Auth);
  router = inject(Router);

  logout() {
    this.auth.Logout();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
   isHotelAdmin(): boolean {
    return this.auth.hasRole('HotelAdmin');
  }
}
