import { Routes } from '@angular/router';
import { Login } from './features/auth/Login/login/login';
//admin
import { Layout } from './features/layout/layout/layout';
import { TourCreation } from './features/pages/mainAdmin/Tour-Agency/tour-creation/tour-creation';
import { TourList } from './features/pages/mainAdmin/Tour-Agency/tour-list/tour-list';
import { superAdminGuard } from './core/guard/super-admin-guard-guard';
import { HotelsList } from './features/pages/mainAdmin/Hotel-Agency/hotels-list/hotels-list';
import { HotelCreation } from './features/pages/mainAdmin/Hotel-Agency/hotel-creation/hotel-creation';
import { CarRentalCreation } from './features/pages/mainAdmin/CarRental-Agency/car-rental-creation/car-rental-creation';
import { FlightsList } from './features/pages/mainAdmin/Flight-Agency/flights-list/flights-list';
import { FlightCreation } from './features/pages/mainAdmin/Flight-Agency/flight-creation/flight-creation';
import { Settings } from './features/pages/mainAdmin/Settings/settings/settings';
import { UsersList } from './features/pages/mainAdmin/Users/users-list/users-list';
import { UserCreation } from './features/pages/mainAdmin/Users/user-creation/user-creation';
import { DashBoardComponent } from './features/pages/mainAdmin/AdminDashBoard/dash-board/dash-board';
import { CarRentalListComponent } from './features/pages/mainAdmin/CarRental-Agency/car-rental-list/car-rental-list';
import { ReviewsListComponent } from './features/pages/mainAdmin/Reviews/reviews-list/reviews-list';
import { flightAdminGuardGuard } from './core/guard/flight-admin-guard-guard';
import { BookingConfirmedComponent } from './features/pages/mainAdmin/Booking/booking-confirmed/booking-confirmed';
import { BookingListComponent } from './features/pages/mainAdmin/Booking/booking-list/booking-list';
import { BookingCancelledComponent } from './features/pages/mainAdmin/Booking/booking-cancelled/booking-cancelled';
import { BookingPendingComponent } from './features/pages/mainAdmin/Booking/booking-pending/booking-pending';

//tour
import { TourAgencyLayout } from './features/layout/tour-agency-layout/tour-agency-layout/tour-agency-layout';
import { tourAdminGuardGuard } from './core/guard/tour-admin-guard-guard';
import { loginRedirectGuard } from './core/guard/login-redirect-guard';
import { TourListForTourAgency } from './features/pages/TourAgency/tour-list-for-tour-agency/tour-list-for-tour-agency';
import { TourAgencyTourCreation } from './features/pages/TourAgency/tour-agency-tour-creation/tour-agency-tour-creation';
import { TourAgencyReviews } from './features/pages/TourAgency/tour-agency-reviews/tour-agency-reviews';
import { TourAgencySettings } from './features/pages/TourAgency/tour-agency-settings/tour-agency-settings';
import { TourAgencyBookingList } from './features/pages/TourAgency/tour-agency-booking-list/tour-agency-booking-list';
import { TourAgencyBookingConfirmed } from './features/pages/TourAgency/tour-agency-booking-confirmed/tour-agency-booking-confirmed';
import { TourAgencyBookingCancelled } from './features/pages/TourAgency/tour-agency-booking-cancelled/tour-agency-booking-cancelled';
import { TourAgencyBookingPending } from './features/pages/TourAgency/tour-agency-booking-pending/tour-agency-booking-pending';
import { TourEdit } from './features/pages/TourAgency/tour-edit/tour-edit';
//flight
import { FlightAgencyLayout } from './features/layout/flight-agency-layout/flight-agency-layout';
import { FlightAgencyDashboard } from './features/pages/FlightAgency/flight-agency-dashboard/flight-agency-dashboard';
import { FlightAgencyFlightList } from './features/pages/FlightAgency/flight-agency-flight-list/flight-agency-flight-list';
import { FlightAgencyFlightCreation } from './features/pages/FlightAgency/flight-agency-flight-creation/flight-agency-flight-creation';
import { FlightAgencyFlightEdit } from './features/pages/FlightAgency/flight-agency-flight-edit/flight-agency-flight-edit';
import { FlightAgencyReviews } from './features/pages/FlightAgency/flight-agency-reviews/flight-agency-reviews';
import { FlightAgencySettings } from './features/pages/FlightAgency/flight-agency-settings/flight-agency-settings';
import { FlightAgencyBookingList } from './features/pages/FlightAgency/flight-agency-booking-list/flight-agency-booking-list';
import { FlightAgencyBookingConfirmed } from './features/pages/FlightAgency/flight-agency-booking-confirmed/flight-agency-booking-confirmed';
import { FlightAgencyBookingCancelled } from './features/pages/FlightAgency/flight-agency-booking-cancelled/flight-agency-booking-cancelled';
import { FlightAgencyBookingPending } from './features/pages/FlightAgency/flight-agency-booking-pending/flight-agency-booking-pending';
import { FavoritesListComponent } from './features/pages/mainAdmin/favorites/favorites-list/favorites-list';
import { CarRentalEditComponent } from './features/pages/mainAdmin/CarRental-Agency/car-rental-edit/car-rental-edit';
import { TourAgencyDashboardComponent } from './features/pages/TourAgency/tour-agency-dashboard/tour-agency-dashboard';
import { TourAgencyWishlist } from './features/pages/TourAgency/tour-agency-wishlist/tour-agency-wishlist';


export const routes: Routes = [
  // Login route
  { path: 'login', component: Login, canActivate: [loginRedirectGuard] },

  // Super Admin: /admin/...
{
  path: '',
  component: Layout,
  canActivateChild: [superAdminGuard],
  children: [
    { path: 'admin/dashboard', component: DashBoardComponent },
    { path: 'admin/tour', component: TourList },
    { path: 'admin/tour/create', component: TourCreation },
    { path: 'admin/hotel', component: HotelsList },
    { path: 'admin/hotel/create', component: HotelCreation },
    { path: 'admin/car', component: CarRentalListComponent },
    { path: 'admin/car/create', component: CarRentalCreation },
    { path: 'admin/car/edit/:id', component: CarRentalEditComponent },
    { path: 'admin/flight', component: FlightsList },
    { path: 'admin/flight/create', component: FlightCreation },
    { path: 'admin/reviews', component: ReviewsListComponent },
    { path: 'admin/favorites', component: FavoritesListComponent },
    { path: 'admin/settings', component: Settings },
    { path: 'admin/users', component: UsersList },
    { path: 'admin/users/create', component: UserCreation },
    { path: 'admin/booking', component: BookingListComponent },
    { path: 'admin/booking/confirmed', component: BookingConfirmedComponent },
    { path: 'admin/booking/cancelled', component: BookingCancelledComponent },
    { path: 'admin/booking/pending', component: BookingPendingComponent },
    { path: '', redirectTo: 'admin/dashboard', pathMatch: 'full' },
  ],
},

  // Tour Admin: /tour-admin/...
  {
    path: 'tour-admin',
    component: TourAgencyLayout,
    canActivateChild: [tourAdminGuardGuard],
    children: [
      { path: 'dashboard', component: TourAgencyDashboardComponent },
      { path: 'tours', component: TourListForTourAgency },
      { path: 'tours/create', component: TourAgencyTourCreation },
      {path: 'edit-tour/:id', component: TourEdit},
      { path: 'reviews', component: TourAgencyReviews },
      { path: 'wishlist', component: TourAgencyWishlist },
      { path: 'settings', component: TourAgencySettings },
      { path: 'booking', component: TourAgencyBookingList },
      { path: 'booking/confirmed', component: TourAgencyBookingConfirmed },
      { path: 'booking/cancelled', component: TourAgencyBookingCancelled },
      { path: 'booking/pending', component: TourAgencyBookingPending },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }, 
    ],
  },


  // flight Admin: /flight-admin/...
  {
    path: 'flight-admin',
    component: FlightAgencyLayout,
    canActivateChild: [flightAdminGuardGuard],
    children: [
      { path: 'dashboard', component: FlightAgencyDashboard },
      { path: 'flights', component: FlightAgencyFlightList },
      { path: 'flights/create', component: FlightAgencyFlightCreation },
      {path: 'edit-flight/:id', component: FlightAgencyFlightEdit},
      { path: 'reviews', component: FlightAgencyReviews },
      { path: 'settings', component: FlightAgencySettings },
      { path: 'booking', component: FlightAgencyBookingList },
      { path: 'booking/confirmed', component: FlightAgencyBookingConfirmed },
      { path: 'booking/cancelled', component: FlightAgencyBookingCancelled },
      { path: 'booking/pending', component: FlightAgencyBookingPending },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }, 
    ],
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
