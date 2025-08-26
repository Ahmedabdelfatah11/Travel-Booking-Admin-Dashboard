import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Status, BookingType, BookingService, BookingDto } from '../../../../core/services/booking-services';
import { Auth } from '../../../../core/services/auth';
import { firstValueFrom } from 'rxjs';
import { RoomBooking } from '../../../../shared/Interfaces/ihotel';

@Component({
  selector: 'app-hotel-agency-booking-pending',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hotel-agency-booking-pending.html',
  styleUrl: './hotel-agency-booking-pending.css'
})
export class HotelAgencyBookingPending implements OnInit {
  pendingBookings: RoomBooking[] = [];
  filteredBookings: RoomBooking[] = [];
  loading = false;
  error: string | null = null;
  hotelCompanyId: number | null = null;
  searchQuery: string = '';
  processingBookingId: number | null = null;

  // Pagination
  currentPage = 1;
  itemsPerPage = 12;
  totalPages = 0;

  // Sorting
  sortBy: keyof RoomBooking = 'checkInDate';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Filter options
  urgencyFilter: 'all' | 'urgent' | 'today' | 'week' = 'all';
  priceRangeFilter: 'all' | 'low' | 'medium' | 'high' = 'all';

  constructor(
    private bookingService: BookingService,
    private authService: Auth,
    private cd: ChangeDetectorRef
  ) { }

  async ngOnInit() {
    await this.initializeComponent();
  }

  private async initializeComponent(): Promise<void> {
    this.hotelCompanyId = this.getHotelCompanyIdFromToken();

    if (!this.hotelCompanyId) {
      this.error = 'Hotel company information not found. Please contact support.';
      return;
    }

    await this.loadPendingBookings();
  }

  private getHotelCompanyIdFromToken(): number | null {
    const token = this.authService.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const hotelCompanyId = payload['HotelCompanyId'];
      return hotelCompanyId ? parseInt(hotelCompanyId) : null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  async loadPendingBookings(): Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      const allBookings = await firstValueFrom(this.bookingService.getAllBookings());

      // Filter for pending room bookings only
      const roomBookings = allBookings
        ?.filter(b =>
          b.bookingType === BookingType.Room &&
          this.bookingService.mapStatus(b.status) === Status.Pending
        )
        .map((booking: BookingDto) => ({
          id: booking.id,
          customerEmail: booking.customerEmail,
          status: this.bookingService.mapStatus(booking.status),
          price: booking.totalPrice ?? 0,
          checkInDate: booking.startDate,
          checkOutDate: booking.endDate,
          roomType: booking.agencyDetails?.roomType ?? 'Unknown',
          hotelName: booking.agencyDetails?.hotelCompanyName ?? 'Unknown',
          roomId: booking.agencyDetails?.id ?? 0,
          startDate: booking.startDate,
          endDate: booking.endDate,
          bookingType: booking.bookingType,
          totalPrice: booking.totalPrice ?? 0,
          paymentStatus: booking.paymentStatus,
          agencyDetails: booking.agencyDetails
        })) || [];

      // Filter by hotel company
      this.pendingBookings = roomBookings.filter(booking =>
        booking.agencyDetails?.hotelCompanyId === this.hotelCompanyId
      );

      this.applyFilters();
    } catch (error) {
      console.error('Error loading pending bookings:', error);
      this.error = 'Failed to load pending bookings. Please try again.';
    } finally {
      this.loading = false;
      this.cd.detectChanges();
    }
  }

  applyFilters(): void {
    if (!this.pendingBookings) {
      this.filteredBookings = [];
      this.calculatePagination();
      return;
    }

    let filtered = [...this.pendingBookings];

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(b =>
        b.customerEmail?.toLowerCase().includes(query) ||
        b.roomType?.toLowerCase().includes(query) ||
        b.hotelName?.toLowerCase().includes(query) ||
        b.id.toString().includes(query)
      );
    }

    // Urgency filter
    const today = new Date();
    const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    switch (this.urgencyFilter) {
      case 'urgent':
        filtered = filtered.filter(b => this.getUrgencyLevel(b) === 'urgent');
        break;
      case 'today':
        filtered = filtered.filter(b => {
          const checkIn = new Date(b.checkInDate);
          return checkIn.toDateString() === today.toDateString();
        });
        break;
      case 'week':
        filtered = filtered.filter(b => {
          const checkIn = new Date(b.checkInDate);
          return checkIn <= oneWeekFromNow;
        });
        break;
    }

    // Price range filter
    switch (this.priceRangeFilter) {
      case 'low':
        filtered = filtered.filter(b => b.totalPrice <= 200);
        break;
      case 'medium':
        filtered = filtered.filter(b => b.totalPrice > 200 && b.totalPrice <= 500);
        break;
      case 'high':
        filtered = filtered.filter(b => b.totalPrice > 500);
        break;
    }

    // Apply sorting
    if (this.sortBy) {
      filtered.sort((a, b) => {
        const aValue = (a as any)[this.sortBy];
        const bValue = (b as any)[this.sortBy];

        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        else if (aValue > bValue) comparison = 1;

        return this.sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    this.filteredBookings = filtered;
    this.calculatePagination();
  }
  getMin(a: number, b: number): number {
    return Math.min(a, b);
  }
  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredBookings.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }
  }

  get paginatedBookings(): RoomBooking[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredBookings.slice(startIndex, endIndex);
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  sort(column: keyof RoomBooking): void {
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  get pageNumbers(): number[] {
    const pages = [];
    const maxVisible = 5;

    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, this.currentPage - 2);
      const end = Math.min(this.totalPages, start + maxVisible - 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  // Utility methods
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatPrice(price: number): string {
    if (price == null || price === 0) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  calculateNights(checkIn: string, checkOut: string): number {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getUrgencyLevel(booking: RoomBooking): 'urgent' | 'moderate' | 'normal' {
    const checkInDate = new Date(booking.checkInDate);
    const today = new Date();
    const diffDays = Math.ceil((checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return 'urgent';
    if (diffDays <= 3) return 'moderate';
    return 'normal';
  }

  getDaysUntilCheckIn(booking: RoomBooking): number {
    const checkInDate = new Date(booking.checkInDate);
    const today = new Date();
    return Math.ceil((checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  getUrgencyStats() {
    const urgent = this.pendingBookings.filter(b => this.getUrgencyLevel(b) === 'urgent').length;
    const moderate = this.pendingBookings.filter(b => this.getUrgencyLevel(b) === 'moderate').length;
    const normal = this.pendingBookings.filter(b => this.getUrgencyLevel(b) === 'normal').length;

    return {
      total: this.pendingBookings.length,
      urgent,
      moderate,
      normal
    };
  }

  // Action methods
  // async confirmBooking(bookingId: number): Promise<void> {
  //   this.processingBookingId = bookingId;

  //   try {
  //     console.log(`Confirming booking ${bookingId}`);
  //     await firstValueFrom(this.bookingService.confirmBooking(bookingId));
  //     console.log(`Booking ${bookingId} confirmed successfully`);
  //     await this.loadPendingBookings();
  //   } catch (error) {
  //     console.error('Error confirming booking:', error);
  //     this.error = 'Failed to confirm booking. Please try again.';
  //   } finally {
  //     this.processingBookingId = null;
  //   }
  // }

  async cancelBooking(bookingId: number): Promise<void> {
    if (confirm('Are you sure you want to cancel this booking request?')) {
      this.processingBookingId = bookingId;

      try {
        console.log(`Canceling booking ${bookingId}`);
        await firstValueFrom(this.bookingService.cancelBooking(bookingId));
        console.log(`Booking ${bookingId} canceled successfully`);
        await this.loadPendingBookings();
      } catch (error) {
        console.error('Error canceling booking:', error);
        this.error = 'Failed to cancel booking. Please try again.';
      } finally {
        this.processingBookingId = null;
      }
    }
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.urgencyFilter = 'all';
    this.priceRangeFilter = 'all';
    this.currentPage = 1;
    this.applyFilters();
  }
}