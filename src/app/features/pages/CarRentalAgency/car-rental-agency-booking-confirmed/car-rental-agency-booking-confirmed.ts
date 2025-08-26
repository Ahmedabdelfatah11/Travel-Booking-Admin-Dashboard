import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CarRentalService, DashboardStats } from '../../../../core/services/CarRental-Services';
import { BookingDto, BookingService, Status, BookingType } from '../../../../core/services/booking-services';
import { CarService } from '../../../../core/services/Car-Services';

@Component({
  selector: 'app-car-rental-agency-booking-confirmed',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './car-rental-agency-booking-confirmed.html',
  styleUrls: ['./car-rental-agency-booking-confirmed.css']
})
export class CarRentalAgencyBookingConfirmed implements OnInit {
  confirmedBookings: BookingDto[] = [];
  filteredBookings: BookingDto[] = [];
  loading = true;
  error = '';
  
  // Filter properties
  searchTerm = '';
  dateFilter = '';
  sortBy = 'newest';
  
  // Statistics
  stats = {
    totalConfirmed: 0,
    totalRevenue: 0,
    averageBookingValue: 0,
    thisMonthBookings: 0
  };

  constructor(
    private bookingService: BookingService,
    private carRentalService: CarRentalService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadConfirmedBookings();
  }

  loadConfirmedBookings(): void {
    this.loading = true;
    this.error = '';

    const userCompanyId = this.getUserCompanyId();
    if (!userCompanyId) {
      this.error = 'CarRentalCompanyId not found in token.';
      this.loading = false;
      return;
    }

    this.bookingService.getAllBookings().subscribe({
      next: (allBookings) => {
        const confirmedCarBookings = allBookings.filter(booking => {
          const isCarBooking = booking.bookingType === BookingType.Car;
          const isConfirmed = this.bookingService.mapStatus(booking.status) === Status.Confirmed;
          const isMyCompany = booking.agencyDetails?.rentalCompanyId === userCompanyId;
          
          return isCarBooking && isConfirmed && isMyCompany;
        });
        
        this.confirmedBookings = confirmedCarBookings;
        this.filteredBookings = [...confirmedCarBookings];
        this.calculateStats();
        this.applySorting();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.handleError(err);
      }
    });
  }

  private getUserCompanyId(): number | null {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.CarRentalCompanyId ? parseInt(payload.CarRentalCompanyId) : null;
    } catch (e) {
      console.error('Error parsing token:', e);
      return null;
    }
  }

  private handleError(err: any): void {
    if (err.status === 401) {
      this.error = 'Authentication failed. Please login again.';
    } else if (err.status === 403) {
      this.error = 'Access denied. You may not have CarRentalAdmin permissions.';
    } else {
      this.error = `Failed to load confirmed bookings. Error: ${err.status} - ${err.message || 'Unknown error'}`;
    }
    
    this.loading = false;
    this.cdr.detectChanges();
  }

  calculateStats(): void {
    this.stats.totalConfirmed = this.confirmedBookings.length;
    this.stats.totalRevenue = this.confirmedBookings.reduce((sum, booking) => 
      sum + (booking.totalPrice || 0), 0
    );
    this.stats.averageBookingValue = this.stats.totalConfirmed > 0 
      ? this.stats.totalRevenue / this.stats.totalConfirmed 
      : 0;
    
    const currentMonth = new Date().getMonth();
    this.stats.thisMonthBookings = this.confirmedBookings.filter(booking => 
      new Date(booking.startDate).getMonth() === currentMonth
    ).length;
  }

  applyFilters(): void {
    this.filteredBookings = this.confirmedBookings.filter(booking => {
      const matchesSearch = !this.searchTerm || 
        booking.customerEmail.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (booking.agencyDetails?.model || '').toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesDate = !this.dateFilter || 
        new Date(booking.startDate).toDateString() === new Date(this.dateFilter).toDateString();

      return matchesSearch && matchesDate;
    });
    
    this.applySorting();
  }

  applySorting(): void {
    this.filteredBookings.sort((a, b) => {
      switch (this.sortBy) {
        case 'newest':
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        case 'oldest':
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        case 'highest-value':
          return (b.totalPrice || 0) - (a.totalPrice || 0);
        case 'lowest-value':
          return (a.totalPrice || 0) - (b.totalPrice || 0);
        default:
          return 0;
      }
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.dateFilter = '';
    this.sortBy = 'newest';
    this.filteredBookings = [...this.confirmedBookings];
    this.applySorting();
  }

  cancelBooking(bookingId: number): void {
    if (confirm('Are you sure you want to cancel this confirmed booking? This action may require customer notification.')) {
      this.bookingService.cancelBooking(bookingId).subscribe({
        next: () => {
          this.loadConfirmedBookings();
        },
        error: (err) => {
          alert('Failed to cancel booking. Please try again.');
          console.error('Error canceling booking:', err);
        }
      });
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  trackByBookingId(index: number, booking: BookingDto): number {
    return booking.id;
  }

  exportConfirmedBookings(): void {
    const csvData = this.filteredBookings.map(booking => ({
      'Booking ID': booking.id,
      'Customer Email': booking.customerEmail,
      'Car Model': booking.agencyDetails?.model || 'N/A',
      'Start Date': this.formatDate(booking.startDate),
      'End Date': this.formatDate(booking.endDate),
      'Total Price': booking.totalPrice || 0,
      'Location': booking.agencyDetails?.location || 'N/A'
    }));

    const csv = this.convertToCSV(csvData);
    this.downloadCSV(csv, 'confirmed-car-bookings.csv');
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
}

