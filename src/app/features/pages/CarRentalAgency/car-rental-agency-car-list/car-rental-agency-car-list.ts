import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Car, CarService, Pagination } from '../../../../core/services/Car-Services';
import { CarRentalService, CarRentalCompany } from '../../../../core/services/CarRental-Services';

@Component({
  selector: 'app-car-rental-agency-car-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './car-rental-agency-car-list.html',
  styleUrls: ['./car-rental-agency-car-list.css']
})
export class CarRentalAgencyCarList implements OnInit {
  cars: Car[] = [];
  loading = false;
  error = '';
  searchTerm = '';
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalItems = 0;
  sortBy = 'model';
  minValue!: number;
  userCompanyId?: number;

  constructor(
    private carService: CarService,
    private router: Router,
    private carRentalService: CarRentalService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUserCompanyAndCars();
  }

  loadUserCompanyAndCars(): void {
    this.loading = true;
    this.carRentalService.getMyCompanies().subscribe({
      next: (companies: CarRentalCompany[]) => {
        if (companies && companies.length > 0) {
          this.userCompanyId = companies[0].id;
          this.loadCars();
        } else {
          this.error = 'No company found for current user.';
          this.loading = false;
          this.cd.detectChanges();
        }
      },
      error: (error: any) => {
        this.error = 'Failed to load user company information.';
        this.loading = false;
        console.error('Error loading company:', error);
        this.cd.detectChanges();
      }
    });
  }

  loadCars(): void {
    this.loading = true;
    this.error = '';
    
    const params = {
      pageIndex: this.currentPage,
      pageSize: this.pageSize,
      search: this.searchTerm || undefined,
      sort: this.sortBy,
      rentalCompanyId: this.userCompanyId
    };

    this.carService.getCars(params).subscribe({
      next: (response: Pagination<Car>) => {
        this.cars = response.data;
        this.totalItems = response.count;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        this.minValue = Math.min(this.currentPage * this.pageSize, this.totalItems);
        this.loading = false;
        this.cd.detectChanges();
      },
      error: (error: any) => {
        this.error = 'Failed to load cars. Please try again.';
        this.loading = false;
        console.error('Error loading cars:', error);
        this.cd.detectChanges();
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadCars();
  }

  onSort(field: string): void {
    this.sortBy = field;
    this.loadCars();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadCars();
  }

  editCar(carId: number): void {
    this.router.navigate(['/car-admin/edit-Car', carId]);
  }

  CreateCar(): void {
    this.router.navigate(['/car-admin/Car/create']);
  }

  deleteCar(car: Car): void {
    if (confirm(`Are you sure you want to delete ${car.model}?`)) {
      this.carService.deleteCar(car.id).subscribe({
        next: () => {
          this.loadCars();
        },
        error: (error: any) => {
          this.error = 'Failed to delete car. Please try again.';
          console.error('Error deleting car:', error);
          this.cd.detectChanges();
        }
      });
    }
  }

  toggleAvailability(car: Car): void {
    if (!this.userCompanyId) {
      this.error = 'Unable to update car. Company information not found.';
      return;
    }

    const updatedCar = {
      model: car.model,
      price: car.price,
      description: car.description,
      isAvailable: !car.isAvailable,
      location: car.location,
      capacity: car.capacity,
      rentalCompanyId: this.userCompanyId
    };

    this.carService.updateCar(car.id, updatedCar).subscribe({
      next: () => {
        car.isAvailable = !car.isAvailable;
        this.cd.detectChanges();
      },
      error: (error: any) => {
        this.error = 'Failed to update car availability.';
        console.error('Error updating car:', error);
        this.cd.detectChanges();
      }
    });
  }

  getStatusBadgeClass(isAvailable: boolean): string {
    return isAvailable ? 'badge bg-success' : 'badge bg-danger';
  }

  getStatusText(isAvailable: boolean): string {
    return isAvailable ? 'Available' : 'Unavailable';
  }

  getPaginationPages(): number[] {
    const pages: number[] = [];
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(this.totalPages, this.currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }
}