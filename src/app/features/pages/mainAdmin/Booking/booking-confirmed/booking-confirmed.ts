import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookingDto, BookingService, BookingType, CarBookingResultDto, FlightBookingResultDto, RoomBookingResultDto, TourBookingResultDto } from '../../../../../core/services/booking-services';
declare var bootstrap: any; // لو بتستعمل Bootstrap عادي

@Component({
  selector: 'app-booking-confirmed',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './booking-confirmed.html',
  styleUrls: ['./booking-confirmed.css']
})
export class BookingConfirmedComponent implements OnInit {
  confirmedBookings: BookingDto[] = [];
  loading = false;
  error: string | null = null;
  BookingType = BookingType;

  constructor(private bookingService: BookingService , private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadConfirmedBookings();
          this.cd.detectChanges();

  }

  loadConfirmedBookings(): void {
    this.loading = true;
    this.error = null;

    this.bookingService.getAllBookings().subscribe({
      next: (data) => {
        // Filter for confirmed bookings only
        this.confirmedBookings = data.filter(booking => 
          this.getBookingStatus(booking) === 'Paid'
        );
        this.loading = false;
              this.cd.detectChanges();

      },
      error: (err) => {
        this.error = 'Failed to load confirmed bookings. Please try again.';
        this.loading = false;
              this.cd.detectChanges();

        console.error('Error loading confirmed bookings:', err);
      }
    });
  }


  selectedBooking: BookingDto | null = null;


  viewDetails(booking: BookingDto): void {
    this.selectedBooking = booking;
    const modal = new bootstrap.Modal(document.getElementById('bookingDetailsModal'));
    modal.show();

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

  getBookingStatus(booking: BookingDto): string {
    return booking.paymentStatus || 'Paid';
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

    cancelBooking(bookingId: number): void {
    if (confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      this.bookingService.deleteBooking(bookingId).subscribe({
        next: () => {
          this.loadConfirmedBookings();
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