export interface ITour {
        name: string;
        description?: string;
        image?: File;
        location?: string;
        rating?: number;
        adminId?: string;
}
export interface updatedITour {
        id:number;
        name: string;
        description?: string;
        image?: File;
        location?: string;
        rating?: number;
        adminId?: string;
}


// i-tour.ts
export interface ITourStats {
  totalTours: number;
  totalBookings: number;
  activeBookings: number;
  totalRevenue: number;
  bookingsChart: {
    date: string; 
    count: number; 
  }[];
}
export interface RecentBooking {
  id: number;
  customerName: string;
  tourName: string;
  bookingDate: string;
  totalAmount: number;
  status: string;
}

export interface TourCreateDto {
  name: string;
  startDate: string;
  endDate: string;
  description: string;
  destination: string;
  maxGuests: number;
  minGroupSize: number;
  maxGroupSize: number;
  price: number;
  imageUrl: string | null;
  category: TourCategory;
  languages: string;
  tourCompanyId: number;
  imageUrls: string[];
  tickets: TourTicketCreateDto[];
  includedItems: string[];
  excludedItems: string[];
  questions: TourQuestionDto[];
}

export interface TourUpdateDto extends TourCreateDto {
  id: number;
}

export interface TourReadDto {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  description: string;
  destination: string;
  maxGuests: number;
  minGroupSize: number;
  maxGroupSize: number;
  price: number;
  imageUrl: string | null;
  category: string | null;
  languages: string;
  tourCompanyId: number | null;
  tourCompanyName: string | null;
  imageUrls: string[] | null;
   tickets: TourTicketDto[] | null | undefined;
  includedItems: string[];
  excludedItems: string[];
  questions: TourQuestionDto[];
}

export interface TourTicketCreateDto {
  type: string;
  price: number;
  availableQuantity: number;
  isActive: boolean;
}

export interface TourTicketDto extends TourTicketCreateDto {
  id: number;
  tourId: number;
}

export interface TourQuestionDto {
  id: number;
  questionText: string;
  answerText: string;
  tourId: number;
}

export enum TourCategory {
  Adventure = 'Adventure',
  Relaxation = 'Relaxation',
  Cultural = 'Cultural',
  Nature = 'Nature',
  Historical = 'Historical'
}
export enum Status {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Cancelled = 'Cancelled'
}

export interface BookingTourDto {
  id: number;
  customerEmail: string;
  bookingType: string; // or enum
  startDate: string;
  endDate: string;
  totalPrice: number;
   status: Status;  
  agencyDetails: TourReadDto | null;
  paymentIntentId: string | null;
  clientSecret: string | null;
  paymentStatus: string | null;
}