// favorites.service.ts - Enhanced for SuperAdmin
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError,catchError, tap, map, switchMap } from 'rxjs';


// Interfaces
export interface FavoriteItem {
  id: number;
  userId: string;
  companyType: string;
  hotelCompanyId?: number;
  tourCompanyId?: number;
  tourId?: number;
  createdAt: string;
  companyName?: string;
  companyDescription?: string;
  companyImageUrl?: string;
  companyLocation?: string;
  userName?: string;
  userEmail?: string;
}

export interface CreateFavoriteDto {
  companyType: string;
  hotelCompanyId?: number;
  tourCompanyId?: number;
  tourId?: number;
}

export interface FavoriteCheckDto {
  companyType: string;
  hotelCompanyId?: number;
  tourCompanyId?: number;
  tourId?: number;
}

export interface AdminFavoritesResponse {
  data: FavoriteItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface FavoritesStats {
  totalFavorites: number;
  userStats: Array<{ userId: string; count: number }>;
  companyTypeStats: Array<{ companyType: string; count: number }>;
  recentActivity: Array<{
    id: number;
    userId: string;
    userName: string;
    email: string;
    companyType: string;
    createdAt: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private apiUrl = 'http://pyramigo.runasp.net/api/Favorite';
  private favoritesSubject = new BehaviorSubject<FavoriteItem[]>([]);
  public favorites$ = this.favoritesSubject.asObservable();
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
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

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Favorites API Error:', error);
    
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.status === 401) {
        errorMessage = 'Unauthorized access';
      } else if (error.status === 403) {
        errorMessage = 'Access forbidden';
      } else if (error.status === 404) {
        errorMessage = 'Resource not found';
      } else if (error.status === 409) {
        errorMessage = 'Item already exists in favorites';
      } else if (error.error) {
        if (error.error.message) {
          errorMessage = error.error.message;
        } else if (typeof error.error === 'string') {
          errorMessage = error.error;
        }
      }
    }
    
    return throwError(() => ({
      ...error,
      userMessage: errorMessage
    }));
  }

  // ==================== USER METHODS (Existing) ====================

  /**
   * Get all user favorites with pagination
   */
  getUserFavorites(page: number = 1, pageSize: number = 10): Observable<FavoriteItem[]> {
    this.loadingSubject.next(true);
    
    return this.http.get<FavoriteItem[]>(`${this.apiUrl}?page=${page}&pageSize=${pageSize}`, {
      headers: this.getAuthHeaders(),
      observe: 'response'
    }).pipe(
      tap(response => {
        console.log('Favorites response:', response);
        const totalCount = response.headers.get('X-Total-Count');
        const currentPage = response.headers.get('X-Page');
        const pageSizeHeader = response.headers.get('X-Page-Size');
        
        console.log('Pagination info:', { totalCount, currentPage, pageSizeHeader });
      }),
      map(response => response.body || []),
      tap(favorites => {
        this.favoritesSubject.next(favorites);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        return this.handleError(error);
      })
    );
  }

  /**
   * Get user favorites by company type
   */
  getUserFavoritesByType(companyType: string, page: number = 1, pageSize: number = 10): Observable<FavoriteItem[]> {
    this.loadingSubject.next(true);
    
    return this.http.get<FavoriteItem[]>(`${this.apiUrl}/type/${companyType}?page=${page}&pageSize=${pageSize}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(favorites => {
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        return this.handleError(error);
      })
    );
  }

  /**
   * Add item to favorites
   */
  addToFavorites(favoriteDto: CreateFavoriteDto): Observable<FavoriteItem> {
    return this.http.post<FavoriteItem>(this.apiUrl, favoriteDto, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(newFavorite => {
        const currentFavorites = this.favoritesSubject.value;
        this.favoritesSubject.next([newFavorite, ...currentFavorites]);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Remove item from favorites
   */
  removeFromFavorites(favoriteId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${favoriteId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => {
        const currentFavorites = this.favoritesSubject.value;
        const updatedFavorites = currentFavorites.filter(fav => fav.id !== favoriteId);
        this.favoritesSubject.next(updatedFavorites);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Check if item is in favorites
   */
  checkFavorite(checkDto: FavoriteCheckDto): Observable<boolean> {
    return this.http.post<boolean>(`${this.apiUrl}/check`, checkDto, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get favorites count by company type
   */
  getFavoritesCount(): Observable<{ [key: string]: number }> {
    return this.http.get<{ [key: string]: number }>(`${this.apiUrl}/count`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== SUPERADMIN METHODS (New) ====================

  /**
   * SuperAdmin: Get all favorites from all users
   */
  getAllUsersFavorites(
    page: number = 1, 
    pageSize: number = 10,
    userId?: string,
    companyType?: string,
    searchTerm?: string
  ): Observable<{ favorites: FavoriteItem[], totalCount: number, page: number, pageSize: number }> {
    this.loadingSubject.next(true);
    
    let params = `?page=${page}&pageSize=${pageSize}`;
    if (userId) params += `&userId=${encodeURIComponent(userId)}`;
    if (companyType) params += `&companyType=${encodeURIComponent(companyType)}`;
    if (searchTerm) params += `&searchTerm=${encodeURIComponent(searchTerm)}`;

    return this.http.get<FavoriteItem[]>(`${this.apiUrl}/admin/all${params}`, {
      headers: this.getAuthHeaders(),
      observe: 'response'
    }).pipe(
      map(response => ({
        favorites: response.body || [],
        totalCount: parseInt(response.headers.get('X-Total-Count') || '0'),
        page: parseInt(response.headers.get('X-Page') || '1'),
        pageSize: parseInt(response.headers.get('X-Page-Size') || '10')
      })),
      tap(result => {
        this.favoritesSubject.next(result.favorites);
        this.loadingSubject.next(false);
        console.log('SuperAdmin favorites loaded:', result);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        return this.handleError(error);
      })
    );
  }

  /**
   * SuperAdmin: Get favorites for a specific user
   */
  getUserFavoritesByAdmin(
    userId: string,
    page: number = 1,
    pageSize: number = 10,
    companyType?: string
  ): Observable<{ favorites: FavoriteItem[], totalCount: number }> {
    this.loadingSubject.next(true);
    
    let params = `?page=${page}&pageSize=${pageSize}`;
    if (companyType) params += `&companyType=${encodeURIComponent(companyType)}`;

    return this.http.get<FavoriteItem[]>(`${this.apiUrl}/admin/user/${userId}${params}`, {
      headers: this.getAuthHeaders(),
      observe: 'response'
    }).pipe(
      map(response => ({
        favorites: response.body || [],
        totalCount: parseInt(response.headers.get('X-Total-Count') || '0')
      })),
      tap(result => {
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        return this.handleError(error);
      })
    );
  }

  /**
   * SuperAdmin: Get favorites statistics
   */
  getFavoritesStats(): Observable<FavoritesStats> {
    return this.http.get<FavoritesStats>(`${this.apiUrl}/admin/stats`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * SuperAdmin: Bulk delete favorites
   */
  bulkRemoveFavorites(favoriteIds: number[]): Observable<{ deletedCount: number, message: string }> {
    return this.http.delete<{ deletedCount: number, message: string }>(`${this.apiUrl}/admin/bulk`, {
      headers: this.getAuthHeaders(),
      body: favoriteIds
    }).pipe(
      tap(result => {
        // Update local state by removing deleted items
        const currentFavorites = this.favoritesSubject.value;
        const updatedFavorites = currentFavorites.filter(fav => !favoriteIds.includes(fav.id));
        this.favoritesSubject.next(updatedFavorites);
        console.log('Bulk delete result:', result);
      }),
      catchError(this.handleError)
    );
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Clear all favorites from local state
   */
  clearFavorites(): void {
    this.favoritesSubject.next([]);
  }

  /**
   * Get current favorites from local state
   */
  getCurrentFavorites(): FavoriteItem[] {
    return this.favoritesSubject.value;
  }

  /**
   * Refresh favorites list
   */
  refreshFavorites(): Observable<FavoriteItem[]> {
    return this.getUserFavorites(1, 50);
  }

  /**
   * Check if current user is SuperAdmin
   */
  isSuperAdmin(): boolean {
    const token = localStorage.getItem('authToken');
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role === 'SuperAdmin' || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] === 'SuperAdmin';
    } catch {
      return false;
    }
  }
}