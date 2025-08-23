import { BookingType, SeatClass, Status } from "../../core/services/booking-services"

export interface FlightCompanyDto {
    id: number
    image: string
    name: string
    location: string
    rating: string
    flightCount: string
    description: string
    adminId: string
    flights: Flight[]
}
export interface Flight {
    id?:number
    flightId: number
    departureAirport: string
    arrivalAirport: string
    departureTime: string
    arrivalTime: string
    airlineName: string
    imageUrl: string
    economySeats: number
    businessSeats: number
    firstClassSeats: number
    flightCompanyId: number
    economyPrice: number
    businessPrice: number
    firstClassPrice: number
}
export interface FlightDetailsDTO {
    pageIndex: number
    pageSize: number
    count: number
    data: Flight[]
}
export interface FlightCreated{
    flightNumber: number
  departureAirport: string
  arrivalAirport: string
  departureTime: string
  arrivalTime: string
  economySeats: number
  businessSeats: number
  firstClassSeats: number
  economyPrice: number
  businessPrice: number
  firstClassPrice: number
  flightCompany: FlightCompany
}
export interface FlightCompany {
  id: number
  imageUrl: string
  name: string
  location: string
  description: string
  rating: number
  flightCount: number
  adminId: string
}
export interface FlightDashboardStats {
  totalFlights: number;
  totalBookings: number;
  activeBookings: number;
  totalRevenue: number;
  bookingsChart: {
    date: string;
    count: number;
  }[];
}

export interface FlightBooking {
  id: number;
  customerEmail: string;
  status: Status;
  price: number;
  departureTime: string;
  arrivalTime: string;
  departureAirport: string;
  arrivalAirport: string;
  flightId: number;
  seatClass: SeatClass;
  startDate: string;
  endDate: string;
  bookingType: BookingType;
  totalPrice: number;
  paymentStatus?: string;
  agencyDetails?: {
    id: number;
    flightId: number;
    departureAirport: string;
    arrivalAirport: string;
    departureTime: string;
    arrivalTime: string;
    airlineName: string;
    imageUrl: string;
    economySeats: number;
    businessSeats: number;
    firstClassSeats: number;
    flightCompanyId: number;
    economyPrice: number;
    businessPrice: number;
    firstClassPrice: number;
  };
}