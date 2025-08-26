// src/app/features/pages/TourAgency/tour-agency-reviews/tour-agency-reviews.ts

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { ReviewDto, ReviewStatsDto, ReviewsResponse } from '../../../../shared/Interfaces/i-review';
import { TourReviewService } from '../../../../core/services/tour-review-service';
import { Auth } from '../../../../core/services/auth';

@Component({
  selector: 'app-tour-agency-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tour-agency-reviews.html',
  styleUrls: ['./tour-agency-reviews.css']
})
export class TourAgencyReviews implements OnInit, OnDestroy {
  // State
  private destroy$ = new Subject<void>();
  isLoading = false;
  errorMessage = '';
  viewMode: 'list' | 'grid' = 'list';
  highlightedReviewId?: number;

  // Data
  reviews: ReviewDto[] = [];
  reviewStats?: ReviewStatsDto;

  // Pagination
  currentPage = 1;
  readonly pageSize = 10;
  totalReviews = 0;
  totalPages = 0;

  // Filters & Sorting
  selectedRatingFilter = '';
  sortBy = 'newest';

  constructor(
    private reviewService: TourReviewService,
    private authService: Auth,
     private cd: ChangeDetectorRef 
  ) { }

  ngOnInit(): void {
    this.loadReviews();
    this.loadReviewStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // === Data Loading ===
loadReviews(): void {
  this.isLoading = true;
  this.errorMessage = '';

  // Capture start time
  const startTime = Date.now();

  this.reviewService.getAllTourReviews(this.currentPage, this.pageSize, this.sortBy)
    .pipe(
      takeUntil(this.destroy$),
      finalize(async () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(1000 - elapsed, 0); // Minimum 1 second

        // Wait remaining time if needed
        await new Promise(resolve => setTimeout(resolve, remaining));

        this.isLoading = false;
        this.cd.detectChanges(); // Force UI update
      })
    )
    .subscribe({
      next: (raw: any) => {
        const response = Array.isArray(raw)
          ? { reviews: raw, totalCount: raw.length }
          : raw;

        this.reviews = response.reviews || [];
        this.totalReviews = response.totalCount || 0;
        this.totalPages = Math.ceil(this.totalReviews / this.pageSize);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to load reviews';
        console.error('Error loading reviews:', err);
      }
    });
}

private getTourCompanyId(): number | null {
  const token = this.authService.getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1])); // Decode JWT
    const tourCompanyId = payload['TourCompanyId'];
    return tourCompanyId ? +tourCompanyId : null; // Convert to number
  } catch (e) {
    console.error('Invalid token or unable to parse:', e);
    return null;
  }
}

loadReviewStats(): void {
  const token = this.authService.getToken();
  console.log('🔐 Auth Token:', token);

  const tourCompanyId = this.getTourCompanyId();
  console.log('🏢 TourCompanyId:', tourCompanyId);

  if (!tourCompanyId) {
    this.errorMessage = 'Not authorized or TourCompanyId missing.';
    this.reviewStats = undefined;
    this.cd.detectChanges();
    return;
  }

  console.log('🚀 Fetching stats for tourCompanyId:', tourCompanyId);

  this.reviewService.getAllTourReviewsStats(tourCompanyId)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (stats) => {
        console.log('✅ Stats loaded:', stats);
        this.reviewStats = stats;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error loading stats:', err);
        this.errorMessage = 'Failed to load review stats';
        this.reviewStats = undefined;
        this.cd.detectChanges();
      }
    });
}

  // === Filters & Pagination ===
  onFilterChange(): void {
    this.currentPage = 1;
    this.loadReviews();
  }

  onSortChange(): void {
    this.currentPage = 1;
    this.loadReviews();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadReviews();
    }
  }

  getPageNumbers(): number[] {
    const maxVisible = 5;
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, this.currentPage - half);
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  // === Review Actions ===
  deleteReview(reviewId: number): void {
    if (!confirm('Are you sure you want to delete this review?')) return;

    this.reviewService.deleteReview(reviewId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadReviews();
          this.loadReviewStats();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to delete review';
        }
      });
  }

  // === Utility Methods ===
  private filterByRating(reviews: ReviewDto[]): ReviewDto[] {
    const rating = this.selectedRatingFilter ? +this.selectedRatingFilter : null;
    return rating ? reviews.filter(r => r.rating === rating) : reviews;
  }

  getRatingText(rating: number): string {
    const texts: Record<number, string> = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return rating ? texts[rating] || '' : 'Select Rating';
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return 'Invalid Date';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  }

  getStarsArray(rating: number): number[] {
    return [1, 2, 3, 4, 5];
  }

  getStarClass(star: number, rating: number): string {
    return star <= rating ? 'fas fa-star filled' : 'far fa-star';
  }

  getDistributionPercentage(rating: number): number {
    if (!this.reviewStats?.totalReviews) return 0;
    const count = this.reviewStats.ratingDistribution[rating] || 0;
    return (count / this.reviewStats.totalReviews) * 100;
  }

canEditReview(review: ReviewDto): boolean {
  const userId = this.authService.getUserId();
  const roles = this.authService.getRoles();

  console.log('Review:', review);
  console.log('Current user ID:', userId);
  console.log('User roles:', roles);

  return !!review.userId && (
    review.userId === userId ||
    roles.includes('SuperAdmin') ||
    roles.includes('TourAdmin')
  );
}

  trackByReviewId(index: number, review: ReviewDto): number {
    return review.id;
  }
}