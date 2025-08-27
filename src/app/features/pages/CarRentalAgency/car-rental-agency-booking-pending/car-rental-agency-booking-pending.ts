import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CarRentalService, DashboardStats } from '../../../../core/services/CarRental-Services';
import { BookingDto, BookingService, Status, BookingType } from '../../../../core/services/booking-services';
import { CarService } from '../../../../core/services/Car-Services';

// Toast interface
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  visible: boolean;
}

@Component({
  selector: 'app-car-rental-agency-booking-pending',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './car-rental-agency-booking-pending.html',
  styleUrls: ['./car-rental-agency-booking-pending.css']
})
export class CarRentalAgencyBookingPending implements OnInit {
  pendingBookings: BookingDto[] = [];
  filteredBookings: BookingDto[] = [];
  loading = false;
  error = '';
  processingBookingId: number | null = null;

  // Filter properties
  searchTerm = '';
  dateFilter = '';
  sortBy = 'priority';
  priorityFilter = 'all';

  // Statistics
  stats = {
    totalPending: 0,
    urgentBookings: 0,
    potentialRevenue: 0,
    averageWaitTime: 0
  };

  // Toasts
  private toastId = 0;
  toasts: Toast[] = [];

  constructor(
    private bookingService: BookingService,
    private carRentalService: CarRentalService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPendingBookings();
  }

  loadPendingBookings(): void {
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges(); // Force UI update

    const startTime = Date.now();

    const userCompanyId = this.getUserCompanyId();
    if (!userCompanyId) {
      this.showToast('CarRentalCompanyId not found in token.', 'error');
      this.finishLoading(startTime);
      return;
    }

    this.bookingService.getAllBookings().subscribe({
      next: (allBookings) => {
        const pendingCarBookings = allBookings.filter(booking => {
          const isCarBooking = booking.bookingType === BookingType.Car;
          const isPending = this.bookingService.mapStatus(booking.status) === Status.Pending;
          const isMyCompany = booking.agencyDetails?.rentalCompanyId === userCompanyId;

          return isCarBooking && isPending && isMyCompany;
        });

        this.pendingBookings = pendingCarBookings;
        this.filteredBookings = [...pendingCarBookings];
        this.calculateStats();
        this.applySorting();
        this.finishLoading(startTime);
      },
      error: (err) => {
        this.handleError(err);
        this.finishLoading(startTime);
      }
    });
  }

  private finishLoading(startTime: number): void {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(1000 - elapsed, 0);

    setTimeout(() => {
      this.loading = false;
      this.cdr.detectChanges();
    }, remaining);
  }

  private getUserCompanyId(): number | null {
    const token = localStorage.getItem('authToken');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.CarRentalCompanyId ? parseInt(payload.CarRentalCompanyId) : null;
    } catch (e) {
      return null;
    }
  }

  private handleError(err: any): void {
    let message = '';
    if (err.status === 401) {
      message = 'Authentication failed. Please login again.';
    } else if (err.status === 403) {
      message = 'Access denied. You may not have CarRentalAdmin permissions.';
    } else {
      message = `Failed to load pending bookings: ${err.status} - ${err.message || 'Unknown error'}`;
    }
    this.showToast(message, 'error');
  }

  calculateStats(): void {
    this.stats.totalPending = this.pendingBookings.length;
    this.stats.potentialRevenue = this.pendingBookings.reduce((sum, booking) => 
      sum + (booking.totalPrice || 0), 0
    );

    const now = new Date();
    const urgentThreshold = 24 * 60 * 60 * 1000; // 24 hours

    this.stats.urgentBookings = this.pendingBookings.filter(booking => {
      const startDate = new Date(booking.startDate);
      return (startDate.getTime() - now.getTime()) <= urgentThreshold;
    }).length;

    const totalWaitTime = this.pendingBookings.reduce((sum, booking) => {
      const startDate = new Date(booking.startDate);
      const diffHours = Math.max(0, (startDate.getTime() - now.getTime()) / (1000 * 60 * 60));
      return sum + diffHours;
    }, 0);

    this.stats.averageWaitTime = this.stats.totalPending > 0 
      ? totalWaitTime / this.stats.totalPending 
      : 0;
  }

  getBookingPriority(booking: BookingDto): 'high' | 'medium' | 'low' {
    const now = new Date();
    const startDate = new Date(booking.startDate);
    const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilStart <= 24) return 'high';
    if (hoursUntilStart <= 72) return 'medium';
    return 'low';
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'high': return 'badge bg-danger';
      case 'medium': return 'badge bg-warning';
      case 'low': return 'badge bg-info';
      default: return 'badge bg-secondary';
    }
  }

  getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'high': return 'Urgent';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return 'Unknown';
    }
  }

  applyFilters(): void {
    this.filteredBookings = this.pendingBookings.filter(booking => {
      const matchesSearch = !this.searchTerm || 
        booking.customerEmail.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (booking.agencyDetails?.model || '').toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesDate = !this.dateFilter || 
        new Date(booking.startDate).toDateString() === new Date(this.dateFilter).toDateString();

      const priority = this.getBookingPriority(booking);
      const matchesPriority = this.priorityFilter === 'all' || priority === this.priorityFilter;

      return matchesSearch && matchesDate && matchesPriority;
    });

    this.applySorting();
  }

  applySorting(): void {
    this.filteredBookings.sort((a, b) => {
      switch (this.sortBy) {
        case 'priority':
          const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          const aPriority = this.getBookingPriority(a);
          const bPriority = this.getBookingPriority(b);
          return priorityOrder[bPriority] - priorityOrder[aPriority];
        case 'newest':
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        case 'oldest':
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        case 'highest-value':
          return (b.totalPrice || 0) - (a.totalPrice || 0);
        case 'lowest-value':
          return (a.totalPrice || 0) - (b.totalPrice || 0);
        default:
          return 0;
      }
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.dateFilter = '';
    this.sortBy = 'priority';
    this.priorityFilter = 'all';
    this.filteredBookings = [...this.pendingBookings];
    this.applySorting();
  }

  confirmBooking(bookingId: number): void {
    this.showToast('Confirming booking...', 'info');
    this.processingBookingId = bookingId;
    this.cdr.detectChanges();

    this.bookingService.confirmBooking(bookingId).subscribe({
      next: () => {
        this.processingBookingId = null;
        this.showToast('Booking confirmed successfully!', 'success');
        this.loadPendingBookings();
      },
      error: (err) => {
        this.processingBookingId = null;
        this.showToast('Failed to confirm booking. Please try again.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  cancelBooking(bookingId: number): void {
    this.showToast('Cancelling booking...', 'info');
    this.processingBookingId = bookingId;
    this.cdr.detectChanges();

    this.bookingService.cancelBooking(bookingId).subscribe({
      next: () => {
        this.processingBookingId = null;
        this.showToast('Booking cancelled successfully!', 'success');
        this.loadPendingBookings();
      },
      error: (err) => {
        this.processingBookingId = null;
        this.showToast('Failed to cancel booking. Please try again.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  bulkConfirmBookings(): void {
    const selectedBookings = this.filteredBookings.filter(b => 
      this.getBookingPriority(b) === 'high'
    );

    if (selectedBookings.length === 0) {
      this.showToast('No urgent bookings to confirm.', 'warning');
      return;
    }

    this.showToast(`Confirming ${selectedBookings.length} urgent booking(s)...`, 'info');

    const confirmPromises = selectedBookings.map(booking => 
      this.bookingService.confirmBooking(booking.id).toPromise()
    );

    Promise.all(confirmPromises)
      .then(() => {
        this.showToast(`${selectedBookings.length} bookings confirmed successfully!`, 'success');
        this.loadPendingBookings();
      })
      .catch(err => {
        this.showToast('Some bookings failed to confirm. Please check and try again.', 'error');
      });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  trackByBookingId(index: number, booking: BookingDto): number {
    return booking.id;
  }

  isProcessing(bookingId: number): boolean {
    return this.processingBookingId === bookingId;
  }

  // === Toast Management ===
  showToast(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
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
}