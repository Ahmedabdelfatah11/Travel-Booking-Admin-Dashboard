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
  tickets: TourTicketDto[];
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