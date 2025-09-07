import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Status, BookingType, BookingService, BookingDto } from '../../../../core/services/booking-services';
import { Auth } from '../../../../core/services/auth';
import { firstValueFrom } from 'rxjs';
import { RoomBooking } from '../../../../shared/Interfaces/ihotel';

@Component({
  selector: 'app-hotel-agency-booking-confirm',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hotel-agency-booking-confirm.html',
  styleUrl: './hotel-agency-booking-confirm.css'
})
export class HotelAgencyBookingConfirm implements OnInit {
  confirmedBookings: RoomBooking[] = [];
  filteredBookings: RoomBooking[] = [];
  loading = false;
  error: string | null = null;
  hotelCompanyId: number | null = null;
  searchQuery: string = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 8;
  totalPages = 0;

  // Sorting
  sortBy: keyof RoomBooking = 'checkInDate';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Date filter for confirmed bookings
  dateFilter: 'all' | 'upcoming' | 'current' | 'past' = 'all';

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

    await this.loadConfirmedBookings();
  }

  private getHotelCompanyIdFromToken(): number | null {
    const token = this.authService.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const hotelCompanyId = payload['HotelCompanyId'];
      return hotelCompanyId ? parseInt(hotelCompanyId) : null;
    } catch (error) {
      return null;
    }
  }
  
  async loadConfirmedBookings(): Promise<void> {
    this.loading = true;
    this.error = null;
    this.cd.detectChanges(); // Force UI update

    const startTime = Date.now();

    try {
      const allBookings = await firstValueFrom(this.bookingService.getAllBookings());
      
      // Filter for confirmed room bookings only
      const roomBookings = allBookings
        ?.filter(b => 
          b.bookingType === BookingType.Room && 
          this.bookingService.mapStatus(b.status) === Status.Confirmed
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
      this.confirmedBookings = roomBookings.filter(booking => 
        booking.agencyDetails?.hotelCompanyId === this.hotelCompanyId
      );

      this.applyFilters();
    } catch (error) {
      this.error = 'Failed to load confirmed bookings. Please try again.';
    } finally {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(1000 - elapsed, 0);

      setTimeout(() => {
        this.loading = false;
        this.cd.detectChanges();
      }, remaining);
    }
  }

  applyFilters(): void {
    if (!this.confirmedBookings) {
      this.filteredBookings = [];
      this.calculatePagination();
      return;
    }

    let filtered = [...this.confirmedBookings];

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

    // Date filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (this.dateFilter) {
      case 'upcoming':
        filtered = filtered.filter(b => new Date(b.checkInDate) > today);
        break;
      case 'current':
        filtered = filtered.filter(b => {
          const checkIn = new Date(b.checkInDate);
          const checkOut = new Date(b.checkOutDate);
          return checkIn <= today && checkOut >= today;
        });
        break;
      case 'past':
        filtered = filtered.filter(b => new Date(b.checkOutDate) < today);
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

  onDateFilterChange(): void {
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

  getBookingStatus(booking: RoomBooking): 'upcoming' | 'current' | 'completed' {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkIn = new Date(booking.checkInDate);
    const checkOut = new Date(booking.checkOutDate);

    if (checkIn > today) return 'upcoming';
    if (checkIn <= today && checkOut >= today) return 'current';
    return 'completed';
  }

  getStatusStats() {
    const upcoming = this.confirmedBookings.filter(b => this.getBookingStatus(b) === 'upcoming').length;
    const current = this.confirmedBookings.filter(b => this.getBookingStatus(b) === 'current').length;
    const completed = this.confirmedBookings.filter(b => this.getBookingStatus(b) === 'completed').length;
    
    return { 
      total: this.confirmedBookings.length,
      upcoming,
      current,
      completed
    };
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.dateFilter = 'all';
    this.currentPage = 1;
    this.applyFilters();
  }

  getMaxBookingIndex(): number {
    const endIndex = this.currentPage * this.itemsPerPage;
    return endIndex > this.filteredBookings.length ? this.filteredBookings.length : endIndex;
  }
}