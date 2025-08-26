import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingDto, BookingService, Status, BookingType } from '../../../../core/services/booking-services';
import { CarRentalService, DashboardStats } from '../../../../core/services/CarRental-Services';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-car-rental-agency-booking-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './car-rental-agency-booking-list.html',
  styleUrls: ['./car-rental-agency-booking-list.css']
})
export class CarRentalAgencyBookingList implements OnInit {
  bookings: BookingDto[] = [];
  filteredBookings: BookingDto[] = [];
  loading = true;
  error = '';
  windowRef = window;
  
  // Filter properties
  statusFilter = '';
  searchTerm = '';
  dateFilter = '';
  
  // Statistics
  stats = {
    totalBookings: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    totalRevenue: 0
  };

  // Enums for template
  Status = Status;
  BookingType = BookingType;

  constructor(
    private bookingService: BookingService,
    private carRentalService: CarRentalService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading = true;
    this.error = '';
    
    const token = localStorage.getItem('authToken');
    if (!token) {
      this.error = 'Authentication token not found. Please login again.';
      this.loading = false;
      return;
    }

    console.log('Loading bookings for CarRentalAdmin...');
    
    const userCompanyId = this.getUserCompanyId();
    if (!userCompanyId) {
      this.error = 'CarRentalCompanyId not found in token.';
      this.loading = false;
      return;
    }

    // Since the dedicated endpoint returns empty but we know there's data,
    // let's use the fallback method that we know works
    console.log('Using getAllBookings with frontend filtering...');
    this.fallbackToAllBookings(userCompanyId);
  }

  private fallbackToAllBookings(userCompanyId: number): void {
    this.bookingService.getAllBookings().subscribe({
      next: (allBookings) => {
        console.log('All bookings received:', allBookings);
        
        // Filter car bookings for the current company
        const carBookings = allBookings.filter(booking => {
          const isCarBooking = booking.bookingType === BookingType.Car;
          const hasAgencyDetails = booking.agencyDetails && booking.agencyDetails.rentalCompanyId;
          const isMyCompany = hasAgencyDetails && booking.agencyDetails.rentalCompanyId === userCompanyId;
          
          console.log(`Booking ${booking.id}: Car=${isCarBooking}, HasDetails=${!!hasAgencyDetails}, MyCompany=${isMyCompany}`);
          if (hasAgencyDetails) {
            console.log(`Booking ${booking.id} Company ID:`, booking.agencyDetails.rentalCompanyId);
          }
          
          return isCarBooking && isMyCompany;
        });
        
        console.log(`Filtered car bookings for company ${userCompanyId}:`, carBookings);
        this.processBookings(carBookings);
      },
      error: (err) => {
        console.error('Error loading bookings:', err);
        this.handleError(err);
      }
    });
  }

  private processBookings(bookings: BookingDto[]): void {
    this.bookings = bookings;
    this.filteredBookings = [...bookings];
    this.calculateStats();
    this.loading = false;
    this.cdr.detectChanges();
  }

  private handleError(err: any): void {
    if (err.status === 401) {
      this.error = 'Authentication failed. Please login again.';
    } else if (err.status === 403) {
      this.error = 'Access denied. You may not have CarRentalAdmin permissions.';
    } else if (err.status === 404) {
      this.error = 'API endpoint not found. Please check the server configuration.';
    } else if (err.status === 0) {
      this.error = 'Cannot connect to server. Please check your internet connection.';
    } else {
      this.error = `Failed to load bookings. Error: ${err.status} - ${err.message || 'Unknown error'}`;
    }
    
    this.loading = false;
    this.cdr.detectChanges();
  }

  private getUserCompanyId(): number | null {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const companyId = payload.CarRentalCompanyId ? parseInt(payload.CarRentalCompanyId) : null;
      console.log('Extracted Company ID from token:', companyId);
      return companyId;
    } catch (e) {
      console.error('Error parsing token:', e);
      return null;
    }
  }

  calculateStats(): void {
    this.stats.totalBookings = this.bookings.length;
    this.stats.confirmedBookings = this.bookings.filter(b => 
      this.bookingService.mapStatus(b.status) === Status.Confirmed
    ).length;
    this.stats.pendingBookings = this.bookings.filter(b => 
      this.bookingService.mapStatus(b.status) === Status.Pending
    ).length;
    this.stats.totalRevenue = this.bookings
      .filter(b => this.bookingService.mapStatus(b.status) === Status.Confirmed)
      .reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
  }

  applyFilters(): void {
    this.filteredBookings = this.bookings.filter(booking => {
      const matchesStatus = !this.statusFilter || 
        this.bookingService.mapStatus(booking.status).toString() === this.statusFilter;
      
      const matchesSearch = !this.searchTerm || 
        booking.customerEmail.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (booking.agencyDetails?.model || '').toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesDate = !this.dateFilter || 
        new Date(booking.startDate).toDateString() === new Date(this.dateFilter).toDateString();

      return matchesStatus && matchesSearch && matchesDate;
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.statusFilter = '';
    this.searchTerm = '';
    this.dateFilter = '';
    this.filteredBookings = [...this.bookings];
  }

  confirmBooking(bookingId: number): void {
    if (confirm('Are you sure you want to confirm this booking?')) {
      this.bookingService.confirmBooking(bookingId).subscribe({
        next: () => {
          this.loadBookings(); // Reload to get updated data
        },
        error: (err) => {
          alert('Failed to confirm booking. Please try again.');
          console.error('Error confirming booking:', err);
        }
      });
    }
  }

  cancelBooking(bookingId: number): void {
    if (confirm('Are you sure you want to cancel this booking?')) {
      this.bookingService.cancelBooking(bookingId).subscribe({
        next: () => {
          this.loadBookings(); // Reload to get updated data
        },
        error: (err) => {
          alert('Failed to cancel booking. Please try again.');
          console.error('Error canceling booking:', err);
        }
      });
    }
  }

  getStatusBadgeClass(status: string): string {
    const mappedStatus = this.bookingService.mapStatus(status);
    return this.bookingService.getStatusClass(mappedStatus);
  }

  getStatusLabel(status: string): string {
    const mappedStatus = this.bookingService.mapStatus(status);
    return this.bookingService.getStatusLabel(mappedStatus);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  canConfirm(booking: BookingDto): boolean {
    return this.bookingService.mapStatus(booking.status) === Status.Pending;
  }

  canCancel(booking: BookingDto): boolean {
    const status = this.bookingService.mapStatus(booking.status);
    return status === Status.Confirmed || status === Status.Pending;
  }

  exportBookings(): void {
    const csvData = this.filteredBookings.map(booking => ({
      'Booking ID': booking.id,
      'Customer Email': booking.customerEmail,
      'Car Model': booking.agencyDetails?.model || 'N/A',
      'Start Date': this.formatDate(booking.startDate),
      'End Date': this.formatDate(booking.endDate),
      'Total Price': booking.totalPrice || 0,
      'Status': this.getStatusLabel(booking.status)
    }));

    const csv = this.convertToCSV(csvData);
    this.downloadCSV(csv, 'car-rental-bookings.csv');
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvArray = [headers.join(',')];
    
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      });
      csvArray.push(values.join(','));
    });
    
    return csvArray.join('\n');
  }

  private downloadCSV(csv: string, filename: string): void {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  trackByBookingId(index: number, booking: BookingDto): number {
    return booking.id;
  }

  // Debug methods
  checkToken(): void {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Full token payload:', payload);
        console.log('CarRentalCompanyId claim:', payload.CarRentalCompanyId);
        console.log('User roles:', payload.role);
        console.log('User ID:', payload.uid);
      } catch (e) {
        console.error('Error parsing token:', e);
      }
    }
  }

  testGetAllBookings(): void {
    this.bookingService.getAllBookings().subscribe({
      next: (data) => {
        console.log('All bookings:', data);
        const carBookings = data.filter(b => b.bookingType === BookingType.Car);
        console.log('Car bookings:', carBookings);
        
        carBookings.forEach(booking => {
          console.log(`Booking ID: ${booking.id}`);
          console.log(`Customer: ${booking.customerEmail}`);
          console.log(`AgencyDetails:`, booking.agencyDetails);
          console.log(`Company ID:`, booking.agencyDetails?.rentalCompanyId);
          console.log('---');
        });
      },
      error: (err) => console.error('Error:', err)
    });
  }

  // Test method to check if you can see bookings for other companies
  testWithDifferentCompanyId(): void {
    // Test with the company IDs that actually have bookings (4 and 6)
    console.log('Testing with company ID 4:');
    this.bookingService.getAllBookings().subscribe({
      next: (data) => {
        const company4Bookings = data.filter(b => 
          b.bookingType === BookingType.Car && 
          b.agencyDetails?.rentalCompanyId === 4
        );
        console.log('Company 4 bookings:', company4Bookings);
        
        const company6Bookings = data.filter(b => 
          b.bookingType === BookingType.Car && 
          b.agencyDetails?.rentalCompanyId === 6
        );
        console.log('Company 6 bookings:', company6Bookings);
      }
    });
  }
}