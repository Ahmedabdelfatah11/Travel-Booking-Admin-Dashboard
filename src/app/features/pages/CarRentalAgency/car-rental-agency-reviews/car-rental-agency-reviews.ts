import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CarRentalCompany, CarRentalService } from '../../../../core/services/CarRental-Services';
import { Auth } from '../../../../core/services/auth';
import { CreateReviewDto, ReviewDto, ReviewService, ReviewsResponse, ReviewStatsDto } from '../../../../core/services/review-service';

// Toast interface
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
}

@Component({
  selector: 'app-car-rental-agency-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule ],
  templateUrl: './car-rental-agency-reviews.html',
  styleUrls: ['./car-rental-agency-reviews.css']
})
export class CarRentalAgencyReviews implements OnInit {
  private reviewService = inject(ReviewService);
  private carRentalService = inject(CarRentalService);
  private authService = inject(Auth);
  private cd = inject(ChangeDetectorRef);

  // Component state
  reviews: ReviewDto[] = [];
  myCompanies: CarRentalCompany[] = [];
  selectedCompany: CarRentalCompany | null = null;
  reviewStats: ReviewStatsDto | null = null;
  isLoading = false;
  isLoadingStats = false;
  error: string | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalReviews = 0;
  totalPages = 0;

  // Filters and sorting
  sortBy = 'newest';
  filterRating: number | null = null;

  // Modal states
  showAddReviewModal = false;
  showEditReviewModal = false;
  showDeleteModal = false;
  selectedReview: ReviewDto | null = null;

  // Form data
  newReview: CreateReviewDto = {
    companyType: 'carrental',
    carRentalCompanyId: 0,
    rating: 5,
    comment: ''
  };

  editReviewData = {
    rating: 5,
    comment: ''
  };

  // Rating stars array
  stars = [1, 2, 3, 4, 5];

  // User info
  isAuthenticated = false;
  currentUser: any = null;

  // Toasts
  private toastId = 0;
  toasts: Toast[] = [];

  ngOnInit(): void {
    this.checkAuthentication();
    this.loadMyCompanies();
    this.cd.detectChanges();
  }

  checkAuthentication(): void {
    this.isAuthenticated = this.authService.isLoggedIn();
    if (this.isAuthenticated) {
      this.currentUser = this.authService.getUserId();
    }
  }

  loadMyCompanies(): void {
    this.carRentalService.getMyCompanies().subscribe({
      next: (companies) => {
        this.myCompanies = companies;
        if (companies.length > 0) {
          this.selectedCompany = companies[0];
          this.loadReviews();
          this.loadReviewStats();
        }
        this.cd.detectChanges();
      },
      error: (error) => {
        this.showToast('Failed to load your companies.', 'error');
        this.cd.detectChanges();
      }
    });
  }

  onCompanyChange(event: any): void {
    const companyId = parseInt(event.target.value);
    const company = this.myCompanies.find(c => c.id === companyId);
    if (company) {
      this.selectedCompany = company;
      this.currentPage = 1;
      this.loadReviews();
      this.loadReviewStats();
    }
  }

  loadReviews(): void {
    if (!this.selectedCompany) return;

    this.isLoading = true;
    this.cd.detectChanges();

    const startTime = Date.now();

    this.reviewService.getCompanyReviews(
      'carrental',
      this.selectedCompany.id,
      this.currentPage,
      this.pageSize,
      this.sortBy
    ).subscribe({
      next: (response: ReviewsResponse) => {
        this.reviews = response.reviews;
        this.totalReviews = response.totalCount;
        this.totalPages = Math.ceil(this.totalReviews / this.pageSize);
        this.isLoading = false;
        this.finishLoading(startTime);
      },
      error: (error) => {
        this.isLoading = false;
        this.showToast(error.userMessage || 'Failed to load reviews', 'error');
        this.finishLoading(startTime);
      }
    });
  }

  loadReviewStats(): void {
    if (!this.selectedCompany) return;

    this.isLoadingStats = true;
    this.cd.detectChanges();

    const startTime = Date.now();

    this.reviewService.getCompanyReviewStats('carrental', this.selectedCompany.id).subscribe({
      next: (stats) => {
        this.reviewStats = stats;
        this.isLoadingStats = false;
        this.finishLoading(startTime);
      },
      error: (error) => {
        this.isLoadingStats = false;
        this.showToast('Failed to load review statistics.', 'error');
        this.finishLoading(startTime);
      }
    });
  }

  private finishLoading(startTime: number): void {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(1000 - elapsed, 0);

    setTimeout(() => {
      this.cd.detectChanges();
    }, remaining);
  }

  onSortChange(sortBy: string): void {
    this.sortBy = sortBy;
    this.currentPage = 1;
    this.loadReviews();
  }

  onRatingFilter(rating: number | null): void {
    this.filterRating = rating;
    this.currentPage = 1;
    this.loadReviews();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadReviews();
    }
  }

  // Modal methods
  openAddReviewModal(): void {
    if (!this.selectedCompany) return;

    this.newReview = {
      companyType: 'carrental',
      carRentalCompanyId: this.selectedCompany.id,
      rating: 5,
      comment: ''
    };
    this.showAddReviewModal = true;
  }

  closeAddReviewModal(): void {
    this.showAddReviewModal = false;
    this.newReview = {
      companyType: 'carrental',
      carRentalCompanyId: 0,
      rating: 5,
      comment: ''
    };
  }

  openEditReviewModal(review: ReviewDto): void {
    this.selectedReview = review;
    this.editReviewData = {
      rating: review.rating,
      comment: review.comment || ''
    };
    this.showEditReviewModal = true;
  }

  closeEditReviewModal(): void {
    this.showEditReviewModal = false;
    this.selectedReview = null;
    this.editReviewData = { rating: 5, comment: '' };
  }

  openDeleteModal(review: ReviewDto): void {
    this.selectedReview = review;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedReview = null;
  }

  // Review operations
  submitReview(): void {
    if (!this.isAuthenticated) {
      this.showToast('You must be logged in to submit a review.', 'error');
      return;
    }

    this.reviewService.createReview(this.newReview).subscribe({
      next: () => {
        this.closeAddReviewModal();
        this.showToast('Review submitted successfully!', 'success');
        this.loadReviews();
        this.loadReviewStats();
      },
      error: (error) => {
        this.showToast(error.userMessage || 'Failed to create review.', 'error');
      }
    });
  }

  updateReview(): void {
    if (!this.selectedReview) return;

    this.reviewService.updateReview(this.selectedReview.id, this.editReviewData).subscribe({
      next: () => {
        this.closeEditReviewModal();
        this.showToast('Review updated successfully!', 'success');
        this.loadReviews();
        this.loadReviewStats();
      },
      error: (error) => {
        this.showToast(error.userMessage || 'Failed to update review.', 'error');
      }
    });
  }

  deleteReview(): void {
    if (!this.selectedReview) return;

    this.reviewService.deleteReview(this.selectedReview.id).subscribe({
      next: () => {
        this.closeDeleteModal();
        this.showToast('Review deleted successfully!', 'success');
        this.loadReviews();
        this.loadReviewStats();
      },
      error: (error) => {
        this.showToast(error.userMessage || 'Failed to delete review.', 'error');
      }
    });
  }

  // Helper methods
  canEditReview(review: ReviewDto): boolean {
    return this.isAuthenticated && this.currentUser?.uid === review.userId;
  }

  canDeleteReview(review: ReviewDto): boolean {
    return this.isAuthenticated && this.currentUser?.uid === review.userId;
  }

  getStarArray(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }

  getEmptyStarArray(rating: number): number[] {
    return Array(5 - Math.ceil(rating)).fill(0);
  }

  getRatingPercentage(rating: number): number {
    if (!this.reviewStats?.totalReviews) return 0;
    const count = this.reviewStats.ratingDistribution[rating] || 0;
    return (count / this.reviewStats.totalReviews) * 100;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getPaginationArray(): number[] {
    return Array(this.totalPages).fill(0).map((_, i) => i + 1);
  }

  getMath(): any {
    return Math;
  }

  // === Toast Management ===
  showToast(message: string, type: 'success' | 'error' | 'info'): void {
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