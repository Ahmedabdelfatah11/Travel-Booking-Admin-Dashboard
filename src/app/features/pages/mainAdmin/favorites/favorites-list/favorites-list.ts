import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject, takeUntil, catchError, of } from 'rxjs';
import { FavoriteItem, FavoritesService } from '../../../../../core/services/Favorite-service';

interface ToastNotification {
  message: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
}

@Component({
  selector: 'app-favorites-list',
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
  
  // Company types for filtering
  companyTypes = [
    { value: 'all', label: 'All types', icon: 'fas fa-th-large' },
    { value: 'hotel', label: 'Hotels', icon: 'fas fa-hotel' },
    { value: 'tour', label: 'Tours', icon: 'fas fa-map-marked-alt' }
  ];
  
  // Sort options
  sortOptions = [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'name', label: 'By name' },
    { value: 'type', label: 'By type' }
  ];
  
  // Bulk selection
  selectedItems: Set<number> = new Set();
  selectAll: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private favoritesService: FavoritesService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadFavorites();
    this.setupSubscriptions();
    this.cd.detectChanges();

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSubscriptions(): void {
    this.favoritesService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.loading = loading;
        this.cd.detectChanges();

      });

    this.favoritesService.favorites$
      .pipe(takeUntil(this.destroy$))
      .subscribe(favorites => {
        this.favorites = favorites;
        this.applyFiltersAndSort();
        this.cd.detectChanges();

      });
  }

  /**
   * Load favorites from API
   */
  loadFavorites(): void {
    this.error = '';
    this.favoritesService.getUserFavorites(this.currentPage, this.pageSize)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading favorites:', error);
          this.error = error.userMessage || 'Failed to load favorites';
          this.showToast('Failed to load favorites', 'error');
          this.cd.detectChanges();

          return of([]);
        })
      )
      .subscribe();
  }

  /**
   * Apply filters and sorting
   */
  applyFiltersAndSort(): void {
    let filtered = [...this.favorites];

    // Filter by company type
    if (this.selectedCompanyType && this.selectedCompanyType !== 'all') {
      filtered = filtered.filter(fav => 
        fav.companyType.toLowerCase() === this.selectedCompanyType.toLowerCase()
      );
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(fav =>
        fav.companyName?.toLowerCase().includes(searchLower) ||
        fav.companyLocation?.toLowerCase().includes(searchLower) ||
        fav.companyDescription?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    filtered = this.sortFavorites(filtered);

    this.filteredFavorites = filtered;
    this.totalItems = filtered.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
  }

  private sortFavorites(favorites: FavoriteItem[]): FavoriteItem[] {
    switch (this.sortBy) {
      case 'newest':
        return favorites.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'oldest':
        return favorites.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case 'name':
        return favorites.sort((a, b) => 
          (a.companyName || '').localeCompare(b.companyName || '')
        );
      case 'type':
        return favorites.sort((a, b) => 
          a.companyType.localeCompare(b.companyType)
        );
      default:
        return favorites;
    }
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
            console.error('Error removing favorite:', error);
            this.showToast(error.userMessage || 'Failed to remove item', 'error');
            return of(null);
          })
        )
        .subscribe(result => {
          if (result !== null) {
            this.showToast('Item removed from favorites successfully', 'success');
            this.selectedItems.delete(favoriteId);
            this.cd.detectChanges();

          }
        });
    }
  }

  /**
   * Bulk delete selected items
   */
  removeSelectedItems(): void {
    if (this.selectedItems.size === 0) {
      this.showToast('No items selected', 'info');
      return;
    }

    if (confirm(`Are you sure you want to remove ${this.selectedItems.size} items from favorites?`)) {
      const deletePromises: any[] = [];
      
      this.selectedItems.forEach(id => {
        const deletePromise = this.favoritesService.removeFromFavorites(id)
          .pipe(catchError(error => of({ error: true, id })))
          .toPromise();
        deletePromises.push(deletePromise);
      });

      Promise.all(deletePromises).then(results => {
        const errors = results.filter((r: any) => r?.error);
        const successful = results.length - errors.length;
        
        if (successful > 0) {
          this.showToast(`${successful} items removed from favorites`, 'success');
        }
        if (errors.length > 0) {
          this.showToast(`Failed to remove ${errors.length} items`, 'error');
        }
        
        this.selectedItems.clear();
        this.selectAll = false;
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
    this.applyFiltersAndSort();
    this.cd.detectChanges();

  }

  onSearch(): void {
    this.currentPage = 1;
    this.selectedItems.clear();
    this.selectAll = false;
    this.applyFiltersAndSort();
    this.cd.detectChanges();

  }

  clearSearch(): void {
    this.searchTerm = '';
    this.onSearch();
  }

  getCompanyTypeIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'hotel':
        return 'fas fa-hotel';
      case 'tour':
        return 'fas fa-map-marked-alt';
      case 'flight':
        return 'fas fa-plane';
      case 'carrental':
        return 'fas fa-car';
      default:
        return 'fas fa-building';
    }
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
        return 'Car rental';
      default:
        return type;
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
    this.cd.detectChanges();

  }

// In your favorites-list.component.ts
viewCompanyDetails(favorite: FavoriteItem): void {
  console.log('Navigating to company details:', favorite);
  
  switch (favorite.companyType.toLowerCase()) {
    case 'hotel':
      if (favorite.hotelCompanyId) {
        // Use navigateByUrl for absolute navigation
       /// this.router.navigateByUrl(`hotel/${favorite.hotelCompanyId}`);
        // Or use navigate with relative: false (default)
        this.router.navigate(['/hotel', favorite.hotelCompanyId]);
      } else {
        console.warn('Hotel company ID is missing');
        this.showToast('Unable to navigate: Hotel ID is missing', 'error');
      }
      break;
      
    case 'tour':
      if (favorite.tourId) {
        //this.router.navigateByUrl(`tour/${favorite.tourId}`);
         this.router.navigate(['/tour', favorite.tourId]);
      } else {
        console.warn('Tour ID is missing');
        this.showToast('Unable to navigate: Tour ID is missing', 'error');
      }
      break;
      
    default:
      console.warn('Unknown company type:', favorite.companyType);
      this.showToast('Unknown company type', 'error');
  }
}

  isSelected(favoriteId: number): boolean {
    return this.selectedItems.has(favoriteId);
  }

  get displayItems(): FavoriteItem[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredFavorites.slice(startIndex, startIndex + this.pageSize);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.selectedItems.clear();
      this.selectAll = false;
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
}
