// car-rental-agency-reviews.component.ts
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CarRentalCompany, CarRentalService } from '../../../../core/services/CarRental-Services';
import { Auth } from '../../../../core/services/auth';
import { CreateReviewDto, ReviewDto, ReviewService, ReviewsResponse, ReviewStatsDto } from '../../../../core/services/review-service';

@Component({
  selector: 'app-car-rental-agency-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  // Rating stars array for display
  stars = [1, 2, 3, 4, 5];
  
  // User info
  isAuthenticated = false;
  currentUser: any = null;

  ngOnInit(): void {
    this.checkAuthentication();
    this.loadMyCompanies();
       this.cd.detectChanges();
  }

checkAuthentication(): void {
  this.isAuthenticated = this.authService.isLoggedIn();
  if (this.isAuthenticated) {
    this.currentUser = this.authService.getUserId(); // or getAuthenticatedUser()
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
               this.cd.detectChanges();
        }
      },
      error: (error) => {
        console.error('Error loading companies:', error);
        this.error = 'Failed to load companies';
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
           this.cd.detectChanges();
    }
  }

  loadReviews(): void {
    if (!this.selectedCompany) return;

    this.isLoading = true;
    this.error = null;

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
             this.cd.detectChanges();
      },
      error: (error) => {
        console.error('Error loading reviews:', error);
        this.error = error.userMessage || 'Failed to load reviews';
        this.isLoading = false;
             this.cd.detectChanges();
      }
    });
  }

  loadReviewStats(): void {
    if (!this.selectedCompany) return;

    this.isLoadingStats = true;
    this.reviewService.getCompanyReviewStats('carrental', this.selectedCompany.id).subscribe({
      next: (stats) => {
        this.reviewStats = stats;
        this.isLoadingStats = false;
             this.cd.detectChanges();
      },
      error: (error) => {
        console.error('Error loading review stats:', error);
        this.isLoadingStats = false;
             this.cd.detectChanges();
      }
    });
  }

  onSortChange(sortBy: string): void {
    this.sortBy = sortBy;
    this.currentPage = 1;
    this.loadReviews();
         this.cd.detectChanges();
  }

  onRatingFilter(rating: number | null): void {
    this.filterRating = rating;
    this.currentPage = 1;
    this.loadReviews();
         this.cd.detectChanges();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadReviews();
           this.cd.detectChanges();
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
      this.error = 'You must be logged in to submit a review';
      return;
    }

    this.reviewService.createReview(this.newReview).subscribe({
      next: () => {
        this.closeAddReviewModal();
        this.loadReviews();
        this.loadReviewStats();
      },
      error: (error) => {
        console.error('Error creating review:', error);
        this.error = error.userMessage || 'Failed to create review';
      }
    });
  }

  updateReview(): void {
    if (!this.selectedReview) return;

    this.reviewService.updateReview(this.selectedReview.id, this.editReviewData).subscribe({
      next: () => {
        this.closeEditReviewModal();
        this.loadReviews();
        this.loadReviewStats();
             this.cd.detectChanges();
      },
      error: (error) => {
        console.error('Error updating review:', error);
        this.error = error.userMessage || 'Failed to update review';
      }
    });
  }

  deleteReview(): void {
    if (!this.selectedReview) return;

    this.reviewService.deleteReview(this.selectedReview.id).subscribe({
      next: () => {
        this.closeDeleteModal();
        this.loadReviews();
        this.loadReviewStats();
             this.cd.detectChanges();
      },
      error: (error) => {
        console.error('Error deleting review:', error);
        this.error = error.userMessage || 'Failed to delete review';
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

  closeAllModals(): void {
    this.showAddReviewModal = false;
    this.showEditReviewModal = false;
    this.showDeleteModal = false;
  }

  getPaginationArray(): number[] {
    return Array(this.totalPages).fill(0).map((_, i) => i + 1);
  }
  getMath(): any {
  return Math;
}
}