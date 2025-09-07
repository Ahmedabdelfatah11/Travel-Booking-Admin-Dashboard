import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject, takeUntil, catchError, of, switchMap, debounceTime, distinctUntilChanged } from 'rxjs';
import { FavoriteItem, FavoritesService, FavoritesStats } from '../../../../../core/services/Favorite-service';

interface ToastNotification {
  message: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
}

interface UserFilter {
  id: string;
  name: string;
  email: string;
}

interface UserDetails {
  id: string;
  name: string;
  email: string;
  phone?: string;
  registrationDate?: string;
  lastLoginDate?: string;
  favoritesCount?: number;
  bookingsCount?: number;
  reviewsCount?: number;
  status?: 'Active' | 'Inactive' | 'Suspended';
}

@Component({
  selector: 'app-superadmin-favorites-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './favorites-list.html',
  styleUrls: ['./favorites-list.css']
})
export class FavoritesListComponent implements OnInit, OnDestroy {
  // Component State
  favorites: FavoriteItem[] = [];
  filteredFavorites: FavoriteItem[] = [];
  loading: boolean = false;
  error: string = '';
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 12;
  totalItems: number = 0;
  totalPages: number = 0;
  
  // Filtering and Search
  selectedCompanyType: string = 'all';
  selectedUserId: string = '';
  searchTerm: string = '';
  sortBy: string = 'newest';
  
  // Toast notification
  toast: ToastNotification = {
    message: '',
    type: 'success',
    show: false
  };
  
  // View mode
  viewMode: 'grid' | 'list' = 'grid';
  
  // SuperAdmin specific
  isSuperAdmin: boolean = false;
  favoritesStats: FavoritesStats | null = null;
  availableUsers: UserFilter[] = [];
  showUserFilter: boolean = false;
  
  // User Modal
  selectedUserDetails: UserDetails | null = null;
  showUserModal: boolean = false;
  userModalLoading: boolean = false;
  
  // Company types for filtering
  companyTypes = [
    { value: 'all', label: 'All Types', icon: 'fas fa-th-large', color: 'primary' },
    { value: 'hotel', label: 'Hotels', icon: 'fas fa-hotel', color: 'info' },
    { value: 'tour', label: 'Tours', icon: 'fas fa-map-marked-alt', color: 'success' },
    { value: 'flight', label: 'Flights', icon: 'fas fa-plane', color: 'warning' },
    { value: 'carrental', label: 'Car Rentals', icon: 'fas fa-car', color: 'danger' }
  ];
  
  // Sort options
  sortOptions = [
    { value: 'newest', label: 'Newest First', icon: 'fas fa-sort-amount-down' },
    { value: 'oldest', label: 'Oldest First', icon: 'fas fa-sort-amount-up' },
    { value: 'user', label: 'By User Name', icon: 'fas fa-user' },
    { value: 'type', label: 'By Company Type', icon: 'fas fa-building' },
    { value: 'name', label: 'By Company Name', icon: 'fas fa-sort-alpha-down' }
  ];
  
  // Bulk selection
  selectedItems: Set<number> = new Set();
  selectAll: boolean = false;

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private favoritesService: FavoritesService,
    private router: Router,
    public cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isSuperAdmin = this.favoritesService.isSuperAdmin();
    
    if (!this.isSuperAdmin) {
      this.router.navigate(['/favorites']);
      return;
    }

    this.setupSearchDebounce();
    this.loadFavorites();
    this.loadStats();
    this.cd.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.currentPage = 1;
      this.loadFavorites();
    });
  }

  /**
   * Load favorites from API (SuperAdmin version)
   */
  loadFavorites(): void {
    this.error = '';
    this.loading = true;

    this.favoritesService.getAllUsersFavorites(
      this.currentPage,
      this.pageSize,
      this.selectedUserId || undefined,
      this.selectedCompanyType === 'all' ? undefined : this.selectedCompanyType,
      this.searchTerm || undefined
    )
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          this.error = error.userMessage || 'Failed to load favorites';
          this.showToast('Failed to load favorites', 'error');
          this.loading = false;
          this.cd.detectChanges();
          return of({ favorites: [], totalCount: 0, page: 1, pageSize: this.pageSize });
        })
      )
      .subscribe(response => {
        this.favorites = response.favorites;
        this.filteredFavorites = [...this.favorites];
        this.totalItems = response.totalCount;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        this.extractUsersFromFavorites();
        this.loading = false;
        this.cd.detectChanges();
      });
  }

  /**
   * Load statistics for SuperAdmin dashboard
   */
  loadStats(): void {
    this.favoritesService.getFavoritesStats()
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          return of(null);
        })
      )
      .subscribe(stats => {
        this.favoritesStats = stats;
        this.cd.detectChanges();
      });
  }

  /**
   * Extract unique users from favorites for filtering
   */
  private extractUsersFromFavorites(): void {
    const userMap = new Map<string, UserFilter>();
    
    this.favorites.forEach(fav => {
      if (!userMap.has(fav.userId)) {
        userMap.set(fav.userId, {
          id: fav.userId,
          name: fav.userName || 'Unknown User',
          email: fav.userEmail || ''
        });
      }
    });

    this.availableUsers = Array.from(userMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Load user details for modal
   */
  async loadUserDetails(userId: string): Promise<void> {
    this.userModalLoading = true;
    this.selectedUserDetails = null;
    
    // Simulate API call to get user details
    // In real implementation, you would call a service method
    setTimeout(() => {
      const user = this.availableUsers.find(u => u.id === userId);
      if (user) {
        this.selectedUserDetails = {
          id: user.id,
          name: user.name,
          email: user.email,
          favoritesCount: this.favorites.filter(f => f.userId === userId).length,
        };
      }
      this.userModalLoading = false;
      this.cd.detectChanges();
    }, 500);
  }

  /**
   * Remove item from favorites
   */
  removeFavorite(favoriteId: number, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (confirm('Are you sure you want to remove this item from favorites?')) {
      this.favoritesService.removeFromFavorites(favoriteId)
        .pipe(
          takeUntil(this.destroy$),
          catchError(error => {
            this.showToast(error.userMessage || 'Failed to remove item', 'error');
            return of(null);
          })
        )
        .subscribe(result => {
          if (result !== null) {
            this.showToast('Item removed from favorites successfully', 'success');
            this.selectedItems.delete(favoriteId);
            this.loadFavorites(); // Reload to get updated data
            this.loadStats(); // Update stats
          }
        });
    }
  }

  /**
   * Bulk delete selected items (SuperAdmin only)
   */
  removeSelectedItems(): void {
    if (this.selectedItems.size === 0) {
      this.showToast('No items selected', 'info');
      return;
    }

    if (confirm(`Are you sure you want to remove ${this.selectedItems.size} items from favorites?`)) {
      const selectedIds = Array.from(this.selectedItems);
      
      this.favoritesService.bulkRemoveFavorites(selectedIds)
        .pipe(
          takeUntil(this.destroy$),
          catchError(error => {
            this.showToast(error.userMessage || 'Failed to remove items', 'error');
            return of(null);
          })
        )
        .subscribe(result => {
          if (result) {
            this.showToast(`${result.deletedCount} items removed successfully`, 'success');
            this.selectedItems.clear();
            this.selectAll = false;
            this.loadFavorites(); // Reload to get updated data
            this.loadStats(); // Update stats
          }
        });
    }
  }

  /**
   * Toggle item selection
   */
  toggleSelection(favoriteId: number): void {
    if (this.selectedItems.has(favoriteId)) {
      this.selectedItems.delete(favoriteId);
    } else {
      this.selectedItems.add(favoriteId);
    }
    this.updateSelectAllState();
  }

  /**
   * Toggle select all
   */
  toggleSelectAll(): void {
    if (this.selectAll) {
      this.selectedItems.clear();
    } else {
      this.filteredFavorites.forEach(fav => this.selectedItems.add(fav.id));
    }
    this.selectAll = !this.selectAll;
  }

  private updateSelectAllState(): void {
    this.selectAll = this.filteredFavorites.length > 0 && 
      this.filteredFavorites.every(fav => this.selectedItems.has(fav.id));
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.selectedItems.clear();
    this.selectAll = false;
    this.loadFavorites();
  }

  onSearch(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.onSearch('');
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCompanyType = 'all';
    this.selectedUserId = '';
    this.currentPage = 1;
    this.selectedItems.clear();
    this.selectAll = false;
    this.loadFavorites();
  }

  getCompanyTypeIcon(type: string): string {
    const companyType = this.companyTypes.find(t => t.value === type.toLowerCase());
    return companyType ? companyType.icon : 'fas fa-building';
  }

  getCompanyTypeColor(type: string): string {
    const companyType = this.companyTypes.find(t => t.value === type.toLowerCase());
    return companyType ? companyType.color : 'secondary';
  }

  getCompanyTypeLabel(type: string): string {
    switch (type.toLowerCase()) {
      case 'hotel':
        return 'Hotel';
      case 'tour':
        return 'Tour';
      case 'flight':
        return 'Flight';
      case 'carrental':
        return 'Car Rental';
      default:
        return type;
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  showToast(message: string, type: 'success' | 'error' | 'info'): void {
    this.toast = { message, type, show: true };
    setTimeout(() => {
      this.toast.show = false;
    }, 4000);
  }

  hideToast(): void {
    this.toast.show = false;
  }

  refresh(): void {
    this.selectedItems.clear();
    this.selectAll = false;
    this.loadFavorites();
    this.loadStats();
  }

  viewCompanyDetails(favorite: FavoriteItem): void {
    
    switch (favorite.companyType.toLowerCase()) {
      case 'hotel':
        if (favorite.hotelCompanyId) {
          this.router.navigate(['/admin/hotel', favorite.hotelCompanyId]);
        } else {
          this.showToast('Unable to navigate: Hotel ID is missing', 'error');
        }
        break;
        
      case 'tour':
        if (favorite.tourId) {
          this.router.navigate(['/admin/tour', favorite.tourId]);
        } else {
          this.showToast('Unable to navigate: Tour ID is missing', 'error');
        }
        break;
        
      default:
        this.showToast('Unknown company type', 'error');
    }
  }

  async viewUserDetails(userId: string): Promise<void> {
    this.showUserModal = true;
    await this.loadUserDetails(userId);
  }

  closeUserModal(): void {
    this.showUserModal = false;
    this.selectedUserDetails = null;
  }

  isSelected(favoriteId: number): boolean {
    return this.selectedItems.has(favoriteId);
  }

  get displayItems(): FavoriteItem[] {
    return this.filteredFavorites;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.selectedItems.clear();
      this.selectAll = false;
      this.loadFavorites();
    }
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  // Stats helper methods
  getTotalFavoritesByType(type: string): number {
    if (!this.favoritesStats) return 0;
    return this.favoritesStats.companyTypeStats.find(s => s.companyType === type)?.count || 0;
  }

  getTopUsers(limit: number = 5): Array<{ userId: string; count: number }> {
    if (!this.favoritesStats) return [];
    return this.favoritesStats.userStats.slice(0, limit);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Active':
        return 'bg-success';
      case 'Inactive':
        return 'bg-warning';
      case 'Suspended':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }
}