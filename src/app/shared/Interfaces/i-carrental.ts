// i-carrental.ts - Interface for car rental operations

export interface ICarrental {
  name: string;
  description?: string;
  location: string;
  rating?: number | null;
  adminId?: string;
  image?: File;
}

export interface updatedICarRental {
  id: number;
  name: string;
  description?: string;
  location: string;
  rating?: number | null;
  adminId?: string;
  image?: File;
}

export interface CarRentalCompanyResponse {
  id: number;
  name: string;
  description?: string;
  location: string;
  imageUrl?: string;
  rating?: number;
  adminId?: string;
  cars?: CarResponse[];
}

export interface CarResponse {
  id: number;
  model: string;
  price: number;
  description: string;
  isAvailable: boolean;
  location: string;
  imageUrl?: string;
  capacity: number;
}

export interface CarRentalListResponse {
  data: CarRentalCompanyResponse[];
  count: number;
  pageIndex: number;
  pageSize: number;
}