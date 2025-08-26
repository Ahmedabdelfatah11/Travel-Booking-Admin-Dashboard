// user-creation.component.ts - FIXED VERSION
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SuperadminServices } from '../../../../../core/services/superadmin-services';
import { RegisterModel } from '../../../../../shared/Interfaces/admin-interfaces';
import { Auth } from '../../../../../core/services/auth';

@Component({
  selector: 'app-user-creation',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './user-creation.html',
  styleUrls: ['./user-creation.css']
})
export class UserCreation {
  private fb = inject(FormBuilder);
  private superAdminService = inject(SuperadminServices);
  private auth = inject(Auth);
  private router = inject(Router);

  // Signals for reactive state management
  loading = signal(false);
  success = signal<string | null>(null);
  error = signal<string | null>(null);
  companies = signal<{ id: number; name: string }[]>([]);
  loadingCompanies = signal(false);

  // Available roles
  availableRoles = [
    { value: 'HotelAdmin', label: 'Hotel Administrator', icon: '🏨' },
    { value: 'FlightAdmin', label: 'Flight Administrator', icon: '✈️' },
    { value: 'CarRentalAdmin', label: 'Car Rental Administrator', icon: '🚗' },
    { value: 'TourAdmin', label: 'Tour Administrator', icon: '🗺️' },
    { value: 'User', label: 'Regular User', icon: '👤' }
  ];

  // Form group
  userForm!: FormGroup;

  constructor() {
    // Check authorization
    if (!this.auth.isLoggedIn() || !this.auth.hasRole('SuperAdmin')) {
      this.router.navigate(['/unauthorized']);
      return;
    }

    // Initialize form with proper validation matching backend RegisterModel
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.maxLength(100)]],
      userName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(50)]],
      phoneNumber: ['', [Validators.maxLength(20)]], // Optional - can be empty string
      address: ['', [Validators.maxLength(200)]], // Optional - can be empty string  
      dateOfBirth: ['', [Validators.required]], // Required field
      password: ['', [
        Validators.required, 
        Validators.minLength(6), 
        Validators.maxLength(50),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', [Validators.required]],
      role: ['User', [Validators.required]],
      companyId: [null]
    }, { validators: this.passwordMatchValidator });

    // Watch role changes to load companies
    this.userForm.get('role')?.valueChanges.subscribe(role => {
      this.onRoleChange(role);
    });
  }

  // Custom validator for password confirmation
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword?.hasError('passwordMismatch')) {
      confirmPassword.setErrors(null);
    }
    
    return null;
  }

  // Custom validator for password strength (matching ASP.NET Core Identity requirements)
  passwordStrengthValidator(control: any) {
    if (!control.value) return null; // Don't validate empty values (required validator handles that)
    
    const password = control.value;
    const errors: any = {};
    
    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.missingLowercase = true;
    }
    
    // Check for at least one uppercase letter  
    if (!/[A-Z]/.test(password)) {
      errors.missingUppercase = true;
    }
    
    // Check for at least one digit (common requirement)
    if (!/[0-9]/.test(password)) {
      errors.missingNumber = true;
    }
    
    // Check for at least one special character (common requirement)
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.missingSpecialChar = true;
    }
    
    return Object.keys(errors).length > 0 ? errors : null;
  }

  // Handle role change
  onRoleChange(role: string) {
    const companyControl = this.userForm.get('companyId');
    
    if (role === 'User') {
      companyControl?.setValue(null);
      companyControl?.clearValidators();
      this.companies.set([]);
    } else {
      companyControl?.setValidators([Validators.required]);
      this.loadCompaniesForRole(role);
    }
    
    companyControl?.updateValueAndValidity();
  }

  // Load companies based on role
  async loadCompaniesForRole(role: string) {
    const companyTypeMap: { [key: string]: string } = {
      'HotelAdmin': 'hotel',
      'FlightAdmin': 'flight',
      'CarRentalAdmin': 'carrental',
      'TourAdmin': 'tour'
    };

    const companyType = companyTypeMap[role];
    if (!companyType) {
      this.companies.set([]);
      return;
    }

    this.loadingCompanies.set(true);
    this.error.set(null);

    try {
      const response = await this.superAdminService.getCompaniesByType(companyType).toPromise();
      
      // Filter companies without admin
      const availableCompanies = Array.isArray(response) 
        ? response.filter((company: any) => !company.adminId && !company.AdminId)
        : response?.data?.filter((company: any) => !company.adminId && !company.AdminId) || [];

      this.companies.set(
        availableCompanies.map((company: any) => ({
          id: company.id || company.Id,
          name: company.name || company.Name || 'Unnamed Company'
        }))
      );

      if (this.companies().length === 0) {
        this.error.set(`No available ${companyType} companies without admin found.`);
      }

    } catch (error: any) {
      console.error(`Error loading ${companyType} companies:`, error);
      this.error.set(`Failed to load ${companyType} companies.`);
      this.companies.set([]);
    } finally {
      this.loadingCompanies.set(false);
    }
  }

  // Submit form - FIXED VERSION
  async onSubmit() {
    if (this.userForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    try {
      const formValue = this.userForm.value;
      
      // Create RegisterModel that EXACTLY matches backend expectations
      const userModel: RegisterModel = {
        firstName: formValue.firstName.trim(), // Required
        lastName: formValue.lastName.trim(),   // Required  
        userName: formValue.userName.trim(),   // Required
        email: formValue.email.trim(),         // Required
        phoneNumber: formValue.phoneNumber?.trim() || '', // Can be empty string, not null
        address: formValue.address?.trim() || '',         // Can be empty string, not null
        dateOfBirth: new Date(formValue.dateOfBirth).toISOString(), // Required, properly formatted
        password: formValue.password,          // Required
        companyId: formValue.companyId || null // Can be null
      };

      console.log('📤 Sending user model:', userModel);

      // Create user
      const result = await this.superAdminService.addUser(userModel, formValue.role).toPromise();
      
      this.success.set(`User "${userModel.userName}" created successfully with role "${formValue.role}".`);
      
      // Reset form after success
      this.userForm.reset();
      this.userForm.get('role')?.setValue('User');
      this.companies.set([]);

      // Navigate back to user list after short delay
      setTimeout(() => {
        this.router.navigate(['/admin/users']);
      }, 2000);

    } catch (error: any) {
      console.error('Error creating user:', error);
      
      // Better error handling
      let errorMessage = 'Failed to create user. Please try again.';
      
      if (error?.userMessage) {
        errorMessage = error.userMessage;
      } else if (error?.error?.errors && Array.isArray(error.error.errors)) {
        errorMessage = error.error.errors.join(', ');
      } else if (error?.error?.message) {
        errorMessage = error.error.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      this.error.set(errorMessage);
    } finally {
      this.loading.set(false);
    }
  }

  // Mark all form fields as touched to show validation errors
  private markFormGroupTouched() {
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      control?.markAsTouched();
    });
  }

  // Helper method to check if field has error
  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.userForm.get(fieldName);
    if (!field) return false;
    
    if (errorType) {
      return field.hasError(errorType) && field.touched;
    }
    
    return field.invalid && field.touched;
  }

  // Get error message for field
  getErrorMessage(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    const errors = field.errors;
    
    if (errors['required']) return `${this.getFieldDisplayName(fieldName)} is required`;
    if (errors['email']) return 'Please enter a valid email address';
    if (errors['minlength']) return `${this.getFieldDisplayName(fieldName)} must be at least ${errors['minlength'].requiredLength} characters`;
    if (errors['maxlength']) return `${this.getFieldDisplayName(fieldName)} cannot exceed ${errors['maxlength'].requiredLength} characters`;
    if (errors['pattern']) return 'Please enter a valid phone number';
    if (errors['passwordMismatch']) return 'Passwords do not match';
    
    // Password strength errors
    if (errors['missingLowercase']) return 'Password must contain at least one lowercase letter (a-z)';
    if (errors['missingUppercase']) return 'Password must contain at least one uppercase letter (A-Z)';
    if (errors['missingNumber']) return 'Password must contain at least one number (0-9)';
    if (errors['missingSpecialChar']) return 'Password must contain at least one special character (!@#$%^&* etc.)';
    
    return 'Invalid input';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      firstName: 'First Name',
      lastName: 'Last Name',
      userName: 'Username',
      dateOfBirth: 'Date of Birth',
      email: 'Email',
      phoneNumber: 'Phone Number',
      address: 'Address',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      role: 'Role',
      companyId: 'Company'
    };
    
    return displayNames[fieldName] || fieldName;
  }

  // Navigate back to user list
  goBack() {
    this.router.navigate(['/admin/users']);
  }

  // Clear messages
  clearMessages() {
    this.error.set(null);
    this.success.set(null);
  }
}