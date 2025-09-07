import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TourBookingService } from '../../../../core/services/tour-booking-service';
import { TourService } from '../../../../core/services/tour-service';
import { BookingTourDto, TourReadDto } from '../../../../shared/Interfaces/i-tour';

export interface BookingFilters {
  status: string;
  tourName: string;
  destination: string;
  dateFrom: string;
  dateTo: string;
  priceMin: number | null;
  priceMax: number | null;
  customerEmail: string;
}

type SortableColumn = 'id' | 'startDate' | 'endDate' | 'totalPrice' | 'paymentStatus';

@Component({
  selector: 'app-tour-agency-booking-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tour-agency-booking-list.html',
  styleUrls: ['./tour-agency-booking-list.css']
})
export class TourAgencyBookingList implements OnInit {
  bookings: BookingTourDto[] = [];
  filteredBookings: BookingTourDto[] = [];
  loading = false;
  error: string | null = null;
  tourCompanyId: number | null = null;

  filters: BookingFilters = {
    status: '',
    tourName: '',
    destination: '',
    dateFrom: '',
    dateTo: '',
    priceMin: null,
    priceMax: null,
    customerEmail: ''
  };

  statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'Succeeded', label: 'Paid' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Cancelled', label: 'Cancelled' },
    { value: 'Failed', label: 'Failed' },
    { value: 'NotInitiated', label: 'Payment Not Initiated' }
  ];

  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;

  sortBy: SortableColumn = 'id';
  sortDirection: 'asc' | 'desc' = 'desc';

  constructor(
    private bookingService: TourBookingService,
    private tourService: TourService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadTourCompanyIdAndBookings();
  }

 private loadTourCompanyIdAndBookings(): void {
  this.tourCompanyId = this.getTourCompanyIdFromToken();

  if (!this.tourCompanyId) {
    this.error = 'Tour company information not found in your account.';
    this.loading = false;
    this.cd.detectChanges();
    return;
  }

  this.loadBookings();
}

  public loadBookings(): void {
    if (!this.tourCompanyId) {
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = null;
    this.cd.detectChanges(); // Force UI update

    const startTime = Date.now();

    this.bookingService.getBookingsByCompany(this.tourCompanyId).subscribe({
      next: (bookings) => {
        this.bookings = Array.isArray(bookings) ? bookings : [];
        this.applyFilters();
      },
      error: (err) => {
        this.handleError(err, 'Failed to load bookings. Please try again.');
      },
      complete: () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(1000 - elapsed, 0); // Minimum 1 second

        setTimeout(() => {
          this.loading = false;
          this.cd.detectChanges();
        }, remaining);
      }
    });
  }

  private handleError(err: any, fallbackMessage: string): void {
    let message = fallbackMessage;

    if (err.status === 401) {
      message = 'Authentication failed. Please log in.';
    } else if (err.status === 403) {
      message = 'Access denied. You are not authorized for this company.';
    } else if (err.status === 404) {
      message = 'Company or bookings not found.';
    }

    this.error = message;
    this.loading = false;
    this.cd.detectChanges();
  }

  getDisplayStatus(booking: BookingTourDto): string {
    const paymentStatus = booking.paymentStatus?.trim().toLowerCase() || '';

    if (paymentStatus === 'succeeded') return 'Confirmed';
    if (paymentStatus === 'pending') return 'Pending';
    if (['failed', 'cancelled'].includes(paymentStatus)) return 'Cancelled';
    if (booking.status === 'Confirmed') return 'Confirmed';
    if (booking.status === 'Cancelled') return 'Cancelled';
    return 'Payment Not Initiated';
  }

  applyFilters(): void {
    let filtered = [...this.bookings];

    if (this.filters.status) {
      filtered = filtered.filter(b => {
        const displayStatus = this.getDisplayStatus(b);
        if (this.filters.status === 'NotInitiated') return displayStatus === 'Payment Not Initiated';
        if (this.filters.status === 'Succeeded') return displayStatus === 'Confirmed';
        const paymentStatus = b.paymentStatus?.toLowerCase();
        const filterStatus = this.filters.status.toLowerCase();
        return paymentStatus === filterStatus;
      });
    }

    if (this.filters.tourName.trim()) {
      const name = this.filters.tourName.toLowerCase().trim();
      filtered = filtered.filter(b => this.getTourName(b).toLowerCase().includes(name));
    }

    if (this.filters.destination.trim()) {
      const dest = this.filters.destination.toLowerCase().trim();
      filtered = filtered.filter(b => this.getTourDestination(b).toLowerCase().includes(dest));
    }

    if (this.filters.dateFrom) {
      const fromDate = new Date(this.filters.dateFrom);
      filtered = filtered.filter(b => new Date(b.startDate) >= fromDate);
    }

    if (this.filters.dateTo) {
      const toDate = new Date(this.filters.dateTo);
      filtered = filtered.filter(b => new Date(b.endDate) <= toDate);
    }

    if (this.filters.priceMin !== null && this.filters.priceMin > 0) {
      filtered = filtered.filter(b => (b.totalPrice || 0) >= this.filters.priceMin!);
    }

    if (this.filters.priceMax !== null && this.filters.priceMax > 0) {
      filtered = filtered.filter(b => (b.totalPrice || 0) <= this.filters.priceMax!);
    }

    if (this.filters.customerEmail.trim()) {
      const email = this.filters.customerEmail.toLowerCase().trim();
      filtered = filtered.filter(b => b.customerEmail?.toLowerCase().includes(email));
    }

    filtered.sort((a, b) => {
      const aValue = (a as any)[this.sortBy];
      const bValue = (b as any)[this.sortBy];
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      else if (aValue > bValue) comparison = 1;
      return this.sortDirection === 'desc' ? -comparison : comparison;
    });

    this.filteredBookings = filtered;
    this.calculatePagination();
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredBookings.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }
  }

  get paginatedBookings(): BookingTourDto[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredBookings.slice(startIndex, endIndex);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  getPaymentStatusClass(status: string | null | undefined): string {
    return status ? 'payment-' + status.toLowerCase() : 'payment-unknown';
  }

  getMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  clearFilters(): void {
    this.filters = {
      status: '',
      tourName: '',
      destination: '',
      dateFrom: '',
      dateTo: '',
      priceMin: null,
      priceMax: null,
      customerEmail: ''
    };
    this.currentPage = 1;
    this.applyFilters();
  }

  sort(column: SortableColumn): void {
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  getSortIcon(column: SortableColumn): string {
    if (this.sortBy !== column) return '↕️';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  get pageNumbers(): number[] {
    const pages = [];
    const start = Math.max(1, this.currentPage - 4);
    const end = Math.min(this.totalPages, start + 9);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  getTourName(booking: BookingTourDto): string {
    return (booking.agencyDetails as TourReadDto)?.name || 'Unknown Tour';
  }

  getTourDestination(booking: BookingTourDto): string {
    return (booking.agencyDetails as TourReadDto)?.destination || 'N/A';
  }

  getStatusBadgeClass(status: string | null | undefined): string {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'confirmed' || statusLower === 'paid' || statusLower === 'succeeded') return 'bg-success text-white';
    if (statusLower === 'pending') return 'bg-warning text-dark';
    if (statusLower === 'cancelled' || statusLower === 'failed') return 'bg-danger text-white';
    if (statusLower === 'payment not initiated') return 'bg-secondary text-white';
    return 'bg-secondary text-white';
  }

  getStatusText(status: string | null | undefined): string {
    switch (status?.toLowerCase()) {
      case 'confirmed': case 'paid': case 'succeeded': return 'Confirmed';
      case 'pending': return 'Pending';
      case 'cancelled': return 'Cancelled';
      default: return 'Pending';
    }
  }

  getStatusIcon(status: string | null | undefined): string {
    switch (status?.toLowerCase()) {
      case 'succeeded': case 'paid': case 'confirmed': return '✅';
      case 'pending': return '⏳';
      case 'cancelled': case 'failed': return '❌';
      case 'payment not initiated': return '🔘';
      default: return '⏳';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatPrice(amount: number | null | undefined): string {
    if (amount == null) return 'E£ 0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2
    }).format(amount);
  }

  getStatusStats() {
    const confirmed = this.bookings.filter(b => this.getDisplayStatus(b) === 'Confirmed').length;
    const paymentPending = this.bookings.filter(b => this.getDisplayStatus(b) === 'Pending').length;
    const notInitiated = this.bookings.filter(b => this.getDisplayStatus(b) === 'Payment Not Initiated').length;
    const cancelled = this.bookings.filter(b => this.getDisplayStatus(b) === 'Cancelled').length;
    return { confirmed, paymentPending, notInitiated, cancelled };
  }

  getStatList() {
    const stats = this.getStatusStats();
    return [
      { label: 'Payment Pending', value: stats.paymentPending, class: 'pending' },
      { label: 'Not Initiated', value: stats.notInitiated, class: '' },
      { label: 'Confirmed', value: stats.confirmed, class: 'confirmed' },
      { label: 'Cancelled', value: stats.cancelled, class: 'cancelled' }
    ];
  }
  private getTourCompanyIdFromToken(): number | null {
  const token = localStorage.getItem('authToken');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const tourCompanyId = payload['TourCompanyId'];
    return tourCompanyId ? parseInt(tourCompanyId, 10) : null;
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
}
}