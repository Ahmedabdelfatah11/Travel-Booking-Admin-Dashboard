import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Car, CarService, Pagination } from '../../../../core/services/Car-Services';
import { CarRentalService, CarRentalCompany } from '../../../../core/services/CarRental-Services';

@Component({
  selector: 'app-car-rental-agency-car-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './car-rental-agency-car-list.html',
  styleUrls: ['./car-rental-agency-car-list.css']
})
export class CarRentalAgencyCarList implements OnInit, OnDestroy {
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
  myCompanies: CarRentalCompany[] = [];
  
  private subscription: Subscription = new Subscription();

  constructor(
    private carService: CarService,
    private router: Router,
    private carRentalService: CarRentalService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadMyCompaniesAndCars();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadMyCompaniesAndCars(): void {
    this.loading = true;
    this.error = '';
    this.cd.detectChanges(); // Force UI update to show loader

    const startTime = Date.now();

    this.subscription.add(
      this.carRentalService.getMyCompanies().subscribe({
        next: (companies: CarRentalCompany[]) => {
          this.myCompanies = companies;
          
          if (companies && companies.length > 0) {
            const savedCompanyId = this.carRentalService.getCurrentCompanyIdSync();
            const targetCompany = savedCompanyId 
              ? companies.find(c => c.id === savedCompanyId) || companies[0]
              : companies[0];
              
            this.userCompanyId = targetCompany.id;
            this.carRentalService.setCurrentCompanyId(this.userCompanyId);
            
            this.loadCompanyCars(startTime);
          } else {
            this.error = 'No companies found for current user.';
            this.finishLoading(startTime);
          }
        },
        error: (error: any) => {
          this.error = 'Failed to load company information.';
          this.finishLoading(startTime);
        }
      })
    );
  }

  loadCompanyCars(startTime: number): void {
    if (!this.userCompanyId) {
      this.error = 'Company ID not found.';
      this.finishLoading(startTime);
      return;
    }

    this.loading = true;
    this.error = '';
    this.cd.detectChanges();

    const params = {
      pageIndex: this.currentPage,
      pageSize: this.pageSize,
      search: this.searchTerm || undefined,
      sort: this.sortBy
    };

    this.subscription.add(
      this.carService.getCarsByCompanyFromMyCompanies(this.carRentalService, this.userCompanyId, params).subscribe({
        next: (response: Pagination<Car>) => {
          this.cars = response.data;
          this.totalItems = response.count;
          this.totalPages = Math.ceil(this.totalItems / this.pageSize);
          this.minValue = Math.min((this.currentPage * this.pageSize), this.totalItems);
          
          this.finishLoading(startTime);
        },
        error: (error: any) => {
          this.loadCompanyCarsOldWay(startTime);
        }
      })
    );
  }

  loadCompanyCarsOldWay(startTime: number): void {
    const params = {
      pageIndex: 1,
      pageSize: 1000,
      search: this.searchTerm || undefined,
      sort: this.sortBy,
      rentalCompanyId: this.userCompanyId
    };

    this.subscription.add(
      this.carService.getCars(params).subscribe({
        next: (response: Pagination<Car>) => {
          const allCompanyCars = response.data.filter(car => car.rentalCompanyId === this.userCompanyId);
          
          this.totalItems = allCompanyCars.length;
          this.totalPages = Math.ceil(this.totalItems / this.pageSize);
          
          const startIndex = (this.currentPage - 1) * this.pageSize;
          const endIndex = startIndex + this.pageSize;
          this.cars = allCompanyCars.slice(startIndex, endIndex);
          this.minValue = Math.min(endIndex, this.totalItems);
                    
          this.finishLoading(startTime);
        },
        error: (error: any) => {
          this.error = 'Failed to load cars. Please try again.';
          this.finishLoading(startTime);
        }
      })
    );
  }

  // === Helper: Enforce minimum 1-second loading ===
  private finishLoading(startTime: number): void {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(1000 - elapsed, 0);

    setTimeout(() => {
      this.loading = false;
      this.cd.detectChanges();
    }, remaining);
  }

  // === UI Actions ===
  onCompanyChange(companyId: number): void {
    if (companyId !== this.userCompanyId) {
      this.userCompanyId = companyId;
      this.carRentalService.setCurrentCompanyId(companyId);
      this.currentPage = 1;
      this.searchTerm = '';
      
      const startTime = Date.now();
      this.loadCompanyCars(startTime);
    }
  }

  onSearch(): void {
    this.currentPage = 1;
    const startTime = Date.now();
    this.loadCompanyCars(startTime);
  }

  onSort(field: string): void {
    this.sortBy = field;
    this.currentPage = 1;
    const startTime = Date.now();
    this.loadCompanyCars(startTime);
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    const startTime = Date.now();
    this.loadCompanyCars(startTime);
  }

  editCar(carId: number): void {
    this.router.navigate(['/car-admin/edit-Car', carId]);
  }

  CreateCar(): void {
    this.router.navigate(['/car-admin/Car/create']);
  }

  deleteCar(car: Car): void {
    if (!confirm(`Are you sure you want to delete ${car.model}?`)) return;

    if (car.rentalCompanyId !== this.userCompanyId) {
      this.error = 'You can only delete cars from your own company.';
      this.cd.detectChanges();
      return;
    }

    this.subscription.add(
      this.carService.deleteCar(car.id).subscribe({
        next: () => {
          const startTime = Date.now();
          this.loadCompanyCars(startTime);
        },
        error: (error: any) => {
          this.error = 'Failed to delete car. Please try again.';
          this.cd.detectChanges();
        }
      })
    );
  }

  toggleAvailability(car: Car): void {
    if (!this.userCompanyId || car.rentalCompanyId !== this.userCompanyId) {
      this.error = 'You can only update cars from your own company.';
      this.cd.detectChanges();
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

    this.subscription.add(
      this.carService.updateCar(car.id, updatedCar).subscribe({
        next: () => {
          car.isAvailable = !car.isAvailable;
          this.cd.detectChanges();
        },
        error: (error: any) => {
          this.error = 'Failed to update car availability.';
          this.cd.detectChanges();
        }
      })
    );
  }

  // === Utility Methods ===
  isCarFromMyCompany(car: Car): boolean {
    return car.rentalCompanyId === this.userCompanyId;
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

  refreshData(): void {
    this.currentPage = 1;
    this.searchTerm = '';
    this.sortBy = 'model';
    const startTime = Date.now();
    this.loadCompanyCars(startTime);
  }

  getCurrentCompanyName(): string {
    const company = this.myCompanies.find(c => c.id === this.userCompanyId);
    return company ? company.name : 'Unknown Company';
  }

  getCompanyCarStats(): string {
    if (!this.userCompanyId || this.cars.length === 0) return 'No cars found';

    const available = this.cars.filter(car => car.isAvailable).length;
    const unavailable = this.cars.length - available;
    
    return `${this.totalItems} total cars (${available} available on this page, ${unavailable} unavailable on this page)`;
  }

  hasWrongCompanyCars(): boolean {
    return this.cars.some(car => car.rentalCompanyId !== this.userCompanyId);
  }
}