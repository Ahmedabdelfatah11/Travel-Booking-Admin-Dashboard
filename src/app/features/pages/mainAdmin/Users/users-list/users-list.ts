import { afterNextRender, Component, inject, Inject, PLATFORM_ID, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Auth } from '../../../../../core/services/auth';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../../../core/services/toast-service';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './users-list.html',
  styleUrls: ['./users-list.css']
})
export class UsersList {
  http = inject(HttpClient);
  auth = inject(Auth);
  router = inject(Router);
  @Inject(PLATFORM_ID) private platformId!: Object;
 toastService = inject(ToastService); 

  //Some Properties
  // users-list.ts
selectedCompanyId = signal<number | null>(null);
companies = signal<{ id: number; name: string }[]>([]);
isModalOpen = false;
currentAction: { userId: string; role: string; companyType: string } | null = null;


  apiUrl = 'https://localhost:7277/api/SuperAdmin';
  companyApiUrl='https://localhost:7277/';
users = signal<User[]>([]);
  filteredUsers = signal<User[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);


  private getAuthHeaders(): HttpHeaders {
  const token = this.auth.getToken();
  if (!token) throw new Error('No token');
  return new HttpHeaders({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });
}
 constructor() {
    afterNextRender(() => {
      if (!this.auth.isLoggedIn()) {
        this.router.navigate(['/login']);
        return;
      }

      if (!this.auth.hasRole('SuperAdmin')) {
        this.router.navigate(['/unauthorized']);
        return;
      }

      this.loadUsers();
    });
  }


loadUsers() {
  this.loading.set(true);

  const token = this.auth.getToken();

  if (!token) {
    this.error.set('No auth token');
    this.loading.set(false);
    return;
  }

  this.http.get<UsersResponse>(`${this.apiUrl}/users?pageIndex=1&pageSize=100`, {
    headers: this.getAuthHeaders()
  }).subscribe({
    next: (res) => {
      this.users.set(res.data);
      this.filteredUsers.set(res.data);
      if (!res?.data) {
        this.error.set('Invalid response format');
        this.loading.set(false);
        return;
      }
      this.users.set(res.data);
      this.filteredUsers.set(res.data);
      this.loading.set(false);
    },
    error: (err) => {
    

      this.error.set(`Failed to load users: ${err.status} ${err.message}`);
      this.loading.set(false);

      if (err.status === 401) {
        this.auth.Logout();
        this.router.navigate(['/login']);
      } else if (err.status === 0) {
        this.error.set('Network error — check console and HTTPS');
      }
    }
  });
}

  onSearch(query: string) {
    const term = query.trim().toLowerCase();
    const allUsers = this.users();

    const filtered = term
      ? allUsers.filter(u =>
          u.firstName?.toLowerCase().includes(term) ||
          u.lastName?.toLowerCase().includes(term) ||
          u.userName?.toLowerCase().includes(term) ||
          u.email?.toLowerCase().includes(term)
        )
      : allUsers;

    this.filteredUsers.set(filtered);
  }


  deleteUser(id: string, email: string) {
    if (!isPlatformBrowser(this.platformId)) return;

    if (confirm(`Are you sure you want to delete user: ${email}?`)) {
      this.http.delete(`${this.apiUrl}/delete-user/${id}`, { headers: this.getAuthHeaders() })
        .subscribe({
          next: () => {
            this.toastService.show('User deleted successfully', 'success');
            this.loadUsers(); // Refresh list
          },
          error: (err) => {
            this.toastService.show('Failed to delete user. Try again.', 'error');
          }
        });
    }
  }
//Roles
assignRole() {
  if (!this.currentAction || !this.selectedCompanyId) {
    this.toastService.show('Please select a company', 'error');
    return;
  }

  const { userId, role, companyType } = this.currentAction;
  const companyId = this.selectedCompanyId;

  const dto = { userId, companyId, companyType };

  this.http.post(`${this.apiUrl}/assign-role`, dto, { headers: this.getAuthHeaders() })
    .subscribe({
      next: (res: any) => {
       this.toastService.show(`${role} assigned to company successfully`, 'success');
        this.loadUsers();
        this.isModalOpen = false;
      },
      error: (err) => {
       this.toastService.show('Failed: ' + (err.error?.message || 'Unknown error'), 'error');
      }
    });
}



removeRole(userId: string, role: string) {

  // if (!isPlatformBrowser(this.platformId)) return;

  const dto = { userId, role };
  this.http.post(`${this.apiUrl}/remove-role`, dto, { headers: this.getAuthHeaders() })
    .subscribe({
      next: () => {
        this.toastService.show(`${role} removed successfully`, 'success');
        
        // Force reload
        this.loadUsers();

        // Debug: Check after a delay
        setTimeout(() => {
          const users = this.users();
          const user = users.find(u => u.id === userId);
        }, 1000);
      },
      error: (err) => {
         this.toastService.show('Failed to remove role', 'error');
      }
    });
}

loadCompanies(companyType: string) {
  const urlMap: Record<string, string> = {
    'hotel': `${this.companyApiUrl}api/HotelCompany`,
    'flight': `${this.companyApiUrl}FlightCompany`,
    'carrental': `${this.companyApiUrl}api/CarRental`,
    'tour': `${this.companyApiUrl}api/TourCompany`
  };

  const url = urlMap[companyType.toLowerCase()];

  if (!url) {
   this.companies.set([]);
    return;
  }


  this.http.get<any[]>(url, { headers: this.getAuthHeaders() }).subscribe({
next: (res: any) => {

  const companiesData = Array.isArray(res) ? res : res.data;
  if (!companiesData || !Array.isArray(companiesData)) {
    this.companies.set([]);
    return;
  }

  const unassigned = companiesData.filter((c: any) => {
    const adminId = c.AdminId || c.adminId || c.admin_id;
    return !adminId;
  });


  this.companies.set(
    unassigned.map((item: any) => ({
      id: item.id || item.Id,
      name: item.name || item.Name || item.companyName || 'Unnamed'
    }))
  );

},
error: (err) => {
  this.companies.set([]);
  this.toastService.show(`Failed to load ${companyType} list.`, 'error');
}
  });
}


openCompanyModal(user: User, role: string, companyType: string) {
  this.currentAction = { userId: user.id, role, companyType };

this.selectedCompanyId.set(null);
  this.companies.set([]);     
  this.isModalOpen = true;    

  this.loadCompanies(companyType); 
}
}