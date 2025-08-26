import { Component, inject, OnInit, signal } from '@angular/core';
import { TourService } from '../../../../core/services/tour-service';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ITourStats } from '../../../../shared/Interfaces/i-tour';

// Recent activity interface
interface RecentActivity {
  id: number;
  type: 'booking' | 'tour_created' | 'tour_updated';
  description: string;
  timestamp: Date;
  status: 'success' | 'pending' | 'cancelled';
}

@Component({
  selector: 'app-tour-agency-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './tour-agency-dashboard.html',
  styleUrl: './tour-agency-dashboard.css'
})
export class TourAgencyDashboardComponent implements OnInit {
  // State signals
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  stats = signal<ITourStats | null>(null);

  // Chart data for display
  chartLabels = signal<string[]>([]);
  chartData = signal<number[]>([]);

  // Recent activities (from backend)
  recentActivities = signal<RecentActivity[]>([]);

  private tourService = inject(TourService);

  ngOnInit(): void {
    this.loadDashboardData();
  }

 loadDashboardData(): void {
  this.loading.set(true);
  this.error.set(null);

  this.tourService.getDashboardStats().pipe(
    finalize(() => this.loading.set(false))
  ).subscribe({
    next: (data: ITourStats) => {  // ✅ Fixed: named parameter
      this.stats.set(data);
      this.processChartData(data.bookingsChart || []);

      // Map backend recentBookings to frontend RecentActivity
      const activities = (data as any).recentBookings?.map((booking: any) => ({
        id: booking.id,
        type: 'booking' as const,
        description: `New booking for ${booking.tourName}`,
        timestamp: new Date(booking.bookingDate),
        status: booking.status === 'Confirmed' ? 'success' : 'cancelled'
      })) || [];

      this.recentActivities.set(activities);
    },
    error: (err: any) => {
      console.error('Error loading tour dashboard data:', err);
      this.error.set('Failed to load tour dashboard data. Please try again.');
    }
  });
}

 private processChartData(chartData: { date: string; count: number }[]): void {
  if (!chartData || chartData.length === 0) {
    this.chartLabels.set(['No Data']);
    this.chartData.set([0]);
    return;
  }

  const today = new Date();
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate() - 6 + i
    ));
    return d.toISOString().split('T')[0]; // → "2025-08-25"
  });

  // ✅ Map backend data by date
  const dataMap = new Map(chartData.map(item => [item.date, item.count]));

  const labels = dates.map(date => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const data = dates.map(date => dataMap.get(date) || 0);

  this.chartLabels.set(labels);
  this.chartData.set(data);
}
  refreshDashboard(): void {
    this.loadDashboardData();
  }

  formatRelativeTime(timestamp: Date): string {
    const now = new Date();
    const target = new Date(timestamp);
    const diffMs = now.getTime() - target.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs < 0) {
      const futureMins = Math.abs(diffMins);
      const futureHours = Math.abs(diffHours);
      if (futureHours > 0) {
        return `In ${futureHours} hour${futureHours > 1 ? 's' : ''}`;
      } else {
        return `In ${futureMins} minute${futureMins > 1 ? 's' : ''}`;
      }
    }

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    }
  }

  getMaxValue(): number {
    const data = this.chartData();
    const max = Math.max(...data);
    return max > 0 ? max : 1;
  }

  getPercentage(value: number): number {
    const max = this.getMaxValue();
    const percentage = (value / max) * 100;
    return percentage < 1 ? 1 : percentage; // Ensures min visibility
  }

  formatCurrency(amount: number): string {
    if (!amount) return 'E£0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getActivityBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'success': return 'bg-success bg-opacity-10 text-success';
      case 'confirmed': return 'bg-success bg-opacity-10 text-success';
      case 'cancelled': return 'bg-danger bg-opacity-10 text-danger';
      case 'pending': return 'bg-warning bg-opacity-10 text-warning';
      case 'failed': return 'bg-danger bg-opacity-10 text-danger';
      default: return 'bg-primary bg-opacity-10 text-primary';
    }
  }

  onChartBarClick(index: number, value: number): void {
    const label = this.chartLabels()[index];
    console.log(`Clicked on ${label}: ${value} bookings`);
  }

  openSettings(): void {
    console.log('Opening tour settings...');
  }
}