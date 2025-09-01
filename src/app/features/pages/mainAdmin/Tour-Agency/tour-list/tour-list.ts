import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuperadminServices } from '../../../../../core/services/superadmin-services';
import { Router } from '@angular/router';

declare var bootstrap: any;

interface TourCompany {
  id: number;
  name: string;
  description?: string;
  location: string;
  imageUrl?: string;
  rating?: string;
  adminId?: string;
  tours?: Tour[];
}

interface Tour {
  id: number;
  name: string;
  price: number;
  description: string;
  isAvailable: boolean;
  destination: string;
  imageUrl?: string;
}

@Component({
  selector: 'app-tour-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tour-list.html',
  styleUrls: ['./tour-list.css']
})
export class TourList implements OnInit {
  companies: TourCompany[] = [];
  filteredCompanies: TourCompany[] = [];
  selectedCompany: any = {}; // For update modal
  selectedFile: File | null = null;
  isLoading = true;
  errorMessage = '';
  successMessage = '';

  // Search & Filters
  searchTerm = '';
  locationFilter = '';
  ratingFilter = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 6;
  totalItems = 0;
  totalPages = 0;

  // Modal states
  showDeleteModal = false;
  showViewModal = false;
  companyToDelete: TourCompany | null = null;

  constructor(
    private superadminService: SuperadminServices,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTourCompanies();
  }

  loadTourCompanies(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cd.detectChanges();

    const startTime = Date.now();

    this.superadminService.getAllTourCompanies().subscribe({
      next: (response: any) => {
        if (response && response.data && Array.isArray(response.data)) {
          this.companies = response.data.map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            location: item.location,
            imageUrl: item.imageUrl,
            rating: item.rating,
            adminId: item.adminId,
            tours: item.tours || []
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
      },
      error: (error) => {
        this.errorMessage = error.userMessage || 'Failed to load tour companies';
        this.companies = [];
      },
      complete: () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(500 - elapsed, 0);
        setTimeout(() => {
          this.isLoading = false;
          this.cd.detectChanges();
        }, remaining);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.companies];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(company =>
        company.name.toLowerCase().includes(term) ||
        company.description?.toLowerCase().includes(term) ||
        company.location.toLowerCase().includes(term)
      );
    }

    if (this.locationFilter.trim()) {
      const location = this.locationFilter.toLowerCase().trim();
      filtered = filtered.filter(company =>
        company.location.toLowerCase().includes(location)
      );
    }

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
  }

  getPaginatedCompanies(): TourCompany[] {
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
    const max = 5;
    let start = Math.max(1, this.currentPage - Math.floor(max / 2));
    let end = Math.min(this.totalPages, start + max - 1);

    if (end - start + 1 < max) start = Math.max(1, end - max + 1);

    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  createNew(): void {
    this.router.navigate(['tour/create']);
  }

  viewCompany(company: TourCompany): void {
    this.selectedCompany = company;
    this.showViewModal = true;
  }

  editCompany(company: TourCompany): void {
    this.openUpdateModal(company);
  }

  openUpdateModal(company: TourCompany) {
    this.selectedCompany = { ...company };
    this.selectedFile = null;

    const modalEl = document.getElementById('updateModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  onFileChange(event: any) {
    const file = event.target.files?.[0];
    this.selectedFile = file || null;
  }

  updateCompany() {
    if (!this.selectedCompany.id) {
      alert('Invalid company selected');
      return;
    }

    const updatedData: any = {
      id: this.selectedCompany.id,
      name: this.selectedCompany.name,
      description: this.selectedCompany.description,
      location: this.selectedCompany.location,
      rating: this.selectedCompany.rating,
      adminId: this.selectedCompany.adminId
    };

    if (this.selectedFile) {
      updatedData.image = this.selectedFile;
    }

    this.superadminService.updateTourCompany(this.selectedCompany.id, updatedData).subscribe({
      next: () => {
        this.successMessage = 'Tour company updated successfully!';
        this.closeModal();
        this.loadTourCompanies();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err.userMessage || 'Failed to update tour company';
      }
    });
  }

  private closeModal() {
    const modalEl = document.getElementById('updateModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) {
        modal.hide();
      }
    }
    this.selectedCompany = {};
    this.selectedFile = null;
  }

  confirmDelete(company: TourCompany): void {
    this.companyToDelete = company;
    this.showDeleteModal = true;
  }

  deleteCompany(): void {
    if (!this.companyToDelete) return;

    this.superadminService.deleteTourCompany(this.companyToDelete.id).subscribe({
      next: () => {
        this.successMessage = 'Tour company deleted successfully!';
        this.showDeleteModal = false;
        this.companyToDelete = null;
        this.loadTourCompanies();

        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.errorMessage = error.userMessage || 'Failed to delete tour company';
        this.showDeleteModal = false;
        this.companyToDelete = null;
      }
    });
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.companyToDelete = null;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedCompany = null;
  }

  getStarArray(rating: number | undefined): boolean[] {
    if (!rating) return [false, false, false, false, false];
    return Array(5).fill(0).map((_, i) => i < rating);
  }

  refreshList(): void {
    this.clearFilters();
    this.loadTourCompanies();
  }

  getDefaultImage(): string {
    return 'assets/images/default-tour.jpg';
  }

  onImageError(event: any): void {
    event.target.src = this.getDefaultImage();
  }

  getTourCountText(company: TourCompany): string {
    const count = company.tours?.length || 0;
    return count === 1 ? '1 tour available' : `${count} tours available`;
  }

  getAvailableTourCount(company: TourCompany): number {
    return company.tours?.filter(t => t.isAvailable).length || 0;
  }
}