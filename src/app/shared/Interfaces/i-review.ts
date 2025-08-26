// src/app/shared/Interfaces/i-review.ts

export interface ReviewDto {
  id: number;
  userId: string;
  companyType: string;
  hotelCompanyId: number | null;
  flightCompanyId: number | null;
  carRentalCompanyId: number | null;
  tourCompanyId: number | null;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string | null;

  // Company Info
  companyName: string | null;
  companyDescription: string | null;
  companyImageUrl: string | null;
  companyLocation: string | null;

  // User Info
  userName: string | null;
  userEmail: string | null;
}

export interface ReviewsResponse {
  reviews: ReviewDto[];
  totalCount: number;
}

export interface ReviewStatsDto {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [rating: number]: number };
  recentReviews: ReviewDto[];
}