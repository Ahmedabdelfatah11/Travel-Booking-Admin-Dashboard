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
    console.log('Login form submitted');
    
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errMessage = '';
    this.successMessage = '';

    const email = this.loginForm.get('email')?.value ?? '';
    const password = this.loginForm.get('password')?.value ?? '';

    console.time('LoginRequest');
    console.log('Sending login request for email:', email);

    this.auth.Login({ email, password }).pipe(
      timeout(3000), // 30 second timeout
      finalize(() => {
        this.isLoading = false;
        console.timeEnd('LoginRequest');
        console.log('Login request finalized');
      })
    ).subscribe({
      next: (response) => {
        console.log('Login response received:', response);
        
        const userRoles = response.roles || [];
        console.log('User roles:', userRoles);

        // Only allow specific admin roles
        const role = userRoles.find(r => ['SuperAdmin', 'TourAdmin', 'FlightAdmin', 'HotelAdmin', 'CarRentalAdmin'].includes(r));
        
        if (!role) {
          console.log('Access denied - no valid admin role found');
          this.auth.Logout();
          this.errMessage = 'Access denied. Admin privileges required.';
          return;
        }

        console.log('Valid role found:', role);
        this.successMessage = 'Logged in successfully!';
        
        // Determine redirect URL based on role
        let redirectUrl: string;
        switch (role) {
          case 'SuperAdmin':
            redirectUrl = '/admin/dashboard';
            break;
          case 'TourAdmin':
            redirectUrl = '/tour-admin/dashboard';
            break;
          case 'FlightAdmin':
            redirectUrl = '/flight-admin/dashboard';
            break;
          case 'HotelAdmin':
            redirectUrl = '/hotel-admin/dashboard';
            break;
          case 'CarRentalAdmin':
            redirectUrl = '/car-admin/dashboard';
            break;
          default:
            redirectUrl = '/login'; // fallback to login if no match
            break;
        }
        
        console.log('Redirecting to:', redirectUrl);
        
        // Use setTimeout to ensure UI updates before navigation
        setTimeout(() => {
          this.router.navigate([redirectUrl], { replaceUrl: true }).then(
            (navigationSuccess) => {
              console.log('Navigation successful:', navigationSuccess);
            }
          ).catch(
            (navigationError) => {
              console.error('Navigation failed:', navigationError);
              this.errMessage = 'Navigation failed. Please try again.';
            }
          );
        }, 100);
      },
      error: (error) => {
        console.error('Login error:', error);
        
        if (error.name === 'TimeoutError') {
          this.errMessage = 'Login request timed out. Please check your connection and try again.';
        } else {
          this.errMessage = error.error?.message || 'Invalid email or password.';
        }
        
        this.loginForm.get('password')?.reset();
      }
    });
  }
}