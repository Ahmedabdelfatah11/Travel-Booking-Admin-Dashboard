import { Routes } from '@angular/router';
import { Layout } from './features/layout/layout/layout';
import { DashBoardComponent } from './features/pages/mainAdmin/AdminDashBoard/dash-board/dash-board';
import { TourCreation } from './features/pages/mainAdmin/Tour-Agency/tour-creation/tour-creation';
import { TourList } from './features/pages/mainAdmin/Tour-Agency/tour-list/tour-list';
import { Login } from './features/auth/Login/login/login';
import { superAdminGuard } from './core/guard/super-admin-guard-guard';
import { HotelsList } from './features/pages/mainAdmin/Hotel-Agency/hotels-list/hotels-list';
import { HotelCreation } from './features/pages/mainAdmin/Hotel-Agency/hotel-creation/hotel-creation';
import { CarRentalListComponent } from './features/pages/mainAdmin/CarRental-Agency/car-rental-list/car-rental-list';
import { CarRentalCreation } from './features/pages/mainAdmin/CarRental-Agency/car-rental-creation/car-rental-creation';
import { FlightsList } from './features/pages/mainAdmin/Flight-Agency/flights-list/flights-list';
import { FlightCreation } from './features/pages/mainAdmin/Flight-Agency/flight-creation/flight-creation';
import { ReviewsListComponent } from './features/pages/mainAdmin/Reviews/reviews-list/reviews-list';
import { FavoritesListComponent } from './features/pages/mainAdmin/favorites/favorites-list/favorites-list';
import { Settings } from './features/pages/mainAdmin/Settings/settings/settings';
import { UsersList } from './features/pages/mainAdmin/Users/users-list/users-list';
import { BookingListComponent } from './features/pages/mainAdmin/Booking/booking-list/booking-list';
import { BookingConfirmedComponent } from './features/pages/mainAdmin/Booking/booking-confirmed/booking-confirmed';
import { BookingCancelledComponent } from './features/pages/mainAdmin/Booking/booking-cancelled/booking-cancelled';
import { BookingPendingComponent } from './features/pages/mainAdmin/Booking/booking-pending/booking-pending';
import { UserCreation } from './features/pages/mainAdmin/Users/user-creation/user-creation';
import { TourAgencyLayout } from './features/layout/tour-agency-layout/tour-agency-layout/tour-agency-layout';
import { tourAdminGuardGuard } from './core/guard/tour-admin-guard-guard';
import { loginRedirectGuard } from './core/guard/login-redirect-guard';
import { TourListForTourAgency } from './features/pages/TourAgency/tour-list-for-tour-agency/tour-list-for-tour-agency';
import { TourAgencyDashboard } from './features/pages/TourAgency/tour-agency-dashboard/tour-agency-dashboard';
import { TourAgencyTourCreation } from './features/pages/TourAgency/tour-agency-tour-creation/tour-agency-tour-creation';
import { TourAgencyReviews } from './features/pages/TourAgency/tour-agency-reviews/tour-agency-reviews';
import { TourAgencySettings } from './features/pages/TourAgency/tour-agency-settings/tour-agency-settings';
import { TourAgencyBookingList } from './features/pages/TourAgency/tour-agency-booking-list/tour-agency-booking-list';
import { TourAgencyBookingConfirmed } from './features/pages/TourAgency/tour-agency-booking-confirmed/tour-agency-booking-confirmed';
import { TourAgencyBookingCancelled } from './features/pages/TourAgency/tour-agency-booking-cancelled/tour-agency-booking-cancelled';
import { TourAgencyBookingPending } from './features/pages/TourAgency/tour-agency-booking-pending/tour-agency-booking-pending';
import { TourEdit } from './features/pages/TourAgency/tour-edit/tour-edit';
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
import { flightAdminGuardGuard } from './core/guard/flight-admin-guard-guard';
import { CarRentalEditComponent } from './features/pages/mainAdmin/CarRental-Agency/car-rental-edit/car-rental-edit';
import { HotelComponent } from './features/pages/mainAdmin/favorites/hotel/hotel';
import { TourComponent } from './features/pages/mainAdmin/favorites/tour/tour';
import { HotelAgencyLayout } from './features/layout/hotel-agency-layout/hotel-agency-layout';
import { hotelAdminGuard } from './core/guard/hotel-admin-guard';
import { HotelAgencyDashboard } from './features/pages/HotelAgency/hotel-agency-dashboard/hotel-agency-dashboard';
import { HotelAgencyRoomList } from './features/pages/HotelAgency/hotel-agency-room-list/hotel-agency-room-list';
import { HotelAgencyRoomCreation } from './features/pages/HotelAgency/hotel-agency-room-creation/hotel-agency-room-creation';
import { HotelAgencyRoomEdit } from './features/pages/HotelAgency/hotel-agency-room-edit/hotel-agency-room-edit';
import { HotelAgencyBookingCancell } from './features/pages/HotelAgency/hotel-agency-booking-cancell/hotel-agency-booking-cancell';
import { HotelAgencyBookingConfirm } from './features/pages/HotelAgency/hotel-agency-booking-confirm/hotel-agency-booking-confirm';
import { HotelAgencyBookingList } from './features/pages/HotelAgency/hotel-agency-booking-list/hotel-agency-booking-list';
import { HotelAgencyBookingPending } from './features/pages/HotelAgency/hotel-agency-booking-pending/hotel-agency-booking-pending';
import { HotelAgencyReviews } from './features/pages/HotelAgency/hotel-agency-reviews/hotel-agency-reviews';
import { HotelAgencySettings } from './features/pages/HotelAgency/hotel-agency-settings/hotel-agency-settings';
import { CarRentalAgencyBookingConfirmed } from './features/pages/CarRentalAgency/car-rental-agency-booking-confirmed/car-rental-agency-booking-confirmed';
import { CarRentalAgencyBookingCancelled } from './features/pages/CarRentalAgency/car-rental-agency-booking-cancelled/car-rental-agency-booking-cancelled';
import { TourAgencyWishlist } from './features/pages/TourAgency/tour-agency-wishlist/tour-agency-wishlist';
import { CarRentalAgencyBookingList } from './features/pages/CarRentalAgency/car-rental-agency-booking-list/car-rental-agency-booking-list';
import { CarRentalAgencyBookingPending } from './features/pages/CarRentalAgency/car-rental-agency-booking-pending/car-rental-agency-booking-pending';
import { CarRentalAgencyCarCreation } from './features/pages/CarRentalAgency/car-rental-agency-car-creation/car-rental-agency-car-creation';
import { CarRentalAgencyCarList } from './features/pages/CarRentalAgency/car-rental-agency-car-list/car-rental-agency-car-list';
import { CarRentalAgencyDashboard } from './features/pages/CarRentalAgency/car-rental-agency-dashboard/car-rental-agency-dashboard';
import { CarRentalAgencyReviews } from './features/pages/CarRentalAgency/car-rental-agency-reviews/car-rental-agency-reviews';
import { CarRentalAgencySettings } from './features/pages/CarRentalAgency/car-rental-agency-settings/car-rental-agency-settings';
import { CarRentalAgencyCarEdit } from './features/pages/CarRentalAgency/car-rental-agency-car-edit/car-rental-agency-car-edit';
import { CarRentalAgencyLayout } from './features/layout/car-rental-agency-layout/car-rental-agency-layout';
import { carRentalAdminGuard } from './core/guard/car-rental-admin-guard';

export const routes: Routes = [
  // Login route
  { path: 'login', component: Login, canActivate: [loginRedirectGuard] },

  // Super Admin: /admin/...
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

  // Tour Admin: /tour-admin/...
  {
    path: 'tour-admin',
    component: TourAgencyLayout,
    canActivateChild: [tourAdminGuardGuard],
    children: [
      { path: 'dashboard', component: TourAgencyDashboard },
      { path: 'tours', component: TourListForTourAgency },
      { path: 'tours/create', component: TourAgencyTourCreation },
      { path: 'edit-tour/:id', component: TourEdit },
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
      { path: 'edit-flight/:id', component: FlightAgencyFlightEdit },
      { path: 'reviews', component: FlightAgencyReviews },
      { path: 'settings', component: FlightAgencySettings },
      { path: 'booking', component: FlightAgencyBookingList },
      { path: 'booking/confirmed', component: FlightAgencyBookingConfirmed },
      { path: 'booking/cancelled', component: FlightAgencyBookingCancelled },
      { path: 'booking/pending', component: FlightAgencyBookingPending },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  {
    path: 'hotel-admin',
    component: HotelAgencyLayout,
    canActivateChild: [hotelAdminGuard],
    children: [
      { path: 'dashboard', component: HotelAgencyDashboard },
      { path: 'Rooms', component: HotelAgencyRoomList },
      { path: 'Room/create', component: HotelAgencyRoomCreation },
      { path: 'edit-Room/:id', component: HotelAgencyRoomEdit },
      { path: 'reviews', component: HotelAgencyReviews },
      { path: 'settings', component: HotelAgencySettings },
      { path: 'booking', component: HotelAgencyBookingList },
      { path: 'booking/confirmed', component: HotelAgencyBookingConfirm },
      { path: 'booking/cancelled', component: HotelAgencyBookingCancell },
      { path: 'booking/pending', component: HotelAgencyBookingPending },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  {
    path: 'car-admin',
    component: CarRentalAgencyLayout,
    canActivateChild: [carRentalAdminGuard],
    children: [
      { path: 'dashboard', component: CarRentalAgencyDashboard },
      { path: 'Cars', component: CarRentalAgencyCarList },
      { path: 'Car/create', component: CarRentalAgencyCarCreation },
      { path: 'edit-Car/:id', component: CarRentalAgencyCarEdit },
      { path: 'reviews', component: CarRentalAgencyReviews },
      { path: 'settings', component: CarRentalAgencySettings },
      { path: 'booking', component: CarRentalAgencyBookingList },
      { path: 'booking/confirmed', component: CarRentalAgencyBookingConfirmed },
      { path: 'booking/cancelled', component: CarRentalAgencyBookingCancelled },
      { path: 'booking/pending', component: CarRentalAgencyBookingPending },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];