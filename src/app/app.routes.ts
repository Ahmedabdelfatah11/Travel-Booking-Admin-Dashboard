import { Routes } from '@angular/router';
import { Layout } from './features/layout/layout/layout';
import { DashBoard } from './features/pages/mainAdmin/AdminDashBoard/dash-board/dash-board';
import { TourCreation } from './features/pages/mainAdmin/Tour-Agency/tour-creation/tour-creation';
import { TourList } from './features/pages/mainAdmin/Tour-Agency/tour-list/tour-list';
import { Login } from './features/auth/Login/login/login';
import { superAdminGuard } from './core/guard/super-admin-guard-guard';
import { HotelsList } from './features/pages/mainAdmin/Hotel-Agency/hotels-list/hotels-list';
import { HotelCreation } from './features/pages/mainAdmin/Hotel-Agency/hotel-creation/hotel-creation';
import { CarRentalList } from './features/pages/mainAdmin/CarRental-Agency/car-rental-list/car-rental-list';
import { CarRentalCreation } from './features/pages/mainAdmin/CarRental-Agency/car-rental-creation/car-rental-creation';
import { FlightsList } from './features/pages/mainAdmin/Flight-Agency/flights-list/flights-list';
import { FlightCreation } from './features/pages/mainAdmin/Flight-Agency/flight-creation/flight-creation';
import { ReviewsList } from './features/pages/mainAdmin/Reviews/reviews-list/reviews-list';
import { WishlistList } from './features/pages/mainAdmin/Wishlist/wishlist-list/wishlist-list';
import { Settings } from './features/pages/mainAdmin/Settings/settings/settings';
import { UsersList } from './features/pages/mainAdmin/Users/users-list/users-list';
import { BookingList } from './features/pages/mainAdmin/Booking/booking-list/booking-list';
import { BookingConfirmed } from './features/pages/mainAdmin/Booking/booking-confirmed/booking-confirmed';
import { BookingCancelled } from './features/pages/mainAdmin/Booking/booking-cancelled/booking-cancelled';
import { BookingPending } from './features/pages/mainAdmin/Booking/booking-pending/booking-pending';
import { UserCreation } from './features/pages/mainAdmin/Users/user-creation/user-creation';

export const routes: Routes = [
  { path: 'login', component: Login },


  {
    path: '',
    component: Layout,
    canActivateChild: [superAdminGuard],
    children: [
      { path: 'dashboard', component: DashBoard },
      { path: 'tour', component: TourList },
      { path: 'tour/create', component: TourCreation },
      { path: 'hotel', component: HotelsList },
      { path: 'hotel/create', component: HotelCreation },
      { path: 'car', component: CarRentalList },
      { path: 'car/create', component: CarRentalCreation },
      { path: 'flight', component: FlightsList },
      { path: 'flight/create', component: FlightCreation },
      { path: 'reviews', component: ReviewsList },
      { path: 'wishlist', component: WishlistList },
      { path: 'settings', component: Settings }, 
      { path: 'users', component: UsersList }, 
      { path: 'users/create', component: UserCreation }, 
      { path: 'booking', component: BookingList }, 
      { path: 'booking/confirmed', component: BookingConfirmed }, 
      { path: 'booking/cancelled', component: BookingCancelled }, 
      { path: 'booking/pending', component: BookingPending }, 
    ]
  },

  { path: '**', redirectTo: 'login' }
];
