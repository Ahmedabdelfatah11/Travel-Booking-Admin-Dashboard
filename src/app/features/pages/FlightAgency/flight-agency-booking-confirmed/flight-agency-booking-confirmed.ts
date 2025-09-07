import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Status, SeatClass, BookingType, BookingService, BookingDto, paymentStatus } from '../../../../core/services/booking-services';
import { firstValueFrom } from 'rxjs';
import { FlightBooking } from '../../../../shared/Interfaces/iflight';
import { Auth } from '../../../../core/services/auth';

@Component({
  selector: 'app-flight-agency-booking-confirmed',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './flight-agency-booking-confirmed.html',
  styleUrls: ['./flight-agency-booking-confirmed.css']
})
export class FlightAgencyBookingConfirmed implements OnInit {
  confirmedBookings: FlightBooking[] = [];
  loading = false;
  error: string | null = null;
  flightCompanyId: number | null = null;

  // Statistics
  totalBookings = 0;
  totalRevenue = 0;
  averagePrice = 0;

  constructor(private bookingService: BookingService, private cd: ChangeDetectorRef, private authService: Auth) { }

  async ngOnInit() {
    await this.initializeComponent();
  }

  private async initializeComponent(): Promise<void> {
    this.flightCompanyId = this.getFlightCompanyIdFromToken();

    if (!this.flightCompanyId) {
      this.error = 'Flight company information not found. Please contact support.';
      return;
    }

    await this.loadConfirmedBookings();
  }

  private getFlightCompanyIdFromToken(): number | null {
    const token = this.authService.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const flightCompanyId = payload['FlightCompanyId'];
      return flightCompanyId ? parseInt(flightCompanyId) : null;
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

      this.confirmedBookings = allBookings
        ?.map((booking: BookingDto) => ({
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
        }))
        .filter(b => b.bookingType === BookingType.Flight && b.status === Status.Confirmed && b.agencyDetails?.flightCompanyId === this.flightCompanyId) || [];

      this.updateStatistics();
    } catch (error) {
      this.error = 'Failed to load confirmed flight bookings. Please try again.';
    } finally {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(1000 - elapsed, 0);

      setTimeout(() => {
        this.loading = false;
        this.cd.detectChanges();
      }, remaining);
    }
  }

  updateStatistics(): void {
    this.totalBookings = this.confirmedBookings.length;
    this.totalRevenue = this.confirmedBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
    this.averagePrice = this.totalBookings > 0 ? this.totalRevenue / this.totalBookings : 0;
  }

  getStatusLabel(status: Status): string {
    return this.bookingService.getStatusLabel(status);
  }

  getStatusClass(status: Status): string {
    return this.bookingService.getStatusClass(status);
  }

  getSeatClassLabel(seatClass: SeatClass): string {
    switch (seatClass) {
      case SeatClass.Economy: return 'Economy Class';
      case SeatClass.Business: return 'Business Class';
      case SeatClass.FirstClass: return 'First Class';
      default: return 'Unknown Class';
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

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatPrice(price: number): string {
    if (price == null || price === 0) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  getFlightDuration(departure: string, arrival: string): string {
    if (!departure || !arrival) return 'N/A';

    const dep = new Date(departure);
    const arr = new Date(arrival);
    const diffMs = arr.getTime() - dep.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${diffHrs}h ${diffMins}m`;
  }

  async refreshBookings(): Promise<void> {
    await this.loadConfirmedBookings();
  }
}