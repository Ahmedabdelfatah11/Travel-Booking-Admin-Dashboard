import { Component, inject, Input } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { Auth } from '../../../../core/services/auth';

@Component({
  selector: 'app-tour-agency-layout',
  imports: [RouterOutlet,RouterLink],
  templateUrl: './tour-agency-layout.html',
  styleUrl: './tour-agency-layout.css'
})
export class TourAgencyLayout {
   @Input() isSpecialPage = false;
  auth = inject(Auth);
  router = inject(Router);

  logout() {
    this.auth.Logout();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
   isTourAdmin(): boolean {
    return this.auth.hasRole('TourAdmin');
  }

}
