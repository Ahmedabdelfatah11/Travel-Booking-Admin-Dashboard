import { ChangeDetectorRef, Component } from '@angular/core';
import { SuperadminServices } from '../../../../../core/services/superadmin-services';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
declare var bootstrap: any;
@Component({
  selector: 'app-hotels-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hotels-list.html',
  styleUrl: './hotels-list.css'
})
export class HotelsList {
companies: any[] = []; // Initialize as empty array
  loading = true;
  selectedCompany: any = {};
  selectedFile: File | null = null;
  error: string = '';

  constructor(private superadminService: SuperadminServices, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadCompanies();
     this.cd.detectChanges();

  }


  loadCompanies() {
    this.loading = true;
    this.error = '';
    
    // Use the correct method to get tour companies
    this.superadminService.getAllHotelCompanies().subscribe({
      next: (response: any) => {
        
        // Handle the response structure properly
        if (response && response.data) {
          this.companies = response.data;
        } else if (Array.isArray(response)) {
          this.companies = response;
        } else {
          this.companies = [];
          this.error = 'Invalid response format';
        }
        
        this.loading = false;
          this.cd.detectChanges();
      },
      error: (err) => {
        this.companies = []; // Ensure companies is always an array
        this.loading = false;
        this.error = 'Failed to load companies. Please try again.';
      }
    });
      this.cd.detectChanges();
  }

  deleteCompany(id: number) {
    if (!confirm('Are you sure you want to delete this company?')) return;

    this.superadminService.deleteTourCompany(id).subscribe({
      next: () => {
        this.companies = this.companies.filter(c => c.id !== id);
        alert('Company deleted successfully');
      },
      error: (err) => {
        alert('Failed to delete company: ' + (err.error?.message || err.message || 'Unknown error'));
      }
      
    });
      this.cd.detectChanges();
  }

  openUpdateModal(company: any) {
    this.selectedCompany = { ...company };
    this.selectedFile = null; // Reset file selection
    
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

    // Prepare the update data
    const updatedData: any = {
      id: this.selectedCompany.id,
      name: this.selectedCompany.name,
      description: this.selectedCompany.description,
      location: this.selectedCompany.location,
      rating: this.selectedCompany.rating,
      adminId: this.selectedCompany.adminId
    };

    // Add image if selected
    if (this.selectedFile) {
      updatedData.image = this.selectedFile;
    }

    this.superadminService.updateTourCompany(this.selectedCompany.id, updatedData).subscribe({
      next: () => {
        alert('Company updated successfully');
        this.loadCompanies(); // Reload the list
        this.closeModal();
      },
      error: (err) => {
        alert('Failed to update company: ' + (err.error?.message || err.message || 'Unknown error'));
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
    // Reset form
    this.selectedCompany = {};
    this.selectedFile = null;
  }

  // Track by function for better performance
  trackByCompanyId(index: number, company: any): number {
    return company.id;
  }
}
