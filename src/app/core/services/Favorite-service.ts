// favorites.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap, map, switchMap } from 'rxjs/operators';

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

export interface FavoritesResponse {
  data: FavoriteItem[];
  totalCount: number;
  page: number;
  pageSize: number;
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
    
    let errorMessage = 'حدث خطأ غير متوقع';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `خطأ: ${error.error.message}`;
    } else {
      if (error.status === 401) {
        errorMessage = 'غير مخول للوصول';
      } else if (error.status === 403) {
        errorMessage = 'ممنوع الوصول';
      } else if (error.status === 404) {
        errorMessage = 'المورد غير موجود';
      } else if (error.status === 409) {
        errorMessage = 'العنصر موجود بالفعل في المفضلة';
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
}