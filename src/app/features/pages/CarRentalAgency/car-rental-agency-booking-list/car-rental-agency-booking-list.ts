import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingDto, BookingService, Status, BookingType } from '../../../../core/services/booking-services';
import { CarRentalService } from '../../../../core/services/CarRental-Services';
import { RouterModule } from '@angular/router';

// Toast interface
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
}

@Component({
  selector: 'app-car-rental-agency-booking-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './car-rental-agency-booking-list.html',
  styleUrls: ['./car-rental-agency-booking-list.css']
})
export class CarRentalAgencyBookingList implements OnInit {
  bookings: BookingDto[] = [];
  filteredBookings: BookingDto[] = [];
  loading = false;
  error = '';
  windowRef = window;

  // Filter properties
  statusFilter = '';
  searchTerm = '';
  dateFilter = '';

  // Statistics
  stats = {
    totalBookings: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    totalRevenue: 0
  };

  // Toasts
  private toastId = 0;
  toasts: Toast[] = [];

  // Enums for template
  Status = Status;
  BookingType = BookingType;

  constructor(
    private bookingService: BookingService,
    private carRentalService: CarRentalService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  // === Load Bookings with Minimum 1-Second Loading ===
  loadBookings(): void {
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges(); // Force UI update

    const startTime = Date.now();

    const token = localStorage.getItem('authToken');
    if (!token) {
      this.showToast('Authentication token not found. Please login again.', 'error');
      this.finishLoading(startTime);
      return;
    }

    const userCompanyId = this.getUserCompanyId();
    if (!userCompanyId) {
      this.showToast('CarRentalCompanyId not found in token.', 'error');
      this.finishLoading(startTime);
      return;
    }

    this.fallbackToAllBookings(userCompanyId, startTime);
  }

  private fallbackToAllBookings(userCompanyId: number, startTime: number): void {
    this.bookingService.getAllBookings().subscribe({
      next: (allBookings) => {
        const carBookings = allBookings.filter(booking => {
          const isCarBooking = booking.bookingType === BookingType.Car;
          const hasAgencyDetails = booking.agencyDetails && booking.agencyDetails.rentalCompanyId;
          const isMyCompany = hasAgencyDetails && booking.agencyDetails.rentalCompanyId === userCompanyId;
          return isCarBooking && isMyCompany;
        });

        this.processBookings(carBookings);
        this.finishLoading(startTime);
      },
      error: (err) => {
        this.handleError(err);
        this.finishLoading(startTime);
      }
    });
  }

  private processBookings(bookings: BookingDto[]): void {
    this.bookings = bookings;
    this.filteredBookings = [...bookings];
    this.calculateStats();
  }

  // === Enforce Minimum 1-Second Loading ===
  private finishLoading(startTime: number): void {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(1000 - elapsed, 0);

    setTimeout(() => {
      this.loading = false;
      this.cdr.detectChanges();
    }, remaining);
  }

  // === Error Handling with Toasts ===
  private handleError(err: any): void {
    let message = '';
    if (err.status === 401) {
      message = 'Authentication failed. Please login again.';
    } else if (err.status === 403) {
      message = 'Access denied. You may not have CarRentalAdmin permissions.';
    } else if (err.status === 404) {
      message = 'API endpoint not found. Please check the server configuration.';
    } else if (err.status === 0) {
      message = 'Cannot connect to server. Please check your internet connection.';
    } else {
      message = `Failed to load bookings: ${err.status} - ${err.message || 'Unknown error'}`;
    }

    this.showToast(message, 'error');
  }

  private getUserCompanyId(): number | null {
    const token = localStorage.getItem('authToken');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const companyId = payload.CarRentalCompanyId ? parseInt(payload.CarRentalCompanyId) : null;
      return companyId;
    } catch (e) {
      return null;
    }
  }

  calculateStats(): void {
    this.stats.totalBookings = this.bookings.length;
    this.stats.confirmedBookings = this.bookings.filter(b =>
      this.bookingService.mapStatus(b.status) === Status.Confirmed
    ).length;
    this.stats.pendingBookings = this.bookings.filter(b =>
      this.bookingService.mapStatus(b.status) === Status.Pending
    ).length;
    this.stats.totalRevenue = this.bookings
      .filter(b => this.bookingService.mapStatus(b.status) === Status.Confirmed)
      .reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
  }

  applyFilters(): void {
    this.filteredBookings = this.bookings.filter(booking => {
      const matchesStatus = !this.statusFilter ||
        this.bookingService.mapStatus(booking.status).toString() === this.statusFilter;

      const matchesSearch = !this.searchTerm ||
        booking.customerEmail.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (booking.agencyDetails?.model || '').toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesDate = !this.dateFilter ||
        new Date(booking.startDate).toDateString() === new Date(this.dateFilter).toDateString();

      return matchesStatus && matchesSearch && matchesDate;
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.statusFilter = '';
    this.searchTerm = '';
    this.dateFilter = '';
    this.filteredBookings = [...this.bookings];
  }

  confirmBooking(bookingId: number): void {
    this.bookingService.confirmBooking(bookingId).subscribe({
      next: () => {
        this.showToast('Booking confirmed successfully!', 'success');
        this.loadBookings();
      },
      error: (err) => {
        this.showToast('Failed to confirm booking. Please try again.', 'error');
      }
    });
  }

  cancelBooking(bookingId: number): void {
    this.bookingService.cancelBooking(bookingId).subscribe({
      next: () => {
        this.showToast('Booking cancelled successfully!', 'success');
        this.loadBookings();
      },
      error: (err) => {
        this.showToast('Failed to cancel booking. Please try again.', 'error');
      }
    });
  }

  // === Toast Management ===
  showToast(message: string, type: 'success' | 'error' | 'info'): void {
    const id = ++this.toastId;
    this.toasts.push({ id, message, type, visible: true });

    this.cdr.detectChanges(); // Ensure toast appears

    setTimeout(() => {
      this.hideToast(id);
    }, 5000);
  }

  hideToast(id: number): void {
    const toast = this.toasts.find(t => t.id === id);
    if (toast) {
      toast.visible = false;
      setTimeout(() => {
        this.toasts = this.toasts.filter(t => t.id !== id);
        this.cdr.detectChanges();
      }, 300); // Match fade-out animation
    }
  }

  // === UI Helpers ===
  getStatusBadgeClass(status: string): string {
    const mappedStatus = this.bookingService.mapStatus(status);
    return this.bookingService.getStatusClass(mappedStatus);
  }

  getStatusLabel(status: string): string {
    const mappedStatus = this.bookingService.mapStatus(status);
    return this.bookingService.getStatusLabel(mappedStatus);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  canConfirm(booking: BookingDto): boolean {
    return this.bookingService.mapStatus(booking.status) === Status.Pending;
  }

  canCancel(booking: BookingDto): boolean {
    const status = this.bookingService.mapStatus(booking.status);
    return status === Status.Confirmed || status === Status.Pending;
  }

  exportBookings(): void {
    const csvData = this.filteredBookings.map(booking => ({
      'Booking ID': booking.id,
      'Customer Email': booking.customerEmail,
      'Car Model': booking.agencyDetails?.model || 'N/A',
      'Start Date': this.formatDate(booking.startDate),
      'End Date': this.formatDate(booking.endDate),
      'Total Price': booking.totalPrice || 0,
      'Status': this.getStatusLabel(booking.status)
    }));

    const csv = this.convertToCSV(csvData);
    this.downloadCSV(csv, 'car-rental-bookings.csv');
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvArray = [headers.join(',')];

    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      });
      csvArray.push(values.join(','));
    });

    return csvArray.join('\n');
  }

  private downloadCSV(csv: string, filename: string): void {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  trackByBookingId(index: number, booking: BookingDto): number {
    return booking.id;
  }
}