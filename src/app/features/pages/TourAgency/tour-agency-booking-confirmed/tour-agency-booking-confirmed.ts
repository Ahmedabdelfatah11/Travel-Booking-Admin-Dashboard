import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TourBookingService } from '../../../../core/services/tour-booking-service';
import { TourService } from '../../../../core/services/tour-service';
import { BookingTourDto, TourReadDto } from '../../../../shared/Interfaces/i-tour';

// Define sortable keys
type SortableColumn = 'id' | 'startDate' | 'endDate' | 'totalPrice';

@Component({
  selector: 'app-tour-agency-booking-confirmed',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tour-agency-booking-confirmed.html',
  styleUrls: ['./tour-agency-booking-confirmed.css']
})
export class TourAgencyBookingConfirmed implements OnInit {
  bookings: BookingTourDto[] = [];
  confirmedBookings: BookingTourDto[] = [];
  loading = false;
  error: string | null = null;
  tourCompanyId: number | null = null;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;

  // Sorting
  sortBy: SortableColumn = 'id';
  sortDirection: 'asc' | 'desc' = 'desc';

  constructor(
    private bookingService: TourBookingService,
    private tourService: TourService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadTourCompanyIdAndConfirmedBookings();
  }

  public loadTourCompanyIdAndConfirmedBookings(): void {
    this.tourService.getMyTourCompanies().subscribe({
      next: (companies) => {
        if (Array.isArray(companies) && companies.length > 0) {
          this.tourCompanyId = companies[0].id;
          this.loadConfirmedBookings();
        } else {
          this.error = 'No tour company assigned to your account.';
        }
      },
      error: (err) => {
        console.error('Failed to load tour companies:', err);
        this.error = 'Failed to load company. Please try again.';
      }
    });
  }

    getMin(a: number, b: number): number {
    return Math.min(a, b);
  }
  public loadConfirmedBookings(): void {
    if (!this.tourCompanyId) {
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = null;

    this.bookingService.getBookingsByCompany(this.tourCompanyId).subscribe({
      next: (bookings) => {
        this.bookings = Array.isArray(bookings) ? bookings : [];
        this.confirmedBookings = this.bookings.filter(b => this.getDisplayStatus(b) === 'Confirmed');
        this.applySorting();
      },
      error: (err) => {
        console.error('Failed to load bookings:', err);
        this.error = 'Failed to load bookings. Please try again.';
      },
      complete: () => {
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  // ✅ Reuse your existing logic
  getDisplayStatus(booking: BookingTourDto): string {
    const paymentStatus = booking.paymentStatus?.trim().toLowerCase() || '';

    if (paymentStatus === 'succeeded') return 'Confirmed';
    if (paymentStatus === 'pending') return 'Pending';
    if (['failed', 'cancelled'].includes(paymentStatus)) return 'Cancelled';

    if (booking.status === 'Confirmed') return 'Confirmed';
    if (booking.status === 'Cancelled') return 'Cancelled';

    return 'Payment Not Initiated';
  }

  applySorting(): void {
    this.confirmedBookings.sort((a, b) => {
      const aValue = (a as any)[this.sortBy];
      const bValue = (b as any)[this.sortBy];
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      else if (aValue > bValue) comparison = 1;
      return this.sortDirection === 'desc' ? -comparison : comparison;
    });

    this.calculatePagination();
  }

  sort(column: SortableColumn): void {
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDirection = 'asc';
    }
    this.applySorting();
  }

  getSortIcon(column: SortableColumn): string {
    if (this.sortBy !== column) return '↕️';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.confirmedBookings.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }
  }

  get paginatedBookings(): BookingTourDto[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.confirmedBookings.slice(start, start + this.itemsPerPage);
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

  // Helper methods
  getTourName(booking: BookingTourDto): string {
    return (booking.agencyDetails as TourReadDto)?.name || 'Unknown Tour';
  }

  getTourDestination(booking: BookingTourDto): string {
    return (booking.agencyDetails as TourReadDto)?.destination || 'N/A';
  }

  getStatusBadgeClass(): string {
    return 'bg-success text-white'; // Only confirmed
  }

  getStatusIcon(): string {
    return '✅';
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

  openTourDetails(booking: BookingTourDto): void {
    console.log('View tour details:', booking);
  }
}