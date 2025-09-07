
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Auth } from './auth';
import { ReviewsResponse, ReviewStatsDto } from '../../shared/Interfaces/i-review';

const API_URL = 'http://pyramigo.runasp.net/api';
const API_REVIEW_URL = `${API_URL}/Review`;

@Injectable({
  providedIn: 'root'
})
export class TourReviewService {
  private readonly apiUrl = API_REVIEW_URL;

  constructor(
    private http: HttpClient,
    private authService: Auth
  ) { }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Get all reviews for companyType=tour
   */
getAllTourReviews(
  page: number = 1,
  pageSize: number = 10,
  sortBy: string = 'newest'
): Observable<ReviewsResponse> {
  const params = new URLSearchParams();
  params.append('companyType', 'tour');
  params.append('page', page.toString());
  params.append('pageSize', pageSize.toString());
  params.append('sortBy', sortBy);
  return this.http.get<ReviewsResponse>(`${this.apiUrl}/company?${params.toString()}`, {
    headers: this.getAuthHeaders()
  });
}


  /**
   * Delete a review by ID
   */
  deleteReview(reviewId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${reviewId}`, {
      headers: this.getAuthHeaders()
    });
  }


getAllTourReviewsStats(tourCompanyId: number): Observable<ReviewStatsDto> {
  const params = new URLSearchParams();
  params.append('companyType', 'tour');
  params.append('tourCompanyId', tourCompanyId.toString());

  return this.http.get<ReviewStatsDto>(`${this.apiUrl}/stats?${params.toString()}`, {
    headers: this.getAuthHeaders()
  });
}

getCompanyAverageRating(tourCompanyId: number): Observable<number> {
  const params = new URLSearchParams();
  params.append('companyType', 'tour');
  params.append('tourId', tourCompanyId.toString()); 

  return this.http.get<number>(`${this.apiUrl}/average?${params.toString()}`, {
    headers: this.getAuthHeaders()
  });
}

getCompanyReviewsCount(tourCompanyId: number): Observable<number> {
  const params = new URLSearchParams();
  params.append('companyType', 'tour');
  params.append('tourId', tourCompanyId.toString()); 

  return this.http.get<number>(`${this.apiUrl}/count?${params.toString()}`, {
    headers: this.getAuthHeaders()
  });
}
}