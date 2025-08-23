import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookingDto, BookingService, BookingType, CarBookingResultDto, FlightBookingResultDto, RoomBookingResultDto, TourBookingResultDto } from '../../../../../core/services/booking-services';

@Component({
  selector: 'app-booking-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './booking-list.html',
  styleUrls: ['./booking-list.css']
})
export class BookingListComponent implements OnInit {
  bookings: BookingDto[] = [];
  filteredBookings: BookingDto[] = [];
  loading = false;
  error: string | null = null;

  // Filter properties
  searchTerm = '';
  selectedBookingType = '';
  selectedStatus = '';
  startDate = '';
  endDate = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  // Enums for template
  BookingType = BookingType;

  constructor(private bookingService: BookingService, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadBookings();
          this.cd.detectChanges();

  }

  loadBookings(): void {
    this.loading = true;
    this.error = null;

    this.bookingService.getAllBookings().subscribe({
      next: (data) => {
        this.bookings = data;
        this.applyFilters();
        this.loading = false;
              this.cd.detectChanges();

      },
      error: (err) => {
        this.error = 'Failed to load bookings. Please try again.';
        this.loading = false;
        console.error('Error loading bookings:', err);
              this.cd.detectChanges();

      }
    });
  }

  applyFilters(): void {
    this.filteredBookings = this.bookings.filter(booking => {
      // Search term filter
      const matchesSearch = !this.searchTerm || 
        booking.customerEmail.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        booking.id.toString().includes(this.searchTerm);

      // Booking type filter
  const matchesType = !this.selectedBookingType || 
  booking.bookingType.toString() === this.selectedBookingType;

      // Status filter (using mapped booking status)
      const matchesStatus = !this.selectedStatus || 
                            this.getBookingStatus(booking) === this.selectedStatus;

      // Date range filter
      const bookingDate = new Date(booking.startDate);
      const matchesDateRange = (!this.startDate || bookingDate >= new Date(this.startDate)) &&
                              (!this.endDate || bookingDate <= new Date(this.endDate));

      return matchesSearch && matchesType && matchesStatus && matchesDateRange;
    });

    this.totalItems = this.filteredBookings.length;
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedBookingType = '';
    this.selectedStatus = '';
    this.startDate = '';
    this.endDate = '';
    this.applyFilters();
  }

  get paginatedBookings(): BookingDto[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredBookings.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  confirmBooking(bookingId: number): void {
    if (confirm('Are you sure you want to confirm this booking?')) {
      this.bookingService.confirmBooking(bookingId).subscribe({
        next: () => {
          this.loadBookings();
                this.cd.detectChanges();

        },
        error: (err) => {
          alert('Failed to confirm booking. Please try again.');
          console.error('Error confirming booking:', err);
                this.cd.detectChanges();

        }
      });
    }
  }

  cancelBooking(bookingId: number): void {
    if (confirm('Are you sure you want to cancel this booking?')) {
      this.bookingService.deleteBooking(bookingId).subscribe({
        next: () => {
          this.loadBookings();
                this.cd.detectChanges();

        },
        error: (err) => {
          alert('Failed to cancel booking. Please try again.');
          console.error('Error canceling booking:', err);
                this.cd.detectChanges();

        }
      });
    }
  }

  deleteBooking(bookingId: number): void {
    if (confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      this.bookingService.deleteBooking(bookingId).subscribe({
        next: () => {
          this.loadBookings();
                this.cd.detectChanges();

        },
        error: (err) => {
          alert('Failed to delete booking. Please try again.');
          console.error('Error deleting booking:', err);
                this.cd.detectChanges();

        }
      });
    }
  }

  // getBookingTypeLabel(type: BookingType): string {
  //   return this.bookingService.getBookingTypeLabel(type);
  // }

   getBookingTypeLabel(bookingType: string): string {
    // Implement the logic to return the booking type label
    switch (bookingType) {
      case 'Room':
        return 'Room';
      case 'Car':
        return 'Car';
      case 'Flight':
        return 'Flight';
      case 'Tour':
        return 'Tour';
      default:
        return 'Unknown';
    }
  }


  // 👇 Mapping بين PaymentStatus → Status
  getBookingStatus(booking: BookingDto): string {
    switch (booking.paymentStatus?.toLowerCase()) {
      case 'paid': return 'Confirmed';
      case 'failed': return 'Cancelled';
      case 'pending': return 'Pending';
      default: return 'Pending';
    }
  }




  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'badge bg-success';
      case 'cancelled': return 'badge bg-danger';
      case 'pending': return 'badge bg-warning text-dark';
      default: return 'badge bg-secondary';
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getBookingTypeIcon(type: BookingType): string {
    switch (type) {
      case BookingType.Room: return 'fas fa-bed';
      case BookingType.Car: return 'fas fa-car';
      case BookingType.Flight: return 'fas fa-plane';
      case BookingType.Tour: return 'fas fa-map-marked-alt';
      default: return 'fas fa-question';
    }
  }

  // 📊 العدادات
  get confirmedCount(): number {
    return this.bookings.filter(b => this.getBookingStatus(b) === 'Confirmed').length;
  }

  get pendingCount(): number {
    return this.bookings.filter(b => this.getBookingStatus(b) === 'Pending').length;
  }

  get cancelledCount(): number {
    return this.bookings.filter(b => this.getBookingStatus(b) === 'Cancelled').length;
  }



getRoomDetails(details: any): RoomBookingResultDto {
  return details as RoomBookingResultDto;
}

getCarDetails(details: any): CarBookingResultDto {
  return details as CarBookingResultDto;
}

getFlightDetails(details: any): FlightBookingResultDto {
  return details as FlightBookingResultDto;
}

getTourDetails(details: any): TourBookingResultDto {
  return details as TourBookingResultDto;
}

}
