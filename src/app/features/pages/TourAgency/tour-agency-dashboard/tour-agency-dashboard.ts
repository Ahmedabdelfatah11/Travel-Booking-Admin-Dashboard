import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TourService } from '../../../../core/services/tour-service';
import { ITourStats } from '../../../../shared/Interfaces/i-tour';
import { finalize, Subject, takeUntil } from 'rxjs';

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
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './tour-agency-dashboard.html',
  styleUrl: './tour-agency-dashboard.css'
})
export class TourAgencyDashboardComponent implements OnInit, OnDestroy {
  // State
  isLoading = false;
error = signal<string | null>(null);
stats = signal<ITourStats | null>(null);
  // Data
  chartLabels: string[] = [];
  chartData: number[] = [];
  recentActivities: RecentActivity[] = [];

  // Services
  private tourService = inject(TourService);
  private cd = inject(ChangeDetectorRef);

  // Cleanup
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // === Data Loading ===
  loadDashboardData(): void {
    this.isLoading = true;
     this.error.set(null);

    // Capture start time for minimum 1s loading
    const startTime = Date.now();

    this.tourService.getDashboardStats().pipe(
      takeUntil(this.destroy$),
      finalize(async () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(1000 - elapsed, 0); // Minimum 1 second

        // Wait remaining time
        await new Promise(resolve => setTimeout(resolve, remaining));

        this.isLoading = false;
        this.cd.detectChanges(); // Force UI update
      })
    ).subscribe({
      next: (data: ITourStats) => {
        this.stats.set(data)
        this.processChartData(data.bookingsChart || []);

        // Map recent bookings to activity feed
        const activities = (data as any).recentBookings?.map((booking: any) => ({
          id: booking.id,
          type: 'booking' as const,
          description: `New booking for ${booking.tourName}`,
          timestamp: new Date(booking.bookingDate),
          status: booking.status === 'Confirmed' ? 'success' : 'cancelled'
        })) || [];

        this.recentActivities = activities;
        this.cd.detectChanges();
      },
      error: (err) => {
        this.error.set('Failed to load tour dashboard data. Please try again.'); 
        this.cd.detectChanges();
      }
    });
  }

  refreshDashboard(): void {
    this.loadDashboardData();
  }

  // === Chart Processing ===
  private processChartData(chartData: { date: string; count: number }[]): void {
    if (!chartData || chartData.length === 0) {
      this.chartLabels = ['No Data'];
      this.chartData = [0];
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

    const dataMap = new Map(chartData.map(item => [item.date, item.count]));

    this.chartLabels = dates.map(date => {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    this.chartData = dates.map(date => dataMap.get(date) || 0);
  }

  // === Utility Methods ===
  getMaxValue(): number {
    const max = Math.max(...this.chartData);
    return max > 0 ? max : 1;
  }

  getPercentage(value: number): number {
    const max = this.getMaxValue();
    const percentage = (value / max) * 100;
    return percentage < 1 ? 1 : percentage; // Ensures visibility
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
      return futureHours > 0
        ? `In ${futureHours} hour${futureHours > 1 ? 's' : ''}`
        : `In ${futureMins} minute${futureMins > 1 ? 's' : ''}`;
    }

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    }
  }

  getActivityBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'confirmed':
        return 'bg-success bg-opacity-10 text-success';
      case 'cancelled':
      case 'failed':
        return 'bg-danger bg-opacity-10 text-danger';
      case 'pending':
        return 'bg-warning bg-opacity-10 text-warning';
      default:
        return 'bg-primary bg-opacity-10 text-primary';
    }
  }

  onChartBarClick(index: number, value: number): void {
    const label = this.chartLabels[index];
    console.log('Chart bar clicked:', { label, value });
  }

  openSettings(): void {
    console.log('Opening settings...');
    // Add navigation or modal logic later
  }
}