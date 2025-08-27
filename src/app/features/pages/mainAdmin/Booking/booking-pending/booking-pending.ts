import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookingDto, BookingService, BookingType, CarBookingResultDto, FlightBookingResultDto, RoomBookingResultDto, TourBookingResultDto } from '../../../../../core/services/booking-services';

@Component({
  selector: 'app-booking-pending',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './booking-pending.html',
    styleUrls: ['../booking-list/booking-list.css']
  })
  export class BookingPendingComponent implements OnInit {
    pendingBookings: BookingDto[] = [];
    selectedBookings: boolean[] = [];
    allSelected = false;
    loading = false;
    error: string | null = null;
    BookingType = BookingType;

    constructor(private bookingService: BookingService, private cd: ChangeDetectorRef) {}

    ngOnInit(): void {
      this.loadPendingBookings();
    }

    loadPendingBookings(): void {
      this.loading = true;
      this.error = null;

      this.bookingService.getAllBookings().subscribe({
        next: (data) => {
          this.pendingBookings = data.filter(booking => 
            this.getBookingStatus(booking) === 'Pending'
          );
          this.selectedBookings = new Array(this.pendingBookings.length).fill(false);
          this.loading = false;
                this.cd.detectChanges();

        },
        error: (err) => {
          this.error = 'Failed to load pending bookings. Please try again.';
          this.loading = false;
                this.cd.detectChanges();

        }
      });
    }

    confirmBooking(bookingId: number): void {
      if (confirm('Are you sure you want to approve this booking?')) {
        this.bookingService.confirmBooking(bookingId).subscribe({
          next: () => {
            this.loadPendingBookings();
                  this.cd.detectChanges();

          },
          error: (err) => {
            alert('Failed to confirm booking. Please try again.');
                  this.cd.detectChanges();

          }
        });
      }
    }

    cancelBooking(bookingId: number): void {
      if (confirm('Are you sure you want to reject this booking?')) {
        this.bookingService.deleteBooking(bookingId).subscribe({
          next: () => {
            this.loadPendingBookings();
          },
          error: (err) => {
            alert('Failed to cancel booking. Please try again.');
          }
        });
      }
    }

    bulkConfirmBookings(): void {
      const selectedIds = this.getSelectedBookingIds();
      if (selectedIds.length === 0) {
        alert('Please select at least one booking to confirm.');
        return;
      }

      if (confirm(`Are you sure you want to confirm ${selectedIds.length} booking(s)?`)) {
        // Process each selected booking
        const confirmPromises = selectedIds.map(id => 
          this.bookingService.confirmBooking(id).toPromise()
        );

        Promise.all(confirmPromises).then(() => {
          this.loadPendingBookings();
                this.cd.detectChanges();

        }).catch((err) => {
          alert('Some bookings could not be confirmed. Please try again.');
        });
      }
    }

    bulkCancelBookings(): void {
      const selectedIds = this.getSelectedBookingIds();
      if (selectedIds.length === 0) {
        alert('Please select at least one booking to cancel.');
        return;
      }

      if (confirm(`Are you sure you want to cancel ${selectedIds.length} booking(s)?`)) {
        const cancelPromises = selectedIds.map(id => 
          this.bookingService.cancelBooking(id).toPromise()
        );

        Promise.all(cancelPromises).then(() => {
          this.loadPendingBookings();
                this.cd.detectChanges();

        }).catch((err) => {
          alert('Some bookings could not be cancelled. Please try again.');
        });
      }
    }

    toggleSelectAll(event: any): void {
      this.allSelected = event.target.checked;
      this.selectedBookings = this.selectedBookings.map(() => this.allSelected);
    }

    updateSelectAll(): void {
      this.allSelected = this.selectedBookings.every(selected => selected);
    }

    getSelectedBookingIds(): number[] {
      return this.pendingBookings
        .filter((_, index) => this.selectedBookings[index])
        .map(booking => booking.id);
    }

  selectedBooking: BookingDto | null = null;

viewDetails(booking: BookingDto): void {
  this.selectedBooking = booking;
  const modal: any = document.getElementById('bookingDetailsModal');
  if (modal) {
    const bsModal = new (window as any).bootstrap.Modal(modal);
    bsModal.show();
  }
}

    isUrgent(booking: BookingDto): boolean {
      const startDate = new Date(booking.startDate);
      const now = new Date();
      const diffTime = startDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 3;
    }

    getPriority(booking: BookingDto): string {
      if (this.isUrgent(booking)) return 'High';
      
      const startDate = new Date(booking.startDate);
      const now = new Date();
      const diffTime = startDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 7) return 'Medium';
      return 'Normal';
    }

    getPriorityClass(booking: BookingDto): string {
      const priority = this.getPriority(booking);
      switch (priority) {
        case 'High': return 'badge bg-danger';
        case 'Medium': return 'badge bg-warning text-dark';
        default: return 'badge bg-info';
      }
    }

    getPotentialRevenue(): number {
      return this.pendingBookings.reduce((total, booking) => {
        return total + (booking.totalPrice || 0);
      }, 0);
    }

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

    getBookingStatus(booking: BookingDto): string {
      return booking.paymentStatus || 'Pending';
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