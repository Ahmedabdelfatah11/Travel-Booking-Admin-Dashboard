import { Component, computed, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterModule } from '@angular/router';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  userName: string;
  phone: string;
  address: string;
  dateOfBirth: string | null;
  profilePictureUrl: string | null;
}

@Component({
  selector: 'app-car-rental-agency-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,RouterModule],
  templateUrl: './car-rental-agency-settings.html',
  styleUrls: ['./car-rental-agency-settings.css']
})
export class CarRentalAgencySettings implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  isLoading = true;
  isSubmitting = false;
  error: string | null = null;
  success: string | null = null;
  selectedFile: File | null = null;
  profilePictureUrl: string | null = null;

  private apiUrl = 'http://pyramigo.runasp.net/api/UserProfile';
  private token = localStorage.getItem('authToken');

  // Profile form getters
  get firstName() { return this.profileForm.get('firstName')!; }
  get lastName() { return this.profileForm.get('lastName')!; }
  get email() { return this.profileForm.get('email')!; }
  get username() { return this.profileForm.get('username')!; }
  get phone() { return this.profileForm.get('phone')!; }
  get address() { return this.profileForm.get('address')!; }
  get dateOfBirth() { return this.profileForm.get('dateOfBirth')!; }

  // Password form getters
  get currentPassword() { return this.passwordForm.get('currentPassword')!; }
  get newPassword() { return this.passwordForm.get('newPassword')!; }
  get confirmNewPassword() { return this.passwordForm.get('confirmNewPassword')!; }

  get today(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router  
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: [{ value: '', disabled: true }],
      username: ['', Validators.required],
      phone: [''],
      address: [''],
      dateOfBirth: [null]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmNewPassword: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();

    
    // Clear general error when user types in any password field
    this.passwordForm.valueChanges.subscribe(() => {
      if (this.error) this.error = null;
    });

    // Update signals for real-time feedback
    this.passwordForm.get('currentPassword')?.valueChanges.subscribe(value => {
      this.currentPasswordSignal.set(value || '');
    });

    this.passwordForm.get('newPassword')?.valueChanges.subscribe(value => {
      this.newPasswordSignal.set(value || '');
    });

    this.passwordForm.get('confirmNewPassword')?.valueChanges.subscribe(value => {
      this.confirmNewPasswordSignal.set(value || '');
    });
    
    this.passwordForm.valueChanges.subscribe(() => {
  if (this.error) {
    this.error = null;
  }
});
  }

private getAuthHeaders(): HttpHeaders {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  return new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });
}

  loadUserProfile(): void {
    this.http.get<UserProfile>(`${this.apiUrl}/GetCurrentUser`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (data) => {
        this.profileForm.patchValue({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          username: data.userName,
          phone: data.phone,
          address: data.address,
          dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : null
        });
        this.profilePictureUrl = data.profilePictureUrl
          ? `http://pyramigo.runasp.net${data.profilePictureUrl.replace(/^\/+/, '/')}`
          : null;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load profile';
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.error = 'Only .jpg, .jpeg, .png, and .webp files are allowed.';
        return;
      }
      this.selectedFile = file;
      this.profilePictureUrl = URL.createObjectURL(file);
      this.success = null;
    }
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const formData = new FormData();
    const formValue = this.profileForm.value;

    formData.append('FirstName', formValue.firstName);
    formData.append('LastName', formValue.lastName);
    formData.append('Phone', formValue.phone || '');
    formData.append('Address', formValue.address || '');
    if (formValue.dateOfBirth) {
      formData.append('DateOfBirth', formValue.dateOfBirth);
    }
    if (this.selectedFile) {
      formData.append('ProfilePicture', this.selectedFile);
    }

    this.isSubmitting = true;
    this.error = null;
    this.success = null;

    this.http.put(`${this.apiUrl}/UpdateUserProfile`, formData, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (response: any) => {
        this.success = 'Profile updated successfully!';
        this.isSubmitting = false;
        this.selectedFile = null;
        this.loadUserProfile();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to update profile';
        this.isSubmitting = false;
      }
    });
  }

onChangePassword(): void {
  this.passwordForm.markAllAsTouched();
  this.error = null;

  const current = this.currentPassword.value?.trim();
  const newPassword = this.newPassword.value?.trim();
  const confirm = this.confirmNewPassword.value?.trim();

  // 🔥 LOG the three passwords
  console.log({
    currentPassword: current,
    newPassword: newPassword,
    confirmNewPassword: confirm,
    passwordsMatch: newPassword === confirm,
    isDifferentFromCurrent: newPassword !== current,
    isValidLength: newPassword && newPassword.length >= 6
  });

  // Validate form
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

  // ✅ Get fresh token before request
  const token = localStorage.getItem('authToken');
  if (!token) {
    this.error = 'Session expired. Please log in again.';
    this.router.navigate(['/login']);
    return;
  }

  // ✅ Submit with fresh auth
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
    }
  });
}

  resetForm(): void {
    this.loadUserProfile();
    this.selectedFile = null;
    this.error = null;
    this.success = null;
  }

  // Signals for real-time feedback
  private currentPasswordSignal = signal<string>('');
  private newPasswordSignal = signal<string>('');
  private confirmNewPasswordSignal = signal<string>('');

  passwordsMatch = computed(() => {
    const newPassword = this.newPasswordSignal();
    const confirm = this.confirmNewPasswordSignal();
    return newPassword === confirm && newPassword.length >= 6;
  });
}