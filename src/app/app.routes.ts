import { Routes } from '@angular/router';
import { Layout } from './features/layout/layout/layout';
import { DashBoardComponent } from './features/pages/mainAdmin/AdminDashBoard/dash-board/dash-board';
import { TourCreation } from './features/pages/mainAdmin/Tour-Agency/tour-creation/tour-creation';
import { TourList } from './features/pages/mainAdmin/Tour-Agency/tour-list/tour-list';
import { Login } from './features/auth/Login/login/login';
import { superAdminGuard } from './core/guard/super-admin-guard-guard';
import { HotelsList } from './features/pages/mainAdmin/Hotel-Agency/hotels-list/hotels-list';
import { HotelCreation } from './features/pages/mainAdmin/Hotel-Agency/hotel-creation/hotel-creation';
import { CarRentalCreation } from './features/pages/mainAdmin/CarRental-Agency/car-rental-creation/car-rental-creation';
import { FlightsList } from './features/pages/mainAdmin/Flight-Agency/flights-list/flights-list';
import { FlightCreation } from './features/pages/mainAdmin/Flight-Agency/flight-creation/flight-creation';
import { Settings } from './features/pages/mainAdmin/Settings/settings/settings';
import { UsersList } from './features/pages/mainAdmin/Users/users-list/users-list';
import { BookingListComponent } from './features/pages/mainAdmin/Booking/booking-list/booking-list';
import { BookingConfirmedComponent } from './features/pages/mainAdmin/Booking/booking-confirmed/booking-confirmed';
import { BookingCancelledComponent } from './features/pages/mainAdmin/Booking/booking-cancelled/booking-cancelled';
import { BookingPendingComponent } from './features/pages/mainAdmin/Booking/booking-pending/booking-pending';
import { ReviewsListComponent } from './features/pages/mainAdmin/Reviews/reviews-list/reviews-list';
import { CarRentalListComponent } from './features/pages/mainAdmin/CarRental-Agency/car-rental-list/car-rental-list';
import { CarRentalEditComponent } from './features/pages/mainAdmin/CarRental-Agency/car-rental-edit/car-rental-edit';
import { FavoritesListComponent } from './features/pages/mainAdmin/favorites/favorites-list/favorites-list';
import { UserCreation } from './features/pages/mainAdmin/Users/user-creation/user-creation';
import { HotelComponent } from './features/pages/mainAdmin/favorites/hotel/hotel';
import { TourComponent } from './features/pages/mainAdmin/favorites/tour/tour';

export const routes: Routes = [
  { path: 'login', component: Login },


  {
    path: '',
    component: Layout,
    canActivateChild: [superAdminGuard],
    children: [
      { path: 'dashboard', component: DashBoardComponent },
      { path: 'tour', component: TourList },
      { path: 'tour/create', component: TourCreation },
      { path: 'hotel', component: HotelsList },
      { path: 'hotel/create', component: HotelCreation },
      { path: 'car', component: CarRentalListComponent },
      { path: 'car/create', component: CarRentalCreation },
    { path: 'car/edit/:id', component: CarRentalEditComponent }, 
      { path: 'flight', component: FlightsList },
      { path: 'flight/create', component: FlightCreation },
      { path: 'reviews', component: ReviewsListComponent },
      { path: 'favorites', component: FavoritesListComponent },
     { path: 'hotel/:id', component: HotelComponent }, 
     { path: 'tour/:id', component: TourComponent }, 

      { path: 'settings', component: Settings }, 
      { path: 'users', component: UsersList }, 
      { path: 'users/create', component: UserCreation }, 
      { path: 'booking', component: BookingListComponent }, 
      { path: 'booking/confirmed', component: BookingConfirmedComponent }, 
      { path: 'booking/cancelled', component: BookingCancelledComponent }, 
      { path: 'booking/pending', component: BookingPendingComponent }, 
    ]
  },

  { path: '**', redirectTo: 'login' }
];
