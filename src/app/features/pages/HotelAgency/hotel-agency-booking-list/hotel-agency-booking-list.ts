import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Status, BookingType, BookingService, BookingDto } from '../../../../core/services/booking-services';
import { Auth } from '../../../../core/services/auth';
import { firstValueFrom } from 'rxjs';
import { RoomBooking, RoomBookingFilters } from '../../../../shared/Interfaces/ihotel';





@Component({
  selector: 'app-hotel-agency-booking-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hotel-agency-booking-list.html',
  styleUrl: './hotel-agency-booking-list.css'
})
export class HotelAgencyBookingList implements OnInit {
  bookings: RoomBooking[] = [];
  filteredBookings: RoomBooking[] = [];
  loading = false;
  error: string | null = null;
  searchQuery: string = '';
  hotelCompanyId: number | null = null;

  // Filter properties
  filters: RoomBookingFilters = {
    status: '',
    roomType: '',
    hotelName: '',
    dateFrom: '',
    dateTo: '',
    priceMin: null,
    priceMax: null,
    customerEmail: ''
  };

  // Filter options
  statusOptions = [
    { value: '', label: 'All Status' },
    { value: Status.Pending.toString(), label: 'Pending' },
    { value: Status.Confirmed.toString(), label: 'Confirmed' },
    { value: Status.Cancelled.toString(), label: 'Cancelled' }
  ];

  roomTypeOptions = [
    { value: '', label: 'All Room Types' },
    { value: 'Single', label: 'Single' },
    { value: 'Double', label: 'Double' },
    { value: 'Suite', label: 'Suite' }
  ];

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;

  // Sorting
  sortBy: keyof RoomBooking = 'id';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Status enum reference for template
  Status = Status;

  constructor(
    private bookingService: BookingService,
    private authService: Auth,
    private cd: ChangeDetectorRef
  ) { }

  async ngOnInit() {
    await this.initializeComponent();
  }

  private async initializeComponent(): Promise<void> {
    // Get HotelCompanyId from user roles/token
    this.hotelCompanyId = this.getHotelCompanyIdFromToken();
    
    if (!this.hotelCompanyId) {
      this.error = 'Hotel company information not found. Please contact support.';
      return;
    }

    await this.loadBookings();
  }

  private getHotelCompanyIdFromToken(): number | null {
    const token = this.authService.getToken();
    if (!token) return null;

    try {
      // Decode JWT token payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      const hotelCompanyId = payload['HotelCompanyId'];
      return hotelCompanyId ? parseInt(hotelCompanyId) : null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
  
  async loadBookings(): Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      // Get all bookings first
      const allBookings = await firstValueFrom(this.bookingService.getAllBookings());
      console.log('All bookings from API:', allBookings);

      // Filter for room bookings only
      const roomBookings = allBookings
        ?.filter(b => b.bookingType === BookingType.Room)
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

      // Filter bookings by hotelCompanyId
      this.bookings = roomBookings.filter(booking => 
        booking.agencyDetails?.hotelCompanyId === this.hotelCompanyId
      );

      console.log(`Filtered bookings for hotel company ${this.hotelCompanyId}:`, this.bookings);
      this.applyFilters();
    } catch (error) {
      console.error('Error loading bookings:', error);
      this.error = 'Failed to load room bookings. Please try again.';
    } finally {
      this.loading = false;
      this.cd.detectChanges(); 
    }
  }

  applyFilters(): void {
    if (!this.bookings) {
      this.filteredBookings = [];
      this.calculatePagination();
      return;
    }

    let filtered = [...this.bookings];

    // Status filter
    if (this.filters.status !== '') {
      const statusValue = parseInt(this.filters.status);
      filtered = filtered.filter(b => b.status === statusValue);
    }

    // Room type filter
    if (this.filters.roomType !== '') {
      filtered = filtered.filter(b => 
        b.roomType?.toLowerCase() === this.filters.roomType.toLowerCase()
      );
    }

    // Hotel name filter
    if (this.filters.hotelName?.trim()) {
      const hotelName = this.filters.hotelName.toLowerCase().trim();
      filtered = filtered.filter(b =>
        b.hotelName?.toLowerCase().includes(hotelName)
      );
    }

    // Date filters
    if (this.filters.dateFrom) {
      const fromDate = new Date(this.filters.dateFrom);
      filtered = filtered.filter(b => new Date(b.checkInDate) >= fromDate);
    }

    if (this.filters.dateTo) {
      const toDate = new Date(this.filters.dateTo);
      filtered = filtered.filter(b => new Date(b.checkInDate) <= toDate);
    }

    // Price filters
    if (this.filters.priceMin !== null && this.filters.priceMin > 0) {
      filtered = filtered.filter(b => b.totalPrice >= this.filters.priceMin!);
    }

    if (this.filters.priceMax !== null && this.filters.priceMax > 0) {
      filtered = filtered.filter(b => b.totalPrice <= this.filters.priceMax!);
    }

    // Customer email filter
    if (this.filters.customerEmail?.trim()) {
      const email = this.filters.customerEmail.toLowerCase().trim();
      filtered = filtered.filter(b =>
        b.customerEmail?.toLowerCase().includes(email)
      );
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

    console.log('Applied filters - Total:', this.bookings.length, 'Filtered:', this.filteredBookings.length);
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

  onFilterChange(): void {
    console.log('Filter changed:', this.filters);
    this.currentPage = 1;
    this.applyFilters();
  }

  getMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  clearFilters(): void {
    this.filters = {
      status: '',
      roomType: '',
      hotelName: '',
      dateFrom: '',
      dateTo: '',
      priceMin: null,
      priceMax: null,
      customerEmail: ''
    };
    this.searchQuery = '';
    this.currentPage = 1;
    this.applyFilters();
    console.log('Filters cleared');
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

  getSortIcon(column: keyof RoomBooking): string {
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

    if (this.totalPages <= 10) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, this.currentPage - 4);
      const end = Math.min(this.totalPages, start + 9);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  // Status and formatting methods
  getStatusClass(status: Status): string {
    return this.bookingService.getStatusClass(status);
  }

  getStatusLabel(status: Status): string {
    return this.bookingService.getStatusLabel(status);
  }

  getStatusIcon(status: Status): string {
    switch (status) {
      case Status.Pending: return '⏳';
      case Status.Confirmed: return '✅';
      case Status.Cancelled: return '❌';
      default: return '❓';
    }
  }

  getRoomTypeBadge(roomType: string): string {
    switch (roomType?.toLowerCase()) {
      case 'single': return 'room-single';
      case 'double': return 'room-double';
      case 'suite': return 'room-suite';
      default: return 'room-default';
    }
  }

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

  // Action methods
  canConfirmBooking(booking: RoomBooking): boolean {
    return booking.status === Status.Pending;
  }

  canCancelBooking(booking: RoomBooking): boolean {
    return booking.status === Status.Confirmed;
  }

  async confirmBooking(bookingId: number): Promise<void> {
    try {
      console.log(`Confirming booking ${bookingId}`);
      await firstValueFrom(this.bookingService.confirmBooking(bookingId));
      console.log(`Booking ${bookingId} confirmed successfully`);
      await this.loadBookings();
    } catch (error) {
      console.error('Error confirming booking:', error);
      this.error = 'Failed to confirm booking. Please try again.';
    }
  }

  async cancelBooking(bookingId: number): Promise<void> {
    if (confirm('Are you sure you want to cancel this booking?')) {
      try {
        console.log(`Canceling booking ${bookingId}`);
        await firstValueFrom(this.bookingService.cancelBooking(bookingId));
        console.log(`Booking ${bookingId} canceled successfully`);
        await this.loadBookings();
      } catch (error) {
        console.error('Error canceling booking:', error);
        this.error = 'Failed to cancel booking. Please try again.';
      }
    }
  }

  async deleteBooking(bookingId: number): Promise<void> {
    if (confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      try {
        console.log(`Deleting booking ${bookingId}`);
        await firstValueFrom(this.bookingService.deleteBooking(bookingId));
        console.log(`Booking ${bookingId} deleted successfully`);
        await this.loadBookings();
      } catch (error) {
        console.error('Error deleting booking:', error);
        this.error = 'Failed to delete booking. Please try again.';
      }
    }
  }

  // Helper method to get status statistics for this hotel company only
  getStatusStats() {
    const pending = this.bookings.filter(b => b.status === Status.Pending).length;
    const confirmed = this.bookings.filter(b => b.status === Status.Confirmed).length;
    const cancelled = this.bookings.filter(b => b.status === Status.Cancelled).length;

    return { pending, confirmed, cancelled };
  }
}