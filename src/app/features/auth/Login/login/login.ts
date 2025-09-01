import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth } from '../../../../core/services/auth';
import { finalize, timeout } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
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

    this.auth.Login({ email, password }).pipe(
      timeout(3000),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: (response) => {
        const userRoles = response.roles || [];
        const role = userRoles.find((r: string) => 
          ['SuperAdmin', 'TourAdmin', 'FlightAdmin', 'HotelAdmin', 'CarRentalAdmin'].includes(r)
        );

        if (!role) {
          this.auth.Logout();
          this.errMessage = 'Access denied. Admin privileges required.';
          return;
        }

        this.successMessage = 'Logged in successfully!';

        let redirectUrl: string;
        switch (role) {
          case 'SuperAdmin': redirectUrl = '/admin/dashboard'; break;
          case 'TourAdmin': redirectUrl = '/tour-admin/dashboard'; break;
          case 'FlightAdmin': redirectUrl = '/flight-admin/dashboard'; break;
          case 'HotelAdmin': redirectUrl = '/hotel-admin/dashboard'; break;
          case 'CarRentalAdmin': redirectUrl = '/car-admin/dashboard'; break;
          default: redirectUrl = '/login'; break;
        }

        setTimeout(() => {
          this.router.navigate([redirectUrl], { replaceUrl: true }).catch(() => {
            this.errMessage = 'Navigation failed. Please try again.';
          });
        }, 50);
      },
      error: (error) => {
        if (error.name === 'TimeoutError') {
          this.errMessage = 'Login request timed out. Please check your connection.';
        } else {
          this.errMessage = error.error?.message || 'Invalid email or password.';
        }
        this.loginForm.get('password')?.reset();
      }
    });
  }
}