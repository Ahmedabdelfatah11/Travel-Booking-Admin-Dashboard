import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

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

// Toast interface
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
  visible: boolean;
}

@Component({
  selector: 'app-car-rental-agency-settings-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './car-rental-agency-settings-profile.html',
  styleUrls: ['./car-rental-agency-settings-profile.css']
})
export class CarRentalAgencySettingsProfile implements OnInit {
  profileForm: FormGroup;
  isLoading = true;
  isSubmitting = false;
  error: string | null = null;
  success: string | null = null;
  selectedFile: File | null = null;
  profilePictureUrl: string | null = null;

  private apiUrl = 'http://pyramigo.runasp.net/api/UserProfile';
  private token = localStorage.getItem('authToken');

  get firstName() { return this.profileForm.get('firstName')!; }
  get lastName() { return this.profileForm.get('lastName')!; }
  get email() { return this.profileForm.get('email')!; }
  get username() { return this.profileForm.get('username')!; }
  get phone() { return this.profileForm.get('phone')!; }
  get address() { return this.profileForm.get('address')!; }
  get dateOfBirth() { return this.profileForm.get('dateOfBirth')!; }

  get today(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  // Toasts
  private toastId = 0;
  toasts: Toast[] = [];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private cd: ChangeDetectorRef
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
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  private getAuthHeaders() {
    return { 'Authorization': `Bearer ${this.token}` };
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.cd.detectChanges();

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
        this.cd.detectChanges();
      },
      error: () => {
        this.showToast('Failed to load profile.', 'error');
        this.isLoading = false;
        this.cd.detectChanges();
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.showToast('Only .jpg, .jpeg, .png, and .webp files are allowed.', 'error');
        return;
      }
      this.selectedFile = file;
      this.profilePictureUrl = URL.createObjectURL(file);
      this.success = null;
      this.cd.detectChanges();
    }
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.showToast('Please fill in all required fields.', 'error');
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
    this.cd.detectChanges();

    const startTime = Date.now();

    this.http.put(`${this.apiUrl}/UpdateUserProfile`, formData, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(1000 - elapsed, 0);

        setTimeout(() => {
          this.isSubmitting = false;
          this.selectedFile = null;
          this.showToast('Profile updated successfully!', 'success');
          this.loadUserProfile();
        }, remaining);
      },
      error: (err) => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(1000 - elapsed, 0);

        setTimeout(() => {
          this.isSubmitting = false;
          this.showToast(err.error?.message || 'Failed to update profile.', 'error');
        }, remaining);
      }
    });
  }

  resetForm(): void {
    this.loadUserProfile();
    this.selectedFile = null;
    this.error = null;
    this.success = null;
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