import { Component, inject, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { HotelDashboardStats } from '../../../../shared/Interfaces/ihotel';
import { HotelService } from '../../../../core/services/hotel-service';
import { finalize } from 'rxjs';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

interface RecentActivity {
  id: number;
  type: 'booking' | 'Room_created' | 'Room_updated';
  description: string;
  timestamp: Date;
  status: 'success' | 'pending' | 'cancelled';
}

@Component({
  selector: 'app-hotel-agency-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './hotel-agency-dashboard.html',
  styleUrl: './hotel-agency-dashboard.css'
})
export class HotelAgencyDashboard implements OnInit {
  // State signals
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  stats = signal<HotelDashboardStats | null>(null);

  // Chart data for display
  chartLabels = signal<string[]>([]);
  chartData = signal<number[]>([]);

  // Mock recent activities (replace with real data when available)
  recentActivities = signal<RecentActivity[]>([]);

  private hotelService = inject(HotelService);
  private cd = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading.set(true);
    this.error.set(null);
    this.cd.detectChanges(); // Force UI update

    const startTime = Date.now();

    this.hotelService.getDashboardStats().pipe(
      finalize(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(1000 - elapsed, 0);

        setTimeout(() => {
          this.loading.set(false);
          this.cd.detectChanges();
        }, remaining);
      })
    ).subscribe({
      next: (data) => {
        this.stats.set(data);
        this.processChartData(data.bookingChart);
      },
      error: (err) => {
        this.error.set('Failed to load dashboard data. Please try again.');
      }
    });
  }

  private processChartData(chartData: { date: string; count: number }[]): void {
    const labels = chartData.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const data = chartData.map(item => item.count);

    this.chartLabels.set(labels);
    this.chartData.set(data);
  }

  refreshDashboard(): void {
    this.loadDashboardData();
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'booking': return 'bi-ticket-perforated';
      case 'Room_created': return 'bi-building';
      case 'Room_updated': return 'bi-pencil-square';
      default: return 'bi-info-circle';
    }
  }

  getActivityColor(status: string): string {
    switch (status) {
      case 'success': return 'text-success';
      case 'pending': return 'text-warning';
      case 'cancelled': return 'text-danger';
      default: return 'text-muted';
    }
  }

  formatRelativeTime(timestamp: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return `${diffDays} days ago`;
    }
  }

  getMaxValue(): number {
    return Math.max(...this.chartData());
  }

  getPercentage(value: number): number {
    return (value / this.getMaxValue()) * 100;
  }

  formatCurrency(amount: number): string {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getActivityTextColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'success': return 'text-success';
      case 'confirmed': return 'text-success';
      case 'cancelled': return 'text-danger';
      case 'pending': return 'text-warning';
      case 'failed': return 'text-danger';
      default: return 'text-primary';
    }
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
    console.log(`Clicked on ${label}: $${value}`);
  }

  animateCounters(): void {
    const counters = document.querySelectorAll('.counter');
    counters.forEach(counter => {
      const target = parseInt(counter.textContent?.replace(/[^0-9]/g, '') || '0');
      const increment = target / 100;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          counter.textContent = target.toLocaleString();
          clearInterval(timer);
        } else {
          counter.textContent = Math.floor(current).toLocaleString();
        }
      }, 20);
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.animateCounters(), 500);
    this.initializeTooltips();
  }

  private initializeTooltips(): void {
    const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(tooltipTriggerEl => {
      new (window as any).bootstrap.Tooltip(tooltipTriggerEl);
    });
  }

  openSettings(): void {
    console.log('Opening settings...');
  }
}