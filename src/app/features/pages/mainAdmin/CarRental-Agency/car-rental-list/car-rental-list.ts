import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuperadminServices } from '../../../../../core/services/superadmin-services';
import { Router } from '@angular/router';

declare var bootstrap: any;

interface CarRentalCompany {
  id: number;
  name: string;
  description?: string;
  location: string;
  imageUrl?: string;
  rating?: string;
  adminId?: string;
  cars?: Car[];
}

interface Car {
  id: number;
  model: string;
  price: number;
  description: string;
  isAvailable: boolean;
  location: string;
  imageUrl?: string;
  capacity: number;
}

@Component({
  selector: 'app-car-rental-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './car-rental-list.html',
  styleUrl: './car-rental-list.css'
})
export class CarRentalListComponent implements OnInit {
  companies: CarRentalCompany[] = [];
  filteredCompanies: CarRentalCompany[] = [];
  selectedCompany: CarRentalCompany | null = null;
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  
  // Search and filter properties
  searchTerm = '';
  locationFilter = '';
  ratingFilter = '';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 6;
  totalItems = 0;
  totalPages = 0;

  // Modal state
  showDeleteModal = false;
  showViewModal = false; // Added view modal state
  companyToDelete: CarRentalCompany | null = null;

  constructor(
    private superadminService: SuperadminServices,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCarRentalCompanies();
     this.cd.detectChanges();
  }

  loadCarRentalCompanies(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.superadminService.getAllCarRentalCompanies().subscribe({
      next: (response: any) => {
        console.log('✅ Car rental companies loaded:', response);
        
        // Handle paginated response from CarRental API
        if (response.data && Array.isArray(response.data)) {
          // Extract the full company data from the paginated response
          this.companies = response.data.map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            location: item.location,
            imageUrl: item.imageUrl,
            rating: item.rating,
            adminId: item.adminId,
            cars: item.cars || []
          }));
          this.totalItems = response.count || response.data.length;
        } else if (Array.isArray(response)) {
          this.companies = response;
          this.totalItems = response.length;
        } else {
          this.companies = [];
          this.totalItems = 0;
        }
        
        this.applyFilters();
        this.isLoading = false;
         this.cd.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error loading car rental companies:', error);
        this.errorMessage = error.userMessage || 'Failed to load car rental companies';
        this.isLoading = false;
        this.companies = [];
         this.cd.detectChanges();
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.companies];

    // Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(company => 
        company.name.toLowerCase().includes(term) ||
        company.description?.toLowerCase().includes(term) ||
        company.location.toLowerCase().includes(term)

      );
    }

    // Location filter
    if (this.locationFilter.trim()) {
      const location = this.locationFilter.toLowerCase().trim();
      filtered = filtered.filter(company => 
        company.location.toLowerCase().includes(location)
      );
    }

    // Rating filter
    if (this.ratingFilter) {
      const rating = parseFloat(this.ratingFilter);
      filtered = filtered.filter(company => 
        company.rating && Number(company.rating) >= rating
      );
    }

    this.filteredCompanies = filtered;
    this.totalItems = filtered.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.locationFilter = '';
    this.ratingFilter = '';
    this.applyFilters();
     this.cd.detectChanges();
  }

  getPaginatedCompanies(): CarRentalCompany[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredCompanies.slice(startIndex, startIndex + this.itemsPerPage);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPaginationPages(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  createNew(): void {
    this.router.navigate(['car/create']);
  }

  // FIXED: View company function
  viewCompany(company: CarRentalCompany): void {
    this.selectedCompany = company;
    this.showViewModal = true;
    console.log('Viewing company:', company);
  }

  // FIXED: Edit company function
  editCompany(company: CarRentalCompany): void {
    console.log('Editing company with ID:', company.id);
     this.router.navigate(['/admin/car/edit', company.id]); 

  }

  confirmDelete(company: CarRentalCompany): void {
    this.companyToDelete = company;
    this.showDeleteModal = true;
  }

  deleteCompany(): void {
    if (this.companyToDelete) {
      this.superadminService.deleteCarRentalCompany(this.companyToDelete.id).subscribe({
        next: (response) => {
          console.log('✅ Car rental company deleted successfully');
          this.successMessage = 'Car rental company deleted successfully!';
          this.showDeleteModal = false;
          this.companyToDelete = null;
          this.loadCarRentalCompanies();
          
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error) => {
          console.error('❌ Error deleting car rental company:', error);
          this.errorMessage = error.userMessage || 'Failed to delete car rental company';
          this.showDeleteModal = false;
          this.companyToDelete = null;
        }
      });
    }
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.companyToDelete = null;
  }

  // Close view modal
  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedCompany = null;
  }

  getStarArray(rating: number | undefined): boolean[] {
    if (!rating) return [false, false, false, false, false];
    
    const stars: boolean[] = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating);
    }
    return stars;
  }

  refreshList(): void {
    this.clearFilters();
    this.loadCarRentalCompanies();
  }

  getDefaultImage(): string {
    return 'assets/images/default-car-company.jpg';
  }

  onImageError(event: any): void {
    event.target.src = this.getDefaultImage();
  }

  getCarCountText(company: CarRentalCompany): string {
    const count = company.cars?.length || 0;
    return count === 1 ? '1 car available' : `${count} cars available`;
  }

  getAvailableCarCount(company: CarRentalCompany): number {
    if (!company.cars) return 0;
    return company.cars.filter(car => car.isAvailable).length;
  }
}