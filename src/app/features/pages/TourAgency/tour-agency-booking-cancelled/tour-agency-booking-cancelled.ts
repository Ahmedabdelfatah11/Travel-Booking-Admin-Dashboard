import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TourBookingService } from '../../../../core/services/tour-booking-service';
import { TourService } from '../../../../core/services/tour-service';
import { BookingTourDto, TourReadDto } from '../../../../shared/Interfaces/i-tour';

type SortableColumn = 'id' | 'startDate' | 'endDate' | 'totalPrice';

@Component({
  selector: 'app-tour-agency-booking-cancelled',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tour-agency-booking-cancelled.html',
  styleUrls: ['./tour-agency-booking-cancelled.css']
})
export class TourAgencyBookingCancelled implements OnInit {
  bookings: BookingTourDto[] = [];
  cancelledBookings: BookingTourDto[] = [];
  loading = false;
  error: string | null = null;
  tourCompanyId: number | null = null;

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
    this.loadTourCompanyIdAndCancelledBookings();
  }

  private loadTourCompanyIdAndCancelledBookings(): void {
    this.tourService.getMyTourCompanies().subscribe({
      next: (companies) => {
        if (Array.isArray(companies) && companies.length > 0) {
          this.tourCompanyId = companies[0].id;
          this.loadCancelledBookings();
        } else {
          this.error = 'No tour company assigned to your account.';
        }
      },
      error: (err) => {
        this.error = 'Failed to load company. Please try again.';
      }
    });
  }

  public loadCancelledBookings(): void {
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
        this.cancelledBookings = this.bookings.filter(b => this.getDisplayStatus(b) === 'Cancelled');
        this.applySorting();
      },
      error: (err) => {
        this.error = 'Failed to load bookings. Please try again.';
      },
      complete: () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(1000 - elapsed, 0);

        setTimeout(() => {
          this.loading = false;
          this.cd.detectChanges();
        }, remaining);
      }
    });
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

  applySorting(): void {
    this.cancelledBookings.sort((a, b) => {
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
    this.totalPages = Math.ceil(this.cancelledBookings.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }
  }

  get paginatedBookings(): BookingTourDto[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.cancelledBookings.slice(start, start + this.itemsPerPage);
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
    return 'bg-danger text-white';
  }

  getStatusIcon(): string {
    return '❌';
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

  getMin(a: number, b: number): number {
    return Math.min(a, b);
  }
}