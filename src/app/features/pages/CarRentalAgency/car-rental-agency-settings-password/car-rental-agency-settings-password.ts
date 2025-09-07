import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

// Toast interface
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
  visible: boolean;
}

@Component({
  selector: 'app-car-rental-agency-settings-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './car-rental-agency-settings-password.html',
  styleUrls: ['./car-rental-agency-settings-password.css']
})
export class CarRentalAgencySettingsPassword implements OnInit {
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

  // Toasts
  private toastId = 0;
  toasts: Toast[] = [];

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
    this.isLoading = false;
    this.cd.detectChanges();
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
      this.showToast('Current password is required.', 'error');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      this.showToast('New password must be at least 6 characters.', 'error');
      return;
    }

    if (newPassword === current) {
      this.showToast('New password must be different from current password.', 'error');
      return;
    }

    if (newPassword !== confirm) {
      this.showToast('New passwords do not match.', 'error');
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
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(1000 - elapsed, 0);

        setTimeout(() => {
          this.isSubmitting = false;
          this.passwordForm.reset();
          this.showToast('Password changed successfully!', 'success');
        }, remaining);
      },
      error: (err) => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(1000 - elapsed, 0);

        setTimeout(() => {
          this.isSubmitting = false;
          if (err.status === 401) {
            this.showToast('Session expired. Please log in again.', 'error');
            this.router.navigate(['/login']);
          } else {
            this.showToast(err.error?.message || 'Failed to change password.', 'error');
          }
        }, remaining);
      }
    });
  }

  // === Toast Management ===
  showToast(message: string, type: 'success' | 'error'): void {
    const id = ++this.toastId;
    this.toasts.push({ id, message, type, visible: true });

    this.cd.detectChanges();

    setTimeout(() => {
      this.hideToast(id);
    }, 5000);
  }

  hideToast(id: number): void {
    const toast = this.toasts.find(t => t.id === id);
    if (toast) {
      toast.visible = false;
      setTimeout(() => {
        this.toasts = this.toasts.filter(t => t.id !== id);
        this.cd.detectChanges();
      }, 300);
    }
  }
}