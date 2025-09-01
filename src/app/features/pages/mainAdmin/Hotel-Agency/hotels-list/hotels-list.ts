import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SuperadminServices } from '../../../../../core/services/superadmin-services';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

declare var bootstrap: any;

interface HotelCompany {
  id: number;
  name: string;
  description?: string;
  location: string;
  imageUrl?: string;
  rating?: string;
  adminId?: string;
  hotels?: Hotel[];
}

interface Hotel {
  id: number;
  name: string;
  price: number;
  description: string;
  isAvailable: boolean;
  location: string;
  imageUrl?: string;
  capacity: number;
}

@Component({
  selector: 'app-hotels-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './hotels-list.html',
  styleUrl: './hotels-list.css'
})
export class HotelsList implements OnInit {
  companies: HotelCompany[] = [];
  filteredCompanies: HotelCompany[] = [];
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
  companyToDelete: HotelCompany | null = null;

  constructor(
    private superadminService: SuperadminServices,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadHotelCompanies();
  }

  loadHotelCompanies(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.superadminService.getAllHotelCompanies().subscribe({
      next: (response: any) => {
        if (response.data && Array.isArray(response.data)) {
          this.companies = response.data.map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            location: item.location,
            imageUrl: item.imageUrl,
            rating: item.rating,
            adminId: item.adminId,
            hotels: item.hotels || []
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
        this.errorMessage = error.userMessage || 'Failed to load hotel companies';
        this.isLoading = false;
        this.companies = [];
        this.cd.detectChanges();
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

  getPaginatedCompanies(): HotelCompany[] {
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
    this.router.navigate(['hotel/create']);
  }

  viewCompany(company: HotelCompany): void {
    this.selectedCompany = company;
    this.showViewModal = true;
  }

  // ✅ Open update modal instead of navigating
  editCompany(company: HotelCompany): void {
    this.openUpdateModal(company);
  }

  openUpdateModal(company: HotelCompany) {
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

    this.superadminService.updateHotelCompany(this.selectedCompany.id, updatedData).subscribe({
      next: () => {
        this.successMessage = 'Hotel company updated successfully!';
        this.closeModal();
        this.loadHotelCompanies(); // Refresh list
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err.userMessage || 'Failed to update hotel company';
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

  confirmDelete(company: HotelCompany): void {
    this.companyToDelete = company;
    this.showDeleteModal = true;
  }

  deleteCompany(): void {
    if (this.companyToDelete) {
      this.superadminService.deleteHotelCompany(this.companyToDelete.id).subscribe({
        next: (response) => {
          this.successMessage = 'Hotel company deleted successfully!';
          this.showDeleteModal = false;
          this.companyToDelete = null;
          this.loadHotelCompanies();

          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.errorMessage = error.userMessage || 'Failed to delete hotel company';
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
    this.loadHotelCompanies();
  }

  getDefaultImage(): string {
    return '';
  }

  onImageError(event: any): void {
    event.target.src = this.getDefaultImage();
  }

  getHotelCountText(company: HotelCompany): string {
    const count = company.hotels?.length || 0;
    return count === 1 ? '1 hotel available' : `${count} hotels available`;
  }

  getAvailableHotelCount(company: HotelCompany): number {
    if (!company.hotels) return 0;
    return company.hotels.filter(h => h.isAvailable).length;
  }
}