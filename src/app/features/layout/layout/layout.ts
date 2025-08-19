import { Component, inject, Input } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router'; 
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet,RouterLink],
  templateUrl: './layout.html',
  standalone:true,
  styleUrl: './layout.css'
})
export class Layout {
    company: any;  
    @Input() isSpecialPage = false;
  auth = inject(Auth);
  router = inject(Router);
  logout() {
    this.auth.Logout();
    this.router.navigate(['/login']);
  }
   isSuperAdmin(): boolean {
    return this.auth.hasRole('SuperAdmin');
  }
}
