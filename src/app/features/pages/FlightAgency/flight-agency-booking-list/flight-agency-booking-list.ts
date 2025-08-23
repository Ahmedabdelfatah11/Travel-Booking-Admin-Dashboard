import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Status, SeatClass, BookingType, BookingService, BookingDto } from '../../../../core/services/booking-services';
import { FlightService } from '../../../../core/services/flight-service';
import { Auth } from '../../../../core/services/auth'; // Import Auth service
import { firstValueFrom } from 'rxjs';
import { FlightBooking } from '../../../../shared/Interfaces/iflight';

export interface BookingFilters {
  status: string;
  seatClass: string;
  departureAirport: string;
  arrivalAirport: string;
  dateFrom: string;
  dateTo: string;
  priceMin: number | null;
  priceMax: number | null;
  customerEmail: string;
}

@Component({
  selector: 'app-flight-agency-booking-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './flight-agency-booking-list.html',
  styleUrl: './flight-agency-booking-list.css'
})
export class FlightAgencyBookingList implements OnInit {
  bookings: FlightBooking[] = [];
  filteredBookings: FlightBooking[] = [];
  loading = false;
  error: string | null = null;
  searchQuery: string = '';
  flightCompanyId: number | null = null; // Add company ID tracking

  // Filter properties
  filters: BookingFilters = {
    status: '',
    seatClass: '',
    departureAirport: '',
    arrivalAirport: '',
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

  seatClassOptions = [
    { value: '', label: 'All Classes' },
    { value: SeatClass.Economy.toString(), label: 'Economy' },
    { value: SeatClass.Business.toString(), label: 'Business' },
    { value: SeatClass.FirstClass.toString(), label: 'First Class' }
  ];

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;

  // Sorting
  sortBy: keyof FlightBooking = 'id';
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
    // Get FlightCompanyId from user roles/token
    this.flightCompanyId = this.getFlightCompanyIdFromToken();
    
    if (!this.flightCompanyId) {
      this.error = 'Flight company information not found. Please contact support.';
      return;
    }

    await this.loadBookings();
  }

  private getFlightCompanyIdFromToken(): number | null {
    // This method extracts FlightCompanyId from the JWT token
    // You'll need to decode the JWT token to get the FlightCompanyId claim
    const token = this.authService.getToken();
    if (!token) return null;

    try {
      // Decode JWT token payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      const flightCompanyId = payload['FlightCompanyId'];
      return flightCompanyId ? parseInt(flightCompanyId) : null;
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

      // Filter for flight bookings only
      const flightBookings = allBookings
        ?.filter(b => b.bookingType === BookingType.Flight)
        .map((booking: BookingDto) => ({
          id: booking.id,
          customerEmail: booking.customerEmail,
          status: this.bookingService.mapStatus(booking.status),
          price: booking.totalPrice ?? 0,
          departureTime: booking.agencyDetails?.departureTime ?? booking.startDate,
          arrivalTime: booking.agencyDetails?.arrivalTime ?? booking.endDate,
          departureAirport: booking.agencyDetails?.departureAirport ?? '',
          arrivalAirport: booking.agencyDetails?.arrivalAirport ?? '',
          flightId: booking.agencyDetails?.flightId ?? 0,
          seatClass: booking.agencyDetails?.seatClass ?? SeatClass.Economy,
          startDate: booking.startDate,
          endDate: booking.endDate,
          bookingType: booking.bookingType,
          totalPrice: booking.totalPrice ?? 0,
          paymentStatus: booking.paymentStatus,
          agencyDetails: booking.agencyDetails
        })) || [];

      // Filter bookings by flightCompanyId
      // This requires the agencyDetails to include flightCompanyId
      this.bookings = flightBookings.filter(booking => 
        booking.agencyDetails?.flightCompanyId === this.flightCompanyId
      );

      console.log(`Filtered bookings for company ${this.flightCompanyId}:`, this.bookings);
      this.applyFilters();
    } catch (error) {
      console.error('Error loading bookings:', error);
      this.error = 'Failed to load flight bookings. Please try again.';
    } finally {
      this.loading = false;
      this.cd.detectChanges(); 
    }
  }

  // Rest of your methods remain the same...
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
      console.log(`Filtering by status: ${statusValue}, found: ${filtered.length} bookings`);
    }

    // Seat class filter
    if (this.filters.seatClass !== '') {
      const seatClassValue = parseInt(this.filters.seatClass);
      filtered = filtered.filter(b => b.seatClass === seatClassValue);
    }

    // Other filters...
    if (this.filters.departureAirport?.trim()) {
      const airport = this.filters.departureAirport.toLowerCase().trim();
      filtered = filtered.filter(b =>
        b.departureAirport?.toLowerCase().includes(airport)
      );
    }

    if (this.filters.arrivalAirport?.trim()) {
      const airport = this.filters.arrivalAirport.toLowerCase().trim();
      filtered = filtered.filter(b =>
        b.arrivalAirport?.toLowerCase().includes(airport)
      );
    }

    if (this.filters.dateFrom) {
      const fromDate = new Date(this.filters.dateFrom);
      filtered = filtered.filter(b => new Date(b.departureTime) >= fromDate);
    }

    if (this.filters.dateTo) {
      const toDate = new Date(this.filters.dateTo);
      filtered = filtered.filter(b => new Date(b.departureTime) <= toDate);
    }

    if (this.filters.priceMin !== null && this.filters.priceMin > 0) {
      filtered = filtered.filter(b => b.totalPrice >= this.filters.priceMin!);
    }

    if (this.filters.priceMax !== null && this.filters.priceMax > 0) {
      filtered = filtered.filter(b => b.totalPrice <= this.filters.priceMax!);
    }

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

  get paginatedBookings(): FlightBooking[] {
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
      seatClass: '',
      departureAirport: '',
      arrivalAirport: '',
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

  sort(column: keyof FlightBooking): void {
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  getSortIcon(column: keyof FlightBooking): string {
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

  getSeatClassBadge(seatClass: SeatClass): string {
    switch (seatClass) {
      case SeatClass.Economy: return 'seat-economy';
      case SeatClass.Business: return 'seat-business';
      case SeatClass.FirstClass: return 'seat-first';
      default: return 'seat-default';
    }
  }

  getSeatClassLabel(seatClass: SeatClass): string {
    switch (seatClass) {
      case SeatClass.Economy: return 'Economy';
      case SeatClass.Business: return 'Business';
      case SeatClass.FirstClass: return 'First Class';
      default: return 'Unknown';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatPrice(price: number): string {
    if (price == null || price === 0) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  // Action methods
  canConfirmBooking(booking: FlightBooking): boolean {
    return booking.status === Status.Pending;
  }

  canCancelBooking(booking: FlightBooking): boolean {
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

  // Helper method to get status statistics for this company only
  getStatusStats() {
    const pending = this.bookings.filter(b => b.status === Status.Pending).length;
    const confirmed = this.bookings.filter(b => b.status === Status.Confirmed).length;
    const cancelled = this.bookings.filter(b => b.status === Status.Cancelled).length;

    return { pending, confirmed, cancelled };
  }
}