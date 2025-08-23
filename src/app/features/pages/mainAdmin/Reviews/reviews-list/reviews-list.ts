import { Component, OnInit, ViewChild, ElementRef, Renderer2, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SuperadminServices } from '../../../../../core/services/superadmin-services';
import { ReviewDto, ReviewService, ReviewsResponse, ReviewStatsDto } from '../../../../../core/services/review-service';
import { ToastrService } from 'ngx-toastr';

// Add missing interfaces
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

@Component({
  selector: 'app-reviews-list',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule
  ],
  templateUrl: './reviews-list.html',
  styleUrl: './reviews-list.css'
})
export class ReviewsListComponent implements OnInit, AfterViewInit {
  @ViewChild('reviewModal', { static: false }) reviewModal!: ElementRef;
  @ViewChild('deleteModal', { static: false }) deleteModal!: ElementRef;
  @ViewChild('statsModal', { static: false }) statsModal!: ElementRef;

  // Data properties
  reviews: ReviewDto[] = [];
  filteredReviews: ReviewDto[] = [];
  companies: any[] = [];
  reviewStats: ReviewStatsDto | null = null;
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalReviews = 0;
  totalPages = 0;
  
  // Loading states - FIXED: Initialize properly to prevent change detection issues
  loading = false;
  statsLoading = false;
  companiesLoading = false;
  isSubmitting = false; // Added for form submission state
  
  // Filter properties
  selectedCompanyType = '';
  selectedCompanyId: number | null = null;
  selectedRating: number | null = null;
  sortBy = 'newest';
  searchTerm = '';
  startDate = '';
  endDate = '';
  
  // Modal properties
  currentModal: any = null;
  editingReview: ReviewDto | null = null;
  reviewToDelete: ReviewDto | null = null;
  isEditMode = false;
  
  // Forms
  reviewForm: FormGroup;
  
  // Constants
  companyTypes = [
    { value: '', label: 'All Companies' },
    { value: 'hotel', label: 'Hotels' },
    { value: 'flight', label: 'Airlines' },
    { value: 'carrental', label: 'Car Rentals' },
    { value: 'tour', label: 'Tours' }
  ];
  
  ratings = [1, 2, 3, 4, 5];
  sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'rating_high', label: 'Highest Rating' },
    { value: 'rating_low', label: 'Lowest Rating' }
  ];

  constructor(
    private reviewService: ReviewService,
    private superAdminService: SuperadminServices,
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef // Added for manual change detection
  ) {
    this.reviewForm = this.formBuilder.group({
      companyType: ['', Validators.required],
      companyId: ['', Validators.required],
      rating: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.loadAllReviews();
  }

  ngAfterViewInit(): void {
    this.initializeBootstrapModals();
  }

  // ==================== MODAL OPERATIONS (Bootstrap Native) ====================
  
  private initializeBootstrapModals(): void {
    // Use setTimeout to avoid change detection issues
    setTimeout(() => {
      if (typeof (window as any).bootstrap !== 'undefined') {
        console.log('✅ Bootstrap is available for modals');
      } else {
        console.warn('⚠️ Bootstrap JS not loaded. Using fallback modal handling.');
      }
    }, 100);
  }

  private showModal(modalElement: ElementRef): void {
    if (modalElement && modalElement.nativeElement) {
      const modal = modalElement.nativeElement;
      
      if (typeof (window as any).bootstrap !== 'undefined') {
        const bsModal = new (window as any).bootstrap.Modal(modal);
        this.currentModal = bsModal;
        bsModal.show();
      } else {
        this.renderer.addClass(modal, 'show');
        this.renderer.setStyle(modal, 'display', 'block');
        this.renderer.addClass(document.body, 'modal-open');
        
        const backdrop = this.renderer.createElement('div');
        this.renderer.addClass(backdrop, 'modal-backdrop');
        this.renderer.addClass(backdrop, 'fade');
        this.renderer.addClass(backdrop, 'show');
        this.renderer.appendChild(document.body, backdrop);
      }
    }
  }

  private hideModal(): void {
    if (this.currentModal) {
      this.currentModal.hide();
      this.currentModal = null;
    } else {
      const modals = document.querySelectorAll('.modal.show');
      modals.forEach(modal => {
        this.renderer.removeClass(modal, 'show');
        this.renderer.setStyle(modal, 'display', 'none');
      });
      
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach(backdrop => backdrop.remove());
      
      this.renderer.removeClass(document.body, 'modal-open');
    }
  }

  openAddReviewModal(): void {
    this.isEditMode = false;
    this.editingReview = null;
    this.reviewForm.reset();
    
    // Use setTimeout to avoid change detection issues
    setTimeout(() => {
      if (this.reviewModal) {
        this.showModal(this.reviewModal);
      }
      this.cdr.detectChanges(); // Manual change detection
    }, 50);
  }

  openEditReviewModal(review: ReviewDto): void {
    this.isEditMode = true;
    this.editingReview = review;
    
    this.reviewForm.patchValue({
      companyType: review.companyType,
      companyId: this.getCompanyId(review),
      rating: review.rating,
      comment: review.comment || ''
    });
    
    this.selectedCompanyType = review.companyType;
    this.loadCompanies();
    
    // Use setTimeout to avoid change detection issues
    setTimeout(() => {
      if (this.reviewModal) {
        this.showModal(this.reviewModal);
      }
      this.cdr.detectChanges(); // Manual change detection
    }, 50);
  }

  openDeleteModal(review: ReviewDto): void {
    this.reviewToDelete = review;
    
    setTimeout(() => {
      if (this.deleteModal) {
        this.showModal(this.deleteModal);
      }
      this.cdr.detectChanges();
    }, 50);
  }

  openStatsModal(companyType?: string, companyId?: number): void {
    if (companyType && companyId) {
      this.loadReviewStats(companyType, companyId);
    } else if (this.selectedCompanyType && this.selectedCompanyId) {
      this.loadReviewStats(this.selectedCompanyType, this.selectedCompanyId);
    } else {
      this.reviewStats = null;
    }
    
    setTimeout(() => {
      if (this.statsModal) {
        this.showModal(this.statsModal);
      }
      this.cdr.detectChanges();
    }, 50);
  }

  closeModal(): void {
    this.hideModal();
    
    // Reset modal state
    this.editingReview = null;
    this.reviewToDelete = null;
    this.reviewStats = null;
    this.isSubmitting = false;
    
    this.cdr.detectChanges();
  }

  // ==================== DATA LOADING ====================
  
  loadAllReviews(): void {
    this.loading = true;
    this.cdr.detectChanges();
    
    this.reviewService.getAllReviews(this.currentPage, this.pageSize).subscribe({
      next: (response: ReviewsResponse) => {
        this.reviews = response.reviews;
        this.filteredReviews = [...this.reviews];
        this.totalReviews = response.totalCount;
        this.totalPages = Math.ceil(this.totalReviews / this.pageSize);
        this.loading = false;
        
        console.log('✅ All reviews loaded:', response);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error loading reviews:', error);
        this.toastr.error(error.userMessage || 'Failed to load reviews', 'Error');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadCompanies(): void {
    if (!this.selectedCompanyType) {
      console.warn('⚠️ No company type selected for loading companies');
      return;
    }
    
    if (this.companiesLoading) {
      console.log('⏳ Companies already loading...');
      return;
    }
    
    console.log(`🏢 Loading ${this.selectedCompanyType} companies...`);
    
    this.companiesLoading = true;
    this.companies = [];
    this.cdr.detectChanges();
    
    this.superAdminService.getCompaniesByType(this.selectedCompanyType).subscribe({
      next: (companies) => {
        console.log(`📋 Raw companies response for ${this.selectedCompanyType}:`, companies);
        
        if (Array.isArray(companies)) {
          this.companies = companies;
        } else if (companies && companies.data && Array.isArray(companies.data)) {
          this.companies = companies.data;
        } else if (companies && companies.companies && Array.isArray(companies.companies)) {
          this.companies = companies.companies;
        } else {
          console.warn('⚠️ Unexpected companies response format:', companies);
          this.companies = [];
        }
        
        console.log(`✅ ${this.selectedCompanyType} companies processed:`, this.companies);
        this.companiesLoading = false;
        
        if (this.companies.length === 0) {
          this.toastr.info(`No ${this.selectedCompanyType} companies found`, 'Info');
        }
        
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error loading companies:', error);
        this.toastr.error(`Failed to load ${this.selectedCompanyType} companies`, 'Error');
        this.companiesLoading = false;
        this.companies = [];
        this.cdr.detectChanges();
      }
    });
  }

  loadReviewStats(companyType: string, companyId?: number): void {
    this.statsLoading = true;
    this.cdr.detectChanges();
    
    this.reviewService.getCompanyReviewStats(companyType, companyId).subscribe({
      next: (stats) => {
        this.reviewStats = stats;
        this.statsLoading = false;
        console.log('✅ Review stats loaded:', stats);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error loading review stats:', error);
        this.toastr.error('Failed to load review statistics', 'Error');
        this.statsLoading = false;
        this.reviewStats = null;
        this.cdr.detectChanges();
      }
    });
  }

  // ==================== FILTERING & SEARCH - FIXED ====================
  
  applyFilters(): void {
    console.log('🔍 Applying filters:', {
      companyType: this.selectedCompanyType,
      companyId: this.selectedCompanyId,
      rating: this.selectedRating
    });

    this.currentPage = 1;
    
    if (this.selectedCompanyType && this.selectedCompanyId) {
      console.log('✅ Loading reviews for specific company');
      this.loadCompanyReviews();
    } else if (this.selectedCompanyType && !this.selectedCompanyId) {
      console.log('✅ Loading reviews for company type only');
      this.loadReviewsByType();
    } else {
      console.log('✅ Loading all reviews');
      this.loadAllReviews();
    }
  }

  loadCompanyReviews(): void {
    if (!this.selectedCompanyType) {
      console.error('❌ Company type is required');
      return;
    }
    
    if (!this.selectedCompanyId || this.selectedCompanyId <= 0) {
      console.error('❌ Valid company ID is required');
      return;
    }
    
    console.log(`🔍 Loading reviews for ${this.selectedCompanyType} company ID: ${this.selectedCompanyId}`);
    
    this.loading = true;
    this.cdr.detectChanges();
    
    this.reviewService.getCompanyReviews(
      this.selectedCompanyType,
      this.selectedCompanyId,
      this.currentPage,
      this.pageSize,
      this.sortBy
    ).subscribe({
      next: (response) => {
        console.log('✅ Company reviews loaded:', response);
        this.reviews = response.reviews;
        this.applyClientFilters();
        this.totalReviews = response.totalCount;
        this.totalPages = Math.ceil(this.totalReviews / this.pageSize);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error loading company reviews:', error);
        this.toastr.error('Failed to load company reviews', 'Error');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadReviewsByType(): void {
    if (!this.selectedCompanyType) {
      console.error('❌ Company type is required');
      return;
    }
    
    console.log(`🔍 Loading all reviews for company type: ${this.selectedCompanyType}`);
    
    this.loading = true;
    this.cdr.detectChanges();
    
    this.reviewService.getCompanyReviews(
      this.selectedCompanyType,
      undefined,
      this.currentPage,
      this.pageSize,
      this.sortBy
    ).subscribe({
      next: (response) => {
        console.log('✅ Reviews by type loaded:', response);
        this.reviews = response.reviews;
        this.applyClientFilters();
        this.totalReviews = response.totalCount;
        this.totalPages = Math.ceil(this.totalReviews / this.pageSize);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error loading reviews by type:', error);
        this.toastr.error(`Failed to load ${this.selectedCompanyType} reviews`, 'Error');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
  
  applyClientFilters(): void {
    let filtered = [...this.reviews];
    
    // Apply rating filter
    if (this.selectedRating) {
      filtered = filtered.filter(review => review.rating === this.selectedRating);
    }
    
    // Apply date filters
    if (this.startDate) {
      const start = new Date(this.startDate);
      filtered = filtered.filter(review => new Date(review.createdAt) >= start);
    }
    
    if (this.endDate) {
      const end = new Date(this.endDate);
      filtered = filtered.filter(review => new Date(review.createdAt) <= end);
    }
    
    // Apply search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(review =>
        (review.comment && review.comment.toLowerCase().includes(term)) ||
        (review.companyName && review.companyName.toLowerCase().includes(term)) ||
        (review.userName && review.userName.toLowerCase().includes(term)) ||
        (review.userEmail && review.userEmail.toLowerCase().includes(term))
      );
    }
    
    this.filteredReviews = filtered;
    this.cdr.detectChanges();
  }

  clearFilters(): void {
    this.selectedCompanyType = '';
    this.selectedCompanyId = null;
    this.selectedRating = null;
    this.searchTerm = '';
    this.startDate = '';
    this.endDate = '';
    this.sortBy = 'newest';
    this.currentPage = 1;
    
    this.companies = [];
    this.loadAllReviews();
  }

  onCompanyTypeChange(): void {
    console.log('🔄 Company type changed to:', this.selectedCompanyType);
    
    this.selectedCompanyId = null;
    this.companies = [];
    
    if (this.selectedCompanyType) {
      console.log('📋 Loading companies for type:', this.selectedCompanyType);
      this.loadCompanies();
      this.loadReviewsByType();
    } else {
      this.loadAllReviews();
    }
  }

  onCompanyChange(): void {
    console.log('🏢 Company changed to ID:', this.selectedCompanyId);
    
    if (this.selectedCompanyId && this.selectedCompanyType) {
      this.applyFilters();
    } else if (this.selectedCompanyType) {
      this.loadReviewsByType();
    } else {
      this.loadAllReviews();
    }
  }

  // ==================== PAGINATION ====================
  
  changePage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    
    this.currentPage = page;
    this.applyFilters();
  }

  changePageSize(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  // ==================== REVIEW OPERATIONS - FIXED ====================
  
  saveReview(): void {
    if (this.reviewForm.invalid) {
      this.markFormGroupTouched(this.reviewForm);
      return;
    }

    // Prevent double submission
    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.cdr.detectChanges();

    if (this.isEditMode && this.editingReview) {
      this.updateReview();
    } else {
      this.createReview();
    }
  }

  createReview(): void {
    const formValue = this.reviewForm.value;
    
    const createDto: CreateReviewDto = {
      companyType: formValue.companyType,
      rating: parseInt(formValue.rating),
      comment: formValue.comment
    };

    // Set the appropriate company ID based on backend API requirements
    switch (formValue.companyType.toLowerCase()) {
      case 'hotel':
        createDto.hotelCompanyId = parseInt(formValue.companyId);
        break;
      case 'flight':
        createDto.flightCompanyId = parseInt(formValue.companyId);
        break;
      case 'carrental':
        createDto.carRentalCompanyId = parseInt(formValue.companyId);
        break;
      case 'tour':
        createDto.tourCompanyId = parseInt(formValue.companyId);
        break;
    }

    this.reviewService.createReview(createDto).subscribe({
      next: (review) => {
        this.toastr.success('Review created successfully!', 'Success');
        this.isSubmitting = false;
        this.closeModal();
        this.applyFilters();
      },
      error: (error) => {
        console.error('❌ Error creating review:', error);
        this.toastr.error(error.userMessage || 'Failed to create review', 'Error');
        this.isSubmitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  // FIXED: Updated to not require authentication for SuperAdmin operations
  updateReview(): void {
    if (!this.editingReview) {
      this.isSubmitting = false;
      this.cdr.detectChanges();
      return;
    }

    const formValue = this.reviewForm.value;
    
    const updateDto: UpdateReviewDto = {
      rating: parseInt(formValue.rating),
      comment: formValue.comment
    };

    console.log('📝 Updating review as SuperAdmin:', this.editingReview.id, updateDto);

    this.reviewService.updateReview(this.editingReview.id, updateDto).subscribe({
      next: () => {
        this.toastr.success('Review updated successfully!', 'Success');
        this.isSubmitting = false;
        this.closeModal();
        this.applyFilters();
      },
      error: (error) => {
        console.error('❌ Error updating review:', error);
        
        // Better error handling for 404 errors
        if (error.status === 404) {
          this.toastr.error('Review not found. It may have been deleted by another user.', 'Error');
        } else {
          this.toastr.error(error.userMessage || 'Failed to update review', 'Error');
        }
        
        this.isSubmitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  confirmDeleteReview(): void {
    if (!this.reviewToDelete) return;

    if (this.isSubmitting) return;

    this.isSubmitting = true;
    this.cdr.detectChanges();

    console.log('🗑️ Deleting review as SuperAdmin:', this.reviewToDelete.id);

    this.reviewService.deleteReview(this.reviewToDelete.id).subscribe({
      next: () => {
        this.toastr.success('Review deleted successfully!', 'Success');
        this.isSubmitting = false;
        this.closeModal();
        this.applyFilters();
      },
      error: (error) => {
        console.error('❌ Error deleting review:', error);
        
        // Better error handling for 404 errors
        if (error.status === 404) {
          this.toastr.error('Review not found. It may have been deleted already.', 'Error');
        } else {
          this.toastr.error(error.userMessage || 'Failed to delete review', 'Error');
        }
        
        this.isSubmitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ==================== UTILITY METHODS ====================
  
  getCompanyId(review: ReviewDto): number {
    return review.hotelCompanyId || 
           review.flightCompanyId || 
           review.carRentalCompanyId || 
           review.tourCompanyId || 
           0;
  }

  getRatingStars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  getCompanyTypeLabel(type: string): string {
    const typeMap: { [key: string]: string } = {
      'hotel': 'Hotel',
      'flight': 'Flight',
      'carrental': 'Car Rental',
      'tour': 'Tour'
    };
    return typeMap[type.toLowerCase()] || type;
  }

  getRatingColor(rating: number): string {
    if (rating >= 4) return 'text-success';
    if (rating >= 3) return 'text-warning';
    return 'text-danger';
  }

  getTimeSince(date: Date): string {
    const now = new Date();
    const reviewDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - reviewDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  exportReviews(): void {
    if (this.filteredReviews.length === 0) {
      this.toastr.warning('No reviews to export', 'Warning');
      return;
    }

    const csvContent = this.convertToCSV(this.filteredReviews);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reviews-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    this.toastr.success('Reviews exported successfully!', 'Success');
  }

  private convertToCSV(reviews: ReviewDto[]): string {
    const headers = [
      'ID', 'Company Type', 'Company Name', 'Rating', 'Comment', 
      'User Name', 'User Email', 'Created At', 'Updated At'
    ];
    
    const rows = reviews.map(review => [
      review.id,
      this.getCompanyTypeLabel(review.companyType),
      review.companyName || 'N/A',
      review.rating,
      `"${(review.comment || '').replace(/"/g, '""')}"`,
      review.userName || 'N/A',
      review.userEmail || 'N/A',
      new Date(review.createdAt).toLocaleDateString(),
      review.updatedAt ? new Date(review.updatedAt).toLocaleDateString() : 'N/A'
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // ==================== TEMPLATE HELPER METHODS ====================
  
  onModalFormCompanyTypeChange(): void {
    this.selectedCompanyType = this.reviewForm.get('companyType')?.value || '';
    this.reviewForm.patchValue({ companyId: '' });
    this.loadCompanies();
  }

  // ==================== GETTERS FOR TEMPLATE ====================
  
  get isFormValid(): boolean {
    return this.reviewForm.valid;
  }

  get totalPagesArray(): number[] {
    return Array.from({length: this.totalPages}, (_, i) => i + 1);
  }

  get showingFrom(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingTo(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalReviews);
  }

  get paginationPages(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    
    if (this.totalPages <= maxPages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
      let endPage = Math.min(this.totalPages, startPage + maxPages - 1);
      
      if (endPage - startPage < maxPages - 1) {
        startPage = Math.max(1, endPage - maxPages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  // Form field getters for validation
  get companyType() { return this.reviewForm.get('companyType'); }
  get companyId() { return this.reviewForm.get('companyId'); }
  get rating() { return this.reviewForm.get('rating'); }
  get comment() { return this.reviewForm.get('comment'); }

  // ==================== ACCESSIBILITY & UX IMPROVEMENTS ====================
  
  trackByReviewId(index: number, review: ReviewDto): number {
    return review.id;
  }

  trackByCompanyId(index: number, company: any): number {
    return company.id;
  }

  onModalKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeModal();
    }
  }

  onBackdropClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (target && target.classList.contains('modal')) {
      this.closeModal();
    }
  }

  handleApiError(error: any, defaultMessage: string): string {
    if (error?.userMessage) {
      return error.userMessage;
    }
    
    if (error?.error?.message) {
      return error.error.message;
    }
    
    if (typeof error?.error === 'string') {
      return error.error;
    }
    
    return defaultMessage;
  }

  // Debounce search to avoid too many API calls
  private searchTimeout: any;
  
  onSearchChange(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    this.searchTimeout = setTimeout(() => {
      this.applyClientFilters();
    }, 500);
  }

  getCompanyName(selectedCompanyId: any): string {
    const company = this.companies.find(c => c.id === selectedCompanyId);
    return company ? company.name : 'Selected';
  }
  
  ngOnDestroy(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    this.hideModal();
  }
}