import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Enums
export enum BookingType {
  Room = "Room",
  Car = "Car",
  Flight = "Flight",
  Tour = "Tour"
}

export enum Status {
  Pending = 0,
  Confirmed = 1,
  Cancelled = 2
}
export enum paymentStatus {
  Pending = 0,
  paid = 1,
  Failed = 2
}

export enum SeatClass {
  Economy = 0,
  Business = 1,
  FirstClass = 2
}

// DTOs
export interface BookingDto {
  status: string;
  id: number;
  customerEmail: string;
  bookingType: BookingType;
  startDate: string;
  endDate: string;
  totalPrice?: number;
  agencyDetails?: any;
  paymentIntentId?: string;
  clientSecret?: string;
  paymentStatus?: string;
}

export interface TourTicketSummaryDto {
  type: string;
  quantity: number;
  unitPrice: number;
}

export interface CarBookingResultDto {
  id: number;
  status: string;
  price: number;
  startDate: string;
  endDate: string;
  carId: number;
  carModel: string;
  totalPrice: number;
}

export interface RoomBookingResultDto {
  bookingId: number;
  status: Status;
  price: number;
  startDate: string;
  endDate: string;
  roomId: number;
  roomType: string;
  totalPrice: number;
}

export interface FlightBookingResultDto {
  bookingId: number;
  status: string;
  price: number;
  departureTime: string;
  arrivalTime: string;
  departureAirport: string;
  arrivalAirport: string;
  flightId: number;
  seatClass: SeatClass;
}

export interface TourBookingResultDto {
  bookingId: number;
  status: string;
  totalPrice: number;
  tourName: string;
  destination?: string;
  startDate: string;
  endDate: string;
  category?: any;
  tourId: number;
  tickets: TourTicketSummaryDto[];
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = 'http://pyramigo.runasp.net/api'; // Adjust your API URL

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Get all bookings
  getAllBookings(): Observable<BookingDto[]> {
    return this.http.get<BookingDto[]>(`${this.apiUrl}/booking`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get booking by ID
  getBookingById(id: number): Observable<BookingDto> {
    return this.http.get<BookingDto>(`${this.apiUrl}/Booking/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Delete booking
  deleteBooking(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/Booking/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Confirm booking
  confirmBooking(bookingId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/Booking/confirm/${bookingId}`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  // Cancel booking
  cancelBooking(bookingId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/Booking/cancel/${bookingId}`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  // Get user tickets
  getUserTickets(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Booking/user/${userId}/tickets`, {
      headers: this.getAuthHeaders()
    });
  }

  // Helper methods to get booking type and status labels
  getBookingTypeLabel(booking: BookingDto): string {
    switch (booking.bookingType) {
      case BookingType.Room: return 'Room';
      case BookingType.Car: return 'Car';
      case BookingType.Flight: return 'Flight';
      case BookingType.Tour: return 'Tour';
      default: return 'Unknown';
    }
  }


  getStatusLabel(status: Status): string {
    switch (status) {
      case Status.Pending: return 'Pending';
      case Status.Confirmed: return 'Confirmed';
      case Status.Cancelled: return 'Cancelled';
      default: return 'Unknown';
    }
  }

  getStatusClass(status: Status): string {
    switch (status) {
      case Status.Pending: return 'badge bg-warning';
      case Status.Confirmed: return 'badge bg-success';
      case Status.Cancelled: return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }
  mapStatus(apiStatus: string | null | undefined): Status {
  switch (apiStatus) {
    case 'Confirmed':
      return Status.Confirmed;
    case 'Cancelled':
      return Status.Cancelled;
    case 'Pending':
    default:
      return Status.Pending;
  }
}
// Get bookings for a specific flight company
getFlightCompanyBookings(flightCompanyId: number): Observable<BookingDto[]> {
  return this.http.get<BookingDto[]>(`${this.apiUrl}/booking/flight-company/${flightCompanyId}`, {
    headers: this.getAuthHeaders()
  });
}

// Get bookings for the current FlightAdmin's company
getMyCompanyBookings(): Observable<BookingDto[]> {
  return this.http.get<BookingDto[]>(`${this.apiUrl}/booking/my-company-bookings`, {
    headers: this.getAuthHeaders()
  });
}
}