import { Component, inject, Input } from '@angular/core';
import { Auth } from '../../../core/services/auth';
import { Router, RouterModule } from "@angular/router";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-car-rental-agency-layout',
  imports: [RouterModule,CommonModule,FormsModule],
  templateUrl: './car-rental-agency-layout.html',
  styleUrl: './car-rental-agency-layout.css'
})
export class CarRentalAgencyLayout {
 @Input() isSpecialPage = false;
  auth = inject(Auth);
  router = inject(Router);

  logout() {
    this.auth.Logout();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
   isCarAdmin(): boolean {
    return this.auth.hasRole('CarRentalAdmin');
  }
}
