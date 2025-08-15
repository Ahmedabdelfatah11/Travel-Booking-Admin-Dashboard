import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth } from '../../../../core/services/auth';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule,CommonModule , RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  standalone: true
})
export class Login {
  auth = inject(Auth);
  router = inject(Router);
  fb = inject(FormBuilder);

  errMessage = '';
  successMessage = '';
  showPassword = false;
  isLoading = false;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  ngOnInit() {
  if (this.auth.isLoggedIn()) {
    if (this.auth.hasRole('SuperAdmin')) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/unauthorized']);
    }
  }
}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  } 

submitForm() {
  if (this.loginForm.invalid) {
    this.loginForm.markAllAsTouched();
    return;
  }

  this.isLoading = true;
  this.errMessage = '';
  this.successMessage = '';

  const email = this.loginForm.get('email')?.value ?? '';
  const password = this.loginForm.get('password')?.value ?? '';

  this.auth.Login({ email, password }).subscribe({
    next: (response) => {
      this.isLoading = false;

      // ✅ Define allowed admin roles
      const allowedRoles = [
        'SuperAdmin',
        'HotelAdmin',
        'FlightAdmin',
        'CarRentalAdmin',
        'TourAdmin'
      ];

      const userRoles = response.roles || [];
      const hasAccess = userRoles.some(role => allowedRoles.includes(role));

      if (!hasAccess) {
        this.auth.Logout();
        this.errMessage = 'Access denied. Admin privileges required.';
        return;
      }

      this.successMessage = 'Logged in successfully!';
      setTimeout(() => {
        // Optional: Redirect based on role
        const role = userRoles.find(r => allowedRoles.includes(r))??'SuperAdmin';
        this.router.navigate([this.getRouteByRole(role)]);
      }, 1000);
    },
    error: (error) => {
      this.isLoading = false;
      this.errMessage = error.error?.message || 'Invalid email or password.';
      this.loginForm.get('password')?.reset();
    }
  });
}

// Optional: Redirect based on role
private getRouteByRole(role: string): string {
  switch (role) {
    case 'TourAdmin': return '/tour';
    case 'HotelAdmin': return '/hotel';
    case 'FlightAdmin': return '/flight';
    case 'CarRentalAdmin': return '/car';
    case 'SuperAdmin': return '/dashboard'; // Full access
    default: return '/dashboard';
  }
}
}




