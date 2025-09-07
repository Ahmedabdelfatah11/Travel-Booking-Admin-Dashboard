import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpResponse, HttpErrorResponse } from '@angular/common/http';

import { BehaviorSubject, Observable, of, throwError, catchError, map, tap } from 'rxjs';

// Interfaces
export interface ReviewDto {
  id: number;
  userId: string;
  companyType: string;
  hotelCompanyId?: number;
  flightCompanyId?: number;
  carRentalCompanyId?: number;
  tourCompanyId?: number;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt?: Date;
  companyName?: string;
  companyDescription?: string;
  companyImageUrl?: string;
  companyLocation?: string;
  userName?: string;
  userEmail?: string;
}

export interface CreateReviewDto {
  companyType: string;
  hotelCompanyId?: number;
  flightCompanyId?: number;
  carRentalCompanyId?: number;
  tourCompanyId?: number;
  rating: number;
  comment?: string;
}

export interface UpdateReviewDto {
  rating: number;
  comment?: string;
}

export interface ReviewStatsDto {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
  recentReviews: ReviewDto[];
}

export interface ReviewsResponse {
  reviews: ReviewDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = 'http://pyramigo.runasp.net/api/Review';
  private reviewsSubject = new BehaviorSubject<ReviewDto[]>([]);
  public reviews$ = this.reviewsSubject.asObservable();

  constructor(private http: HttpClient) { }

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
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.error) {
        if (error.error.message) {
          errorMessage = error.error.message;
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

  /**
   * Get reviews for a specific company
   */
  getCompanyReviews(
    companyType: string,
    companyId?: number,
    page: number = 1,
    pageSize: number = 10,
    sortBy: string = 'newest'
  ): Observable<ReviewsResponse> {
    if (!companyType) {
      return throwError(() => new Error('Company type is required'));
    }

    let params = new HttpParams()
      .set('companyType', companyType)
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('sortBy', sortBy);

    if (companyId && companyId > 0) {
      switch (companyType.toLowerCase()) {
        case 'hotel':
          params = params.set('hotelId', companyId.toString());
          break;
        case 'flight':
          params = params.set('flightId', companyId.toString());
          break;
        case 'carrental':
          params = params.set('carRentalId', companyId.toString());
          break;
        case 'tour':
          params = params.set('tourId', companyId.toString());
          break;
      }
    }

    return this.http.get<ReviewDto[]>(`${this.apiUrl}/company`, {
      params,
      observe: 'response'
    }).pipe(
      map(response => {
        const totalCount = parseInt(response.headers.get('X-Total-Count') || '0');
        const currentPage = parseInt(response.headers.get('X-Page') || page.toString());
        const currentPageSize = parseInt(response.headers.get('X-Page-Size') || pageSize.toString());

        const result = {
          reviews: response.body || [],
          totalCount,
          page: currentPage,
          pageSize: currentPageSize
        };

        return result;
      }),
      tap(result => {
        this.reviewsSubject.next(result.reviews);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get all reviews across all companies (for SuperAdmin)
   */
  getAllReviews(page: number = 1, pageSize: number = 20): Observable<ReviewsResponse> {
    const companyTypes = ['hotel', 'flight', 'carrental', 'tour'];

    const allReviewsObservables = companyTypes.map(type =>
      this.http.get<ReviewDto[]>(`${this.apiUrl}/company`, {
        params: new HttpParams()
          .set('companyType', type)
          .set('page', '1')
          .set('pageSize', '1000')
          .set('sortBy', 'newest'),
        observe: 'response'
      }).pipe(
        map(response => response.body || []),
        catchError(() => [])
      )
    );

    return new Observable(observer => {
      Promise.all(allReviewsObservables.map(obs => obs.toPromise()))
        .then(results => {
          const allReviews = results
            .filter(result => result && Array.isArray(result))
            .flatMap(result => result!)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          const totalCount = allReviews.length;
          const startIndex = (page - 1) * pageSize;
          const paginatedReviews = allReviews.slice(startIndex, startIndex + pageSize);

          const response: ReviewsResponse = {
            reviews: paginatedReviews,
            totalCount,
            page,
            pageSize
          };

          observer.next(response);
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  /**
   * Get user's own reviews
   */
  getUserReviews(page: number = 1, pageSize: number = 10): Observable<ReviewsResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<ReviewDto[]>(`${this.apiUrl}/user`, {
      params,
      headers: this.getAuthHeaders(),
      observe: 'response'
    }).pipe(
      map(response => {
        const totalCount = parseInt(response.headers.get('X-Total-Count') || '0');

        return {
          reviews: response.body || [],
          totalCount,
          page,
          pageSize
        };
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Create a new review
   */
  createReview(reviewData: CreateReviewDto): Observable<ReviewDto> {
    return this.http.post<ReviewDto>(this.apiUrl, reviewData, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Update an existing review
   */
  updateReview(reviewId: number, reviewData: UpdateReviewDto): Observable<any> {
    return this.http.put(`${this.apiUrl}/${reviewId}`, reviewData, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Delete a review
   */
  deleteReview(reviewId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${reviewId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get company average rating
   */
  getCompanyAverageRating(companyType: string, companyId?: number): Observable<number> {
    let params = new HttpParams().set('companyType', companyType);

    if (companyId && companyId > 0) {
      switch (companyType.toLowerCase()) {
        case 'hotel':
          params = params.set('hotelId', companyId.toString());
          break;
        case 'flight':
          params = params.set('flightId', companyId.toString());
          break;
        case 'carrental':
          params = params.set('carRentalId', companyId.toString());
          break;
        case 'tour':
          params = params.set('tourId', companyId.toString());
          break;
      }
    }

    return this.http.get<number>(`${this.apiUrl}/average`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get company reviews count
   */
  getCompanyReviewsCount(companyType: string, companyId?: number): Observable<number> {
    let params = new HttpParams().set('companyType', companyType);

    if (companyId && companyId > 0) {
      switch (companyType.toLowerCase()) {
        case 'hotel':
          params = params.set('hotelId', companyId.toString());
          break;
        case 'flight':
          params = params.set('flightId', companyId.toString());
          break;
        case 'carrental':
          params = params.set('carRentalId', companyId.toString());
          break;
        case 'tour':
          params = params.set('tourId', companyId.toString());
          break;
      }
    }

    return this.http.get<number>(`${this.apiUrl}/count`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get comprehensive review statistics
   */
  getCompanyReviewStats(companyType: string, companyId?: number): Observable<ReviewStatsDto> {
    let params = new HttpParams().set('companyType', companyType);

    if (companyId && companyId > 0) {
      switch (companyType.toLowerCase()) {
        case 'hotel':
          params = params.set('hotelId', companyId.toString());
          break;
        case 'flight':
          params = params.set('flightId', companyId.toString());
          break;
        case 'carrental':
          params = params.set('carRentalId', companyId.toString());
          break;
        case 'tour':
          params = params.set('tourCompanyId', companyId.toString());
          break;
      }
    }

    return this.http.get<ReviewStatsDto>(`${this.apiUrl}/stats`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Check if user has reviewed a company
   */
  checkUserReview(reviewData: CreateReviewDto): Observable<boolean> {
    return this.http.post<boolean>(`${this.apiUrl}/check`, reviewData, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get reviews with advanced filtering
   */
  getFilteredReviews(filters: {
    companyType?: string;
    companyId?: number;
    rating?: number;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
    sortBy?: string;
  }): Observable<ReviewsResponse> {
    const companyType = filters.companyType || '';
    const companyId = filters.companyId;
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 10;
    const sortBy = filters.sortBy || 'newest';

    if (companyType) {
      return this.getCompanyReviews(companyType, companyId, page, pageSize, sortBy).pipe(
        map(response => {
          let reviews = response.reviews;

          if (filters.rating) {
            reviews = reviews.filter(r => r.rating === filters.rating);
          }

          if (filters.startDate) {
            reviews = reviews.filter(r => new Date(r.createdAt) >= filters.startDate!);
          }

          if (filters.endDate) {
            reviews = reviews.filter(r => new Date(r.createdAt) <= filters.endDate!);
          }

          const totalCount = reviews.length;

          return {
            reviews,
            totalCount,
            page,
            pageSize
          };
        }),
        catchError(this.handleError)
      );
    } else {
      return this.getAllReviews(page, pageSize);
    }
  }
}