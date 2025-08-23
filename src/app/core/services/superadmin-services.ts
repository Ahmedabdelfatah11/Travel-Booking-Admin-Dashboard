// superadmin-services.ts - Enhanced version with better error handling
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ITour, updatedITour } from '../../shared/Interfaces/i-tour';
import { Ihotelcompany } from '../../shared/Interfaces/ihotelcompany';
import { AssignRoleDto, DashboardStats, RegisterModel, RemoveRoleDto, UsersResponse } from '../../shared/Interfaces/admin-interfaces';
import { Iflightcompany } from '../../shared/Interfaces/iflightcompany';
import { ICarrental, updatedICarRental } from '../../shared/Interfaces/i-carrental';

@Injectable({
  providedIn: 'root'
})
export class SuperadminServices {
  private apiUrl = 'http://pyramigo.runasp.net/api/SuperAdmin';
 
  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    console.log('Retrieved token:', token ? 'Token exists' : 'No token found');

    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  private getFormDataHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`
        // Don't set Content-Type for FormData - browser will set it automatically
      });
    }
    return new HttpHeaders();
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('API Error:', error);
    
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.error) {
        if (error.error.message) {
          errorMessage = error.error.message;
        } else if (error.error.errors && Array.isArray(error.error.errors)) {
          errorMessage = error.error.errors.join(', ');
        } else if (typeof error.error === 'string') {
          errorMessage = error.error;
        }
      } else {
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }
    
    return throwError(() => ({
      ...error,
      userMessage: errorMessage
    }));
  }

  // ==================== USER MANAGEMENT ====================
  
  /**
   * Get all users with pagination
   */
  getAllUsers(pageIndex: number = 1, pageSize: number = 10): Observable<UsersResponse> {
    console.log(`🔍 Getting users: page ${pageIndex}, size ${pageSize}`);
    
    return this.http.get<UsersResponse>(`${this.apiUrl}/users?pageIndex=${pageIndex}&pageSize=${pageSize}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => console.log('✅ Users response:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Add a new user with specific role
   */
addUser(model: RegisterModel, role: string): Observable<any> {
  console.log('🚀 Adding user:', model, 'with role:', role);
  
  // ✅ FIXED: Don't "clean" the model - send it as-is from the component
  // The component already ensures required fields are present and validates properly
  
  // Just ensure no undefined values become null when serialized
  const userModel = {
    firstName: model.firstName,
    lastName: model.lastName, 
    userName: model.userName,
    email: model.email,
    phoneNumber: model.phoneNumber || '', // Empty string, not null
    address: model.address || '',         // Empty string, not null
    dateOfBirth: model.dateOfBirth,       // Should already be ISO string from component
    password: model.password,
    companyId: model.companyId || null
  };
  
  console.log('🧹 Final model being sent:', userModel);
  
  return this.http.post(`${this.apiUrl}/add-user?role=${encodeURIComponent(role)}`, userModel, {
    headers: this.getAuthHeaders()
  }).pipe(
    tap(response => console.log('✅ User added successfully:', response)),
    catchError(this.handleError)
  );
}
  /**
   * Assign role to user and link to company
   */
  assignRole(dto: AssignRoleDto): Observable<any> {
    console.log('🔗 Assigning role:', dto);
    
    return this.http.post(`${this.apiUrl}/assign-role`, dto, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => console.log('✅ Role assigned successfully:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Remove role from user
   */
  removeRole(dto: RemoveRoleDto): Observable<any> {
    console.log('🗑️ Removing role:', dto);
    
    return this.http.post(`${this.apiUrl}/remove-role`, dto, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => console.log('✅ Role removed successfully:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Delete user
   */
  deleteUser(userId: string): Observable<any> {
    console.log('🗑️ Deleting user:', userId);
    
    return this.http.delete(`${this.apiUrl}/delete-user/${userId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => console.log('✅ User deleted successfully:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Get dashboard statistics
   */
  getDashboard(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== TOUR COMPANY ENDPOINTS ====================
  
  /**
   * Get all tour companies using the public endpoint
   */
  getAllTourCompanies(): Observable<any> {
    return this.http.get('http://pyramigo.runasp.net/api/TourCompany').pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Create tour company
   */
  createTourCompany(model: ITour): Observable<any> {
    const formData = new FormData();

    formData.append('Name', model.name);

    if (model.description) {
      formData.append('Description', model.description);
    }

    if (model.location) {
      formData.append('Location', model.location);
    }

    if (model.rating !== undefined && model.rating !== null) {
      formData.append('Rating', model.rating.toString());
    }

    if (model.adminId) {
      formData.append('AdminId', model.adminId);
    }

    if (model.image) {
      formData.append('Image', model.image, model.image.name);
    }

    return this.http.post(`${this.apiUrl}/tours`, formData, {
      headers: this.getFormDataHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Update tour company
   */
  updateTourCompany(id: number, model: updatedITour): Observable<any> {
    const formData = new FormData();
    
    formData.append('Id', id.toString());
    formData.append('Name', model.name);

    if (model.description) {
      formData.append('Description', model.description);
    }

    if (model.location) {
      formData.append('Location', model.location);
    }

    if (model.rating !== undefined && model.rating !== null) {
      formData.append('Rating', model.rating.toString());
    }

    if (model.adminId) {
      formData.append('AdminId', model.adminId);
    }

    if (model.image) {
      formData.append('Image', model.image, model.image.name);
    }

    return this.http.put(`${this.apiUrl}/tours/${id}`, formData, { 
      headers: this.getFormDataHeaders() 
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Delete tour company
   */
  deleteTourCompany(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tours/${id}`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== HOTEL COMPANY ENDPOINTS ====================
  
  /**
   * Create hotel company
   */
  createHotelCompany(model: Ihotelcompany): Observable<any> {
    const formData = new FormData();

    formData.append('Name', model.name);

    if (model.description) {
      formData.append('Description', model.description);
    }

    if (model.location) {
      formData.append('Location', model.location);
    }

    if (model.rating !== undefined && model.rating !== null && model.rating !== '') {
      formData.append('Rating', model.rating.toString());
    }

    if (model.adminId) {
      formData.append('AdminId', model.adminId);
    }

    if (model.image) {
      formData.append('Image', model.image, model.image.name);
    }

    return this.http.post(`${this.apiUrl}/Hotels`, formData, {
      headers: this.getFormDataHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Update hotel company
   */
  updateHotelCompany(id: number, model: any): Observable<any> {
    const formData = new FormData();
    
    formData.append('Id', id.toString());
    
    for (const key in model) {
      if (model.hasOwnProperty(key) && model[key] !== null && model[key] !== undefined) {
        if (key === 'image' && model[key] instanceof File) {
          formData.append('Image', model[key], model[key].name);
        } else if (key !== 'image') {
          formData.append(key.charAt(0).toUpperCase() + key.slice(1), model[key].toString());
        }
      }
    }

    return this.http.put(`${this.apiUrl}/Hotels/${id}`, formData, {
      headers: this.getFormDataHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Delete hotel company
   */
  deleteHotelCompany(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/Hotels/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }
  getAllHotelCompanies(): Observable<any> {
    return this.http.get('http://pyramigo.runasp.net/api/HotelCompany').pipe(
      catchError(this.handleError)
    );
  }
  // ==================== UTILITY METHODS ====================
  
  /**
   * Get companies by type for assignment
   */
  getCompaniesByType(companyType: string): Observable<any> {
    const endpoints = {
      'hotel': 'http://pyramigo.runasp.net/api/HotelCompany',
      'flight': 'http://pyramigo.runasp.net/FlightCompany', 
      'carrental': 'http://pyramigo.runasp.net/api/CarRental',
      'tour': 'http://pyramigo.runasp.net/api/TourCompany'
    };

    const url = endpoints[companyType.toLowerCase() as keyof typeof endpoints];
    
    if (!url) {
      return throwError(() => new Error(`Invalid company type: ${companyType}`));
    }

    console.log(`🏢 Fetching ${companyType} companies from:`, url);

    return this.http.get(url).pipe(
      tap(response => console.log(`✅ ${companyType} companies:`, response)),
      catchError(this.handleError)
    );
  }

  /**
   * Test endpoint (for debugging)
   */
  testEndpoint(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Validate user data before sending
   */
  private validateUserData(model: RegisterModel): string[] {
    const errors: string[] = [];
    
    if (!model.userName?.trim()) {
      errors.push('Username is required');
    } else if (model.userName.length < 3) {
      errors.push('Username must be at least 3 characters long');
    } else if (model.userName.length > 50) {
      errors.push('Username cannot exceed 50 characters');
    }
    
    if (!model.email?.trim()) {
      errors.push('Email is required');
    } else if (!this.isValidEmail(model.email)) {
      errors.push('Invalid email format');
    }
    
    if (!model.password?.trim()) {
      errors.push('Password is required');
    } else if (model.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    
    return errors;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

/// --------- Flight Mangment
  createFlightCompany(model: Iflightcompany): Observable<any> {
    const formData = new FormData();

    formData.append('Name', model.name);

    if (model.description) {
      formData.append('Description', model.description);
    }

    if (model.location) {
      formData.append('Location', model.location);
    }

    if (model.rating !== undefined && model.rating !== null) {
      formData.append('Rating', model.rating.toString());
    }

    if (model.adminId) {
      formData.append('AdminId', model.adminId);
    }

    if (model.image) {
      formData.append('Image', model.image, model.image.name);
    }

    return this.http.post(`${this.apiUrl}/flights`, formData, {
      headers: this.getFormDataHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

    updateFlightCompany(id: number, model: any): Observable<any> {
    const formData = new FormData();
    
    formData.append('Id', id.toString());
    
    for (const key in model) {
      if (model.hasOwnProperty(key) && model[key] !== null && model[key] !== undefined) {
        if (key === 'image' && model[key] instanceof File) {
          formData.append('Image', model[key], model[key].name);
        } else if (key !== 'image') {
          formData.append(key.charAt(0).toUpperCase() + key.slice(1), model[key].toString());
        }
      }
    }

    return this.http.put(`${this.apiUrl}/flights/${id}`, formData, {
      headers: this.getFormDataHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }
    deleteFlightCompany(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/flights/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }
    getAllFlightCompanies(): Observable<any> {
    return this.http.get<any[]>('http://pyramigo.runasp.net/FlightCompany').pipe(
      catchError(this.handleError)
    );
  }


  // ==================== CAR RENTAL COMPANY ENDPOINTS ====================
// Fixed SuperAdmin Service - Car Rental section only

/**
 * Get single car rental company by ID
 */
getCarRentalCompany(id: number): Observable<any> {
  console.log('🔍 Getting car rental company by ID:', id);
  
  return this.http.get(`http://pyramigo.runasp.net/api/CarRental/${id}`).pipe(
    tap(response => console.log('✅ Car rental company retrieved:', response)),
    catchError(this.handleError)
  );
}

/**
 * Get all car rental companies - FIXED to get full company objects
 */
getAllCarRentalCompanies(): Observable<any> {
  return this.http.get('http://pyramigo.runasp.net/api/CarRental?pageSize=100').pipe(
    tap(response => console.log('✅ All car rental companies:', response)),
    catchError(this.handleError)
  );
}

/**
 * Create car rental company
 */
createCarRentalCompany(model: ICarrental): Observable<any> {
  const formData = new FormData();

  formData.append('Name', model.name);

  if (model.description) {
    formData.append('Description', model.description);
  }

  if (model.location) {
    formData.append('Location', model.location);
  }

  if (model.rating !== undefined && model.rating !== null) {
    formData.append('Rating', model.rating.toString());
  }

  if (model.adminId) {
    formData.append('AdminId', model.adminId);
  }

  if (model.image) {
    formData.append('Image', model.image, model.image.name);
  }

  return this.http.post(`${this.apiUrl}/car-rentals`, formData, {
    headers: this.getFormDataHeaders()
  }).pipe(
    tap(response => console.log('✅ Car rental company created:', response)),
    catchError(this.handleError)
  );
}

/**
 * Update car rental company - FIXED to match backend DTO
 */
updateCarRentalCompany(id: number, model: any): Observable<any> {
  const formData = new FormData();
  
  // Match the backend UpdateCarRentalDto structure
  formData.append('Id', id.toString());
  
  if (model.name) {
    formData.append('Name', model.name);
  }

  if (model.description) {
    formData.append('Description', model.description);
  }

  if (model.location) {
    formData.append('Location', model.location);
  }

  if (model.rating !== undefined && model.rating !== null) {
    formData.append('Rating', model.rating.toString());
  }

  // Handle image file
  if (model.image && model.image instanceof File) {
    formData.append('Image', model.image, model.image.name);
  }

  return this.http.put(`${this.apiUrl}/car-rentals/${id}`, formData, {
    headers: this.getFormDataHeaders()
  }).pipe(
    tap(response => console.log('✅ Car rental company updated:', response)),
    catchError(this.handleError)
  );
}

/**
 * Delete car rental company
 */
deleteCarRentalCompany(id: number): Observable<any> {
  return this.http.delete(`${this.apiUrl}/car-rentals/${id}`, {
    headers: this.getAuthHeaders()
  }).pipe(
    tap(response => console.log('✅ Car rental company deleted:', response)),
    catchError(this.handleError)
  );
}


// Add these methods to your existing SuperadminServices class

  // ==================== REVIEW MANAGEMENT ====================
 // ==================== REVIEW MANAGEMENT - UPDATED FOR BACKEND ====================
  
  /**
   * Get all reviews across all companies for SuperAdmin monitoring
   * Since backend doesn't have this endpoint, we'll aggregate from Review service
   */
  getAllReviewsForAdmin(page: number = 1, pageSize: number = 20): Observable<any> {
    console.log(`🔍 Getting all reviews for admin - page ${page}, size ${pageSize}`);
    
    // Use the Review service endpoints since SuperAdmin doesn't have review endpoints
    const companyTypes = ['hotel', 'flight', 'carrental', 'tour'];
    const reviewRequests = companyTypes.map(type => 
      this.http.get(`http://pyramigo.runasp.net/api/Review/company?companyType=${type}&page=1&pageSize=100`).pipe(
        catchError(() => [])
      )
    );

    return new Observable(observer => {
      Promise.all(reviewRequests.map(req => req.toPromise()))
        .then(results => {
          const allReviews = results
            .filter(result => Array.isArray(result))
            .flatMap((reviews: any) => reviews)
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          const totalCount = allReviews.length;
          const startIndex = (page - 1) * pageSize;
          const paginatedReviews = allReviews.slice(startIndex, startIndex + pageSize);

          observer.next({
            reviews: paginatedReviews,
            totalCount,
            page,
            pageSize
          });
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }

  /**
   * Get reviews for a specific company type
   */
  getReviewsByCompanyType(companyType: string, page: number = 1, pageSize: number = 20): Observable<any> {
    console.log(`🔍 Getting ${companyType} reviews for admin`);
    
    return this.http.get(`http://pyramigo.runasp.net/api/Review/company?companyType=${companyType}&page=${page}&pageSize=${pageSize}`).pipe(
      tap(response => console.log(`✅ ${companyType} reviews:`, response)),
      catchError(this.handleError)
    );
  }

  /**
   * Get review statistics for admin dashboard
   */
  getReviewStatistics(): Observable<any> {
    console.log('📊 Getting review statistics for admin dashboard');
    
    const companyTypes = ['hotel', 'flight', 'carrental', 'tour'];
    const statsRequests = companyTypes.map(type => 
      this.http.get(`http://pyramigo.runasp.net/api/Review/stats?companyType=${type}`).pipe(
        catchError(() => of({ companyType: type, error: true }))
      )
    );

    return new Observable(observer => {
      Promise.all(statsRequests.map(req => req.toPromise()))
        .then(results => {
          const combinedStats = {
            totalReviews: 0,
            averageRating: 0,
            companyTypeStats: {} as any,
            recentActivity: []
          };

          results.forEach((result: any, index) => {
            const companyType = companyTypes[index];
            if (result && !result.error) {
              combinedStats.totalReviews += result.totalReviews || 0;
              combinedStats.companyTypeStats[companyType] = result;
            }
          });

          // Calculate overall average rating
          const totalRatings = Object.values(combinedStats.companyTypeStats)
            .reduce((sum: number, stats: any) => sum + (stats.totalReviews || 0), 0);
          
          const weightedRatingSum = Object.values(combinedStats.companyTypeStats)
            .reduce((sum: number, stats: any) => 
              sum + ((stats.averageRating || 0) * (stats.totalReviews || 0)), 0);
          
          combinedStats.averageRating = totalRatings > 0 ? 
            Math.round((weightedRatingSum / totalRatings) * 10) / 10 : 0;

          observer.next(combinedStats);
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }

  /**
   * Delete any review as SuperAdmin - Use Review API directly
   */
  deleteReviewAsAdmin(reviewId: number): Observable<any> {
    console.log('🗑️ Admin deleting review:', reviewId);
    
    return this.http.delete(`http://pyramigo.runasp.net/api/Review/${reviewId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => console.log('✅ Review deleted by admin:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Get review metrics for dashboard
   */
  getReviewMetrics(): Observable<any> {
    console.log('📊 Getting detailed review metrics');
    
    return new Observable(observer => {
      const companyTypes = ['hotel', 'flight', 'carrental', 'tour'];
      
      // Get data for each company type
      const requests = companyTypes.flatMap(type => [
        this.http.get(`http://pyramigo.runasp.net/api/Review/count?companyType=${type}`).pipe(
          catchError(() => of(0))
        ),
        this.http.get(`http://pyramigo.runasp.net/api/Review/average?companyType=${type}`).pipe(
          catchError(() => of(0))
        )
      ]);

      Promise.all(requests.map(req => req.toPromise()))
        .then(results => {
          const metrics = {
            totalReviews: 0,
            averageRating: 0,
            companyBreakdown: {} as any,
            topPerformingType: '',
            lowestPerformingType: '',
            monthlyGrowth: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          };

          // Process results for each company type
          companyTypes.forEach((type, index) => {
            const countIndex = index * 2;
            const avgIndex = index * 2 + 1;
            
            const count = results[countIndex] as number || 0;
            const average = results[avgIndex] as number || 0;
            
            metrics.totalReviews += count;
            metrics.companyBreakdown[type] = {
              count,
              average,
              percentage: 0 // Will calculate after total is known
            };
          });

          // Calculate percentages
          Object.keys(metrics.companyBreakdown).forEach(type => {
            metrics.companyBreakdown[type].percentage = 
              metrics.totalReviews > 0 ? 
              Math.round((metrics.companyBreakdown[type].count / metrics.totalReviews) * 100) : 0;
          });

          // Find top and lowest performing types
          let highestAvg = 0;
          let lowestAvg = 5;
          
          Object.keys(metrics.companyBreakdown).forEach(type => {
            const avg = metrics.companyBreakdown[type].average;
            if (avg > highestAvg) {
              highestAvg = avg;
              metrics.topPerformingType = type;
            }
            if (avg < lowestAvg && avg > 0) {
              lowestAvg = avg;
              metrics.lowestPerformingType = type;
            }
          });

          // Calculate overall average rating
          const totalWeightedRating = Object.values(metrics.companyBreakdown)
            .reduce((sum: number, data: any) => sum + (data.average * data.count), 0);
          
          metrics.averageRating = metrics.totalReviews > 0 ? 
            Math.round((totalWeightedRating / metrics.totalReviews) * 10) / 10 : 0;

          observer.next(metrics);
          observer.complete();
        })
        .catch(error => {
          console.error('Error getting review metrics:', error);
          observer.error(error);
        });
    });
  }

  /**
   * Get recent review activity for admin monitoring
   */
  getRecentReviewActivity(limit: number = 10): Observable<any[]> {
    console.log(`🔍 Getting recent review activity (limit: ${limit})`);
    
    const companyTypes = ['hotel', 'flight', 'carrental', 'tour'];
    const requests = companyTypes.map(type => 
      this.http.get(`http://pyramigo.runasp.net/api/Review/company?companyType=${type}&page=1&pageSize=${limit}&sortBy=newest`).pipe(
        catchError(() => of([]))
      )
    );

    return new Observable(observer => {
      Promise.all(requests.map(req => req.toPromise()))
        .then(results => {
          const allReviews = results
            .filter(result => Array.isArray(result))
            .flatMap((reviews: any) => reviews)
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, limit);

          observer.next(allReviews);
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }
}