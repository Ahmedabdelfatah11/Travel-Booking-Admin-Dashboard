// admin-interfaces.ts - Updated with better type safety
// Place this file in your shared/interfaces folder

export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  userName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  emailConfirmed: boolean;
  roles: string[];
  entityName?: string;
  managedCompanies?: ManagedCompany[];
}

export interface ManagedCompany {
  companyId: number;
  companyName: string;
  companyType: string;
}

export interface UsersResponse {
  data?: User[]; // For paginated responses
  pageIndex?: number;
  pageSize?: number;
  totalCount?: number;
  // Direct array response support
  [index: number]: User;
  length?: number;
}


export interface RegisterModel {
  firstName: string;        // Required, MaxLength(100)
  lastName: string;         // Required, MaxLength(100)  
  userName: string;         // Required, MaxLength(50)
  email: string;           // Required, MaxLength(50), EmailAddress
  phoneNumber: string;     // Phone, MaxLength(20) - can be empty string
  address: string;         // MaxLength(200) - can be empty string
  dateOfBirth: string;     // Required, AgeRange(16, 110), DataType.Date - ISO string format
  password: string;        // Required, MaxLength(50), DataType.Password  
  companyId?: number | null; // Optional
}


export interface AssignRoleDto {
  userId: string;
  companyType: string; // 'hotel', 'flight', 'carrental', 'tour'
  companyId?: number;
}


export interface RemoveRoleDto {
  userId: string;
  role: string;
}


export interface AddRoleDto {
  userId: string;
  role: string;
}
export interface UserListDto {
  id: string;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  emailConfirmed: boolean;
  roles: string[];
  managedCompanies: UserManagedCompanyDto[];
}
export interface UserManagedCompanyDto {
  role: string;
  companyName: string;
  companyId: number;
  companyType: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalHotels: number;
  totalFlights: number;
  totalCarRentals: number;
  totalTours: number;
  totalBookings: number;
  totalRevenue: number;
  recentActivity?: ActivityItem[];
}
export interface UsersResponses {
  data: UserListDto[];
  totalCount: number;
}
export interface UserListResponse<T> {
  data: T[];
  totalCount: number;
}
export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  userId?: string;
  userName?: string;
}

// Company interfaces
export interface CompanyBase {
  id: number;
  name: string;
  description?: string;
  location?: string;
  rating?: number;
  imageUrl?: string;
  adminId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HotelCompany extends CompanyBase {
  // Hotel-specific properties
  rooms?: Room[];
  amenities?: string[];
}

export interface FlightCompany extends CompanyBase {
  // Flight-specific properties
  flights?: Flight[];
  aircraftCount?: number;
}

export interface CarRentalCompany extends CompanyBase {
  // Car rental-specific properties
  vehicles?: Vehicle[];
  branchCount?: number;
}

export interface TourCompany extends CompanyBase {
  // Tour-specific properties
  tours?: Tour[];
  destinations?: string[];
}

// Additional supporting interfaces
export interface Room {
  id: number;
  type: string;
  price: number;
  available: boolean;
}

export interface Flight {
  id: number;
  flightNumber: string;
  departure: string;
  destination: string;
  price: number;
}

export interface Vehicle {
  id: number;
  model: string;
  type: string;
  pricePerDay: number;
  available: boolean;
}

export interface Tour {
  id: number;
  name: string;
  duration: number;
  price: number;
  maxCapacity: number;
}

// API Response interfaces
export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  errors?: string[];
  success?: boolean;
}

export interface ApiError {
  message: string;
  errors?: string[];
  statusCode?: number;
}

// Form validation interfaces
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Enum for roles
export enum UserRole {
  User = 'User',
  HotelAdmin = 'HotelAdmin',
  FlightAdmin = 'FlightAdmin',
  CarRentalAdmin = 'CarRentalAdmin',
  TourAdmin = 'TourAdmin',
  SuperAdmin = 'SuperAdmin'
}

// Enum for company types
export enum CompanyType {
  Hotel = 'hotel',
  Flight = 'flight',
  CarRental = 'carrental',
  Tour = 'tour'
}

// Type guards for runtime type checking
export function isUser(obj: any): obj is User {
  return obj && typeof obj.id === 'string' && typeof obj.userName === 'string' && typeof obj.email === 'string';
}

export function isUsersResponse(obj: any): obj is UsersResponse {
  return obj && (Array.isArray(obj) || (obj.data && Array.isArray(obj.data)));
}

export function isApiResponse(obj: any): obj is ApiResponse {
  return obj && typeof obj.message === 'string';
}

// Helper functions for validation
export class ValidationHelper {
  static validateUserName(userName: string): ValidationError | null {
    if (!userName || userName.trim().length === 0) {
      return { field: 'userName', message: 'Username is required' };
    }
    if (userName.length < 3) {
      return { field: 'userName', message: 'Username must be at least 3 characters long' };
    }
    if (userName.length > 50) {
      return { field: 'userName', message: 'Username cannot exceed 50 characters' };
    }
    return null;
  }

  static validateEmail(email: string): ValidationError | null {
    if (!email || email.trim().length === 0) {
      return { field: 'email', message: 'Email is required' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { field: 'email', message: 'Invalid email format' };
    }
    return null;
  }

  static validatePassword(password: string): ValidationError | null {
    if (!password || password.trim().length === 0) {
      return { field: 'password', message: 'Password is required' };
    }
    if (password.length < 6) {
      return { field: 'password', message: 'Password must be at least 6 characters long' };
    }
    if (password.length > 100) {
      return { field: 'password', message: 'Password cannot exceed 100 characters' };
    }
    return null;
  }

  static validatePhone(phone: string): ValidationError | null {
    if (!phone || phone.trim().length === 0) {
      return null; // Phone is optional
    }
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phone)) {
      return { field: 'phoneNumber', message: 'Invalid phone number format' };
    }
    return null;
  }

  static validateRegisterModel(model: RegisterModel): FormValidationResult {
    const errors: ValidationError[] = [];
    
    const userNameError = this.validateUserName(model.userName);
    if (userNameError) errors.push(userNameError);
    
    const emailError = this.validateEmail(model.email);
    if (emailError) errors.push(emailError);
    
    const passwordError = this.validatePassword(model.password);
    if (passwordError) errors.push(passwordError);
    
    if (model.phoneNumber) {
      const phoneError = this.validatePhone(model.phoneNumber);
      if (phoneError) errors.push(phoneError);
    }

    if (model.firstName && model.firstName.length > 50) {
      errors.push({ field: 'firstName', message: 'First name cannot exceed 50 characters' });
    }

    if (model.lastName && model.lastName.length > 50) {
      errors.push({ field: 'lastName', message: 'Last name cannot exceed 50 characters' });
    }

    if (model.address && model.address.length > 200) {
      errors.push({ field: 'address', message: 'Address cannot exceed 200 characters' });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Constants for dropdown options
export const USER_ROLES = [
  { value: UserRole.User, label: 'User' },
  { value: UserRole.HotelAdmin, label: 'Hotel Admin' },
  { value: UserRole.FlightAdmin, label: 'Flight Admin' },
  { value: UserRole.CarRentalAdmin, label: 'Car Rental Admin' },
  { value: UserRole.TourAdmin, label: 'Tour Admin' },
  { value: UserRole.SuperAdmin, label: 'Super Admin' }
];

export const COMPANY_TYPES = [
  { value: CompanyType.Hotel, label: 'Hotel' },
  { value: CompanyType.Flight, label: 'Flight' },
  { value: CompanyType.CarRental, label: 'Car Rental' },
  { value: CompanyType.Tour, label: 'Tour' }
];