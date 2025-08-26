import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { CarRentalCompany, CarRentalService, DashboardStats } from '../../../../core/services/CarRental-Services';

@Component({
  selector: 'app-car-rental-agency-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './car-rental-agency-dashboard.html',
  styleUrls: ['./car-rental-agency-dashboard.css']
})
export class CarRentalAgencyDashboard implements OnInit, OnDestroy {
  dashboardStats: DashboardStats | null = null;
  companies: CarRentalCompany[] = [];
  loading = true;
  error: string | null = null;
  chart: Chart | null = null;

  // Modal properties
  selectedCompany: CarRentalCompany | null = null;
  showEditModal = false;
  showDeleteModal = false;

  constructor(private carRentalService: CarRentalService, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadCompanies();
         this.cd.detectChanges();
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  loadDashboardData(): void {
    this.loading = true;
    this.carRentalService.getDashboardStats().subscribe({
      next: (stats) => {
        this.dashboardStats = stats;
        this.loading = false;
         this.cd.detectChanges();
        setTimeout(() => this.createChart(), 100);
      },
      error: (err) => {
        this.error = 'Failed to load dashboard data';
        this.loading = false;
        console.error(err);
         this.cd.detectChanges();
      }
    });
  }

  loadCompanies(): void {
    this.carRentalService.getMyCompanies().subscribe({
      next: (companies) => {
        this.companies = companies;
      },
      error: (err) => {
        this.error = 'Failed to load companies';
        console.error(err);
      }
    });
  }

  createChart(): void {
    if (!this.dashboardStats?.bookingsChart) return;

    const ctx = document.getElementById('bookingsChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.chart) {
      this.chart.destroy();
    }

    const labels = this.dashboardStats.bookingsChart.map(item => 
      new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );
    const data = this.dashboardStats.bookingsChart.map(item => item.count);

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Daily Bookings',
          data: data,
          borderColor: '#007bff',
          backgroundColor: 'rgba(0, 123, 255, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#007bff',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              color: '#6c757d',
              font: {
                size: 12
              }
            },
            grid: {
              color: 'rgba(0,0,0,0.1)'
            }
          },
          x: {
            ticks: {
              color: '#6c757d',
              font: {
                size: 12
              }
            },
            grid: {
              display: false
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  openEditModal(company: CarRentalCompany): void {
    this.selectedCompany = { ...company };
    this.showEditModal = true;
  }

  openDeleteModal(company: CarRentalCompany): void {
    this.selectedCompany = company;
    this.showDeleteModal = true;
  }

  closeModals(): void {
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.selectedCompany = null;
  }

  saveCompany(): void {
    if (!this.selectedCompany) return;

    this.carRentalService.updateCompany(this.selectedCompany.id, this.selectedCompany).subscribe({
      next: () => {
        this.loadCompanies();
        this.closeModals();
        this.error = null;
      },
      error: (err) => {
        this.error = 'Failed to update company';
        console.error(err);
      }
    });
  }

  deleteCompany(): void {
    if (!this.selectedCompany) return;

    this.carRentalService.deleteCompany(this.selectedCompany.id).subscribe({
      next: () => {
        this.loadCompanies();
        this.closeModals();
        this.error = null;
      },
      error: (err) => {
        this.error = 'Failed to delete company';
        console.error(err);
      }
    });
  }

  getRatingStars(rating: string): string[] {
    const numRating = parseFloat(rating) || 0;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= numRating) {
        stars.push('fa-star');
      } else if (i - 0.5 <= numRating) {
        stars.push('fa-star-half-alt');
      } else {
        stars.push('fa-star-o');
      }
    }
    return stars;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  refreshDashboard(): void {
    this.loadDashboardData();
    this.loadCompanies();
     this.cd.detectChanges();
  }
}