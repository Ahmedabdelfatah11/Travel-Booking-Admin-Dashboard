import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookingDto, BookingService, BookingType, CarBookingResultDto, FlightBookingResultDto, RoomBookingResultDto, TourBookingResultDto } from '../../../../../core/services/booking-services';

@Component({
  selector: 'app-booking-cancelled',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './booking-cancelled.html',
  styleUrls: ['../booking-list/booking-list.css']
})
export class BookingCancelledComponent implements OnInit {
  cancelledBookings: BookingDto[] = [];
  loading = false;
  error: string | null = null;
  BookingType = BookingType;

  constructor(private bookingService: BookingService) {}

  ngOnInit(): void {
    this.loadCancelledBookings();
  }

  loadCancelledBookings(): void {
    this.loading = true;
    this.error = null;

    this.bookingService.getAllBookings().subscribe({
      next: (data) => {
        // Filter for cancelled bookings only
        this.cancelledBookings = data.filter(booking => 
          this.getBookingStatus(booking) === 'Failed'
        );
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load cancelled bookings. Please try again.';
        this.loading = false;
        console.error('Error loading cancelled bookings:', err);
      }
    });
  }

  deleteBooking(bookingId: number): void {
    if (confirm('Are you sure you want to permanently delete this cancelled booking record?')) {
      this.bookingService.deleteBooking(bookingId).subscribe({
        next: () => {
          this.loadCancelledBookings();
        },
        error: (err) => {
          alert('Failed to delete booking. Please try again.');
          console.error('Error deleting booking:', err);
        }
      });
    }
  }

  viewDetails(booking: BookingDto): void {
    console.log('View cancelled booking details:', booking);
  }

  getTotalLostRevenue(): number {
    return this.cancelledBookings.reduce((total, booking) => {
      return total + (booking.totalPrice || 0);
    }, 0);
  }

  getCancellationReason(booking: BookingDto): string {
    // This would typically come from the API
    return 'User requested cancellation';
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
    return booking.paymentStatus || 'Failed';
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