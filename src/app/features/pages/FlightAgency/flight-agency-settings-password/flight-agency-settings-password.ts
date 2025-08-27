import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-flight-agency-settings-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './flight-agency-settings-password.html',
  styleUrl: './flight-agency-settings-password.css'
})
export class FlightAgencySettingsPassword implements OnInit {
  passwordForm: FormGroup;
  isLoading = true;
  isSubmitting = false;
  error: string | null = null;
  success: string | null = null;

  private apiUrl = 'http://pyramigo.runasp.net/api/UserProfile';
  private token = localStorage.getItem('authToken');

  get currentPassword() { return this.passwordForm.get('currentPassword')!; }
  get newPassword() { return this.passwordForm.get('newPassword')!; }
  get confirmNewPassword() { return this.passwordForm.get('confirmNewPassword')!; }

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmNewPassword: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Simulate initial loading (e.g., fetching user data)
    setTimeout(() => {
      this.isLoading = false;
      this.cd.detectChanges();
    }, 1000);
  }

  private getAuthHeaders() {
    return { 'Authorization': `Bearer ${this.token}` };
  }

  onChangePassword(): void {
    this.passwordForm.markAllAsTouched();
    this.error = null;
    this.success = null;

    const current = this.currentPassword.value?.trim();
    const newPassword = this.newPassword.value?.trim();
    const confirm = this.confirmNewPassword.value?.trim();

    if (!current) {
      this.error = 'Current password is required.';
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      this.error = 'New password must be at least 6 characters.';
      return;
    }

    if (newPassword === current) {
      this.error = 'New password must be different from current password.';
      return;
    }

    if (newPassword !== confirm) {
      this.error = 'New passwords do not match.';
      return;
    }

    this.isSubmitting = true;
    this.cd.detectChanges();

    const startTime = Date.now();

    this.http.post(`${this.apiUrl}/ChangePassword`, {
      currentPassword: current,
      newPassword: newPassword
    }, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: () => {
        this.success = 'Password changed successfully!';
        this.passwordForm.reset();
        setTimeout(() => this.success = null, 5000);
      },
      error: (err) => {
        if (err.status === 401) {
          this.error = 'Session expired. Please log in again.';
          this.router.navigate(['/login']);
        } else {
          this.error = err.error?.message || 'Failed to change password';
        }
      },
      complete: () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(1000 - elapsed, 0);

        setTimeout(() => {
          this.isSubmitting = false;
          this.cd.detectChanges();
        }, remaining);
      }
    });
  }
}