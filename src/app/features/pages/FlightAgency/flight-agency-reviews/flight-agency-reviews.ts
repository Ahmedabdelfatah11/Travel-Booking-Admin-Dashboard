import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { CreateReviewDto, ReviewDto, ReviewService, ReviewsResponse, ReviewStatsDto } from '../../../../core/services/review-service';
import { Auth } from '../../../../core/services/auth';


@Component({
  selector: 'app-flight-agency-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './flight-agency-reviews.html',
  styleUrls: ['./flight-agency-reviews.css']
})
export class FlightAgencyReviews implements OnInit, OnDestroy {
  flightCompanyId: number | null = null;
  error: string | null = null;

  // Component State
  private destroy$ = new Subject<void>();

  // Data Properties
  reviews: ReviewDto[] = [];
  reviewStats?: ReviewStatsDto;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalReviews = 0;
  totalPages = 0;

  // UI State
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  showReviewForm = false;
  viewMode: 'list' | 'grid' = 'list';
  highlightedReviewId?: number;

  // Filters and Sorting
  selectedRatingFilter = '';
  sortBy = 'newest';

  // Form
  reviewForm: FormGroup;
  hoverRating = 0;
  editingReview?: ReviewDto;

  constructor(
    private reviewService: ReviewService,
    private authService: Auth,
    private fb: FormBuilder
  ) {
    this.reviewForm = this.createReviewForm();
  }

  async ngOnInit() {
    await this.initializeComponent();

  }
  private async initializeComponent(): Promise<void> {
    // Get FlightCompanyId from user roles/token
    this.flightCompanyId = this.getFlightCompanyIdFromToken();

    if (!this.flightCompanyId) {
      this.error = 'Flight company information not found. Please contact support.';
      return;
    }

    await this.loadReviews();
    await this.loadReviewStats();;
  }

  private getFlightCompanyIdFromToken(): number | null {
    // This method extracts FlightCompanyId from the JWT token
    // You'll need to decode the JWT token to get the FlightCompanyId claim
    const token = this.authService.getToken();
    if (!token) return null;

    try {
      // Decode JWT token payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      const flightCompanyId = payload['FlightCompanyId'];
      return flightCompanyId ? parseInt(flightCompanyId) : null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Form Creation
  private createReviewForm(): FormGroup {
    return this.fb.group({
      rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.maxLength(500)]]
    });
  }

  // Data Loading Methods
  loadReviews(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const ratingFilter = this.selectedRatingFilter ? parseInt(this.selectedRatingFilter) : undefined;

    this.reviewService.getCompanyReviews(
      'flight',
      this.flightCompanyId!,
      this.currentPage,
      this.pageSize,
      this.sortBy
    ).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (response: ReviewsResponse) => {
        this.reviews = ratingFilter ?
          response.reviews.filter(r => r.rating === ratingFilter) :
          response.reviews;
        this.totalReviews = response.totalCount;
        this.totalPages = Math.ceil(this.totalReviews / this.pageSize);
      },
      error: (error) => {
        this.errorMessage = error.userMessage || 'Failed to load reviews';
        console.error('Error loading reviews:', error);
      }
    });
  }

  loadReviewStats(): void {
    this.reviewService.getCompanyReviewStats('flight', this.flightCompanyId!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.reviewStats = stats;
        },
        error: (error) => {
          console.error('Error loading review stats:', error);
        }
      });
  }

  // Review Form Methods
  toggleReviewForm(): void {
    this.showReviewForm = !this.showReviewForm;
    if (this.showReviewForm) {
      this.reviewForm.reset();
      this.editingReview = undefined;
    }
  }

  setRating(rating: number): void {
    this.reviewForm.patchValue({ rating });
  }

  getRatingText(rating: number): string {
    const ratingTexts = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return rating > 0 ? ratingTexts[rating as keyof typeof ratingTexts] || '' : 'Select Rating';
  }

  onSubmitReview(): void {
    if (this.reviewForm.invalid) return;

    this.isSubmitting = true;
    const formValue = this.reviewForm.value;

    const reviewData: CreateReviewDto = {
      companyType: 'flight',
      flightCompanyId: this.flightCompanyId!,
      rating: formValue.rating,
      comment: formValue.comment
    };

    const operation = this.editingReview ?
      this.reviewService.updateReview(this.editingReview.id, {
        rating: formValue.rating,
        comment: formValue.comment
      }) :
      this.reviewService.createReview(reviewData);

    operation.pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: () => {
        this.showReviewForm = false;
        this.reviewForm.reset();
        this.editingReview = undefined;
        this.loadReviews();
        this.loadReviewStats();

        // Highlight new review
        if (!this.editingReview) {
          setTimeout(() => {
            this.highlightedReviewId = this.reviews[0]?.id;
            setTimeout(() => this.highlightedReviewId = undefined, 3000);
          }, 100);
        }
      },
      error: (error) => {
        this.errorMessage = error.userMessage || 'Failed to submit review';
        console.error('Error submitting review:', error);
      }
    });
  }

  editReview(review: ReviewDto): void {
    this.editingReview = review;
    this.reviewForm.patchValue({
      rating: review.rating,
      comment: review.comment
    });
    this.showReviewForm = true;
  }

  deleteReview(reviewId: number): void {
    if (!confirm('Are you sure you want to delete this review?')) return;

    this.reviewService.deleteReview(reviewId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadReviews();
          this.loadReviewStats();
        },
        error: (error) => {
          this.errorMessage = error.userMessage || 'Failed to delete review';
          console.error('Error deleting review:', error);
        }
      });
  }

  cancelReview(): void {
    this.showReviewForm = false;
    this.reviewForm.reset();
    this.editingReview = undefined;
  }

  // Filter and Sort Methods
  onFilterChange(): void {
    this.currentPage = 1;
    this.loadReviews();
  }

  onSortChange(): void {
    this.currentPage = 1;
    this.loadReviews();
  }

  // Pagination Methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadReviews();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let start = Math.max(1, this.currentPage - halfVisible);
    let end = Math.min(this.totalPages, start + maxVisiblePages - 1);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Utility Methods
  trackByReviewId(index: number, review: ReviewDto): number {
    return review.id;
  }

  canEditReview(review: ReviewDto): boolean {
    // Implement your user permission logic here
    // For example, check if current user ID matches review.userId
    // or if user has admin role
    return false; // Placeholder - implement based on your auth system
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getStarsArray(rating: number): number[] {
    return [1, 2, 3, 4, 5];
  }

  getStarClass(star: number, rating: number): string {
    return star <= rating ? 'fas fa-star filled' : 'far fa-star';
  }

  getDistributionPercentage(rating: number): number {
    if (!this.reviewStats || this.reviewStats.totalReviews === 0) return 0;
    const count = this.reviewStats.ratingDistribution[rating] || 0;
    return (count / this.reviewStats.totalReviews) * 100;
  }

  // Add Math to template context
  Math = Math;
}