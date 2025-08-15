import { afterNextRender, Component, inject, Inject, PLATFORM_ID, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Auth } from '../../../../../core/services/auth';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

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
      console.log('🌍 Running in browser (afterNextRender)');

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
  console.log('📡 loadUsers() called');
  this.loading.set(true);

  const token = this.auth.getToken();
  console.log('🔑 Token:', token ? 'Exists' : 'MISSING!');

  if (!token) {
    this.error.set('No auth token');
    this.loading.set(false);
    return;
  }

  console.log('🚀 Making HTTP request...');
  this.http.get<UsersResponse>(`${this.apiUrl}/users?pageIndex=1&pageSize=100`, {
    headers: this.getAuthHeaders()
  }).subscribe({
    next: (res) => {
       console.log('✅ Fresh data after remove:', res.data);
      this.users.set(res.data);
      this.filteredUsers.set(res.data);
      console.log('✅ FULL RESPONSE:', res);
      if (!res?.data) {
        console.error('❌ Response missing .data', res);
        this.error.set('Invalid response format');
        this.loading.set(false);
        return;
      }
      console.log('✅ Users loaded:', res.data);
      this.users.set(res.data);
      this.filteredUsers.set(res.data);
      this.loading.set(false);
    },
    error: (err) => {
      console.error('❌ API Error:', err);
      console.error('❌ Status:', err.status);
      console.error('❌ Message:', err.message);
      console.error('❌ Error body:', err.error);

      this.error.set(`Failed to load users: ${err.status} ${err.message}`);
      this.loading.set(false);

      if (err.status === 401) {
        console.log('🔐 Unauthorized — logging out');
        this.auth.Logout();
        this.router.navigate(['/login']);
      } else if (err.status === 0) {
        console.warn('🌐 Network error (CORS or cert issue?)');
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
            alert('User deleted successfully');
            this.loadUsers(); // Refresh list
          },
          error: (err) => {
            console.error('Delete failed', err);
            alert('Failed to delete user. Try again.');
          }
        });
    }
  }
//Roles
assignRole() {
  if (!this.currentAction || !this.selectedCompanyId) {
    alert('Please select a company');
    return;
  }

  const { userId, role, companyType } = this.currentAction;
  const companyId = this.selectedCompanyId;

  const dto = { userId, companyId, companyType };

  this.http.post(`${this.apiUrl}/assign-role`, dto, { headers: this.getAuthHeaders() })
    .subscribe({
      next: (res: any) => {
        alert(`${role} assigned to company successfully`);
        this.loadUsers();
        this.isModalOpen = false;
      },
      error: (err) => {
        console.error('Assign failed', err);
        alert('Failed: ' + (err.error?.message || 'Unknown error'));
      }
    });
}



removeRole(userId: string, role: string) {
  console.log('🗑️ removeRole called', { userId, role });

  // if (!isPlatformBrowser(this.platformId)) return;

  const dto = { userId, role };
  this.http.post(`${this.apiUrl}/remove-role`, dto, { headers: this.getAuthHeaders() })
    .subscribe({
      next: () => {
        alert(`${role} removed successfully`);
        
        // Force reload
        this.loadUsers();

        // Debug: Check after a delay
        setTimeout(() => {
          const users = this.users();
          const user = users.find(u => u.id === userId);
          console.log('🔍 User after removal:', user?.roles);
        }, 1000);
      },
      error: (err) => {
        console.error('Remove role failed', err);
        alert('Failed to remove role');
      }
    });
}

//Load Companies By Type
loadCompanies(companyType: string) {
  console.log('📞 Loading companies for type:', companyType);

  // 🔗 Map to correct endpoint
  const urlMap: Record<string, string> = {
    'hotel': `${this.companyApiUrl}api/HotelCompany`,
    'flight': `${this.companyApiUrl}FlightCompany`,
    'carrental': `${this.companyApiUrl}api/CarRental`,
    'tour': `${this.companyApiUrl}api/TourCompany`
  };

  const url = urlMap[companyType.toLowerCase()];

  if (!url) {
    console.error('❌ No URL mapped for companyType:', companyType);
   this.companies.set([]);
    return;
  }

  console.log('📡 Fetching from:', url);

  this.http.get<any[]>(url, { headers: this.getAuthHeaders() }).subscribe({
next: (res: any) => {
  console.log('✅ Raw API response:', res);

  const companiesData = Array.isArray(res) ? res : res.data;
  if (!companiesData || !Array.isArray(companiesData)) {
    console.warn('⚠️ No valid data array found');
    this.companies.set([]);
    return;
  }

  const unassigned = companiesData.filter((c: any) => {
    const adminId = c.AdminId || c.adminId || c.admin_id;
    return !adminId;
  });

  console.log('✅ Unassigned companies:', unassigned);

  this.companies.set(
    unassigned.map((item: any) => ({
      id: item.id || item.Id,
      name: item.name || item.Name || item.companyName || 'Unnamed'
    }))
  );

  console.log('✅ Final dropdown options:', this.companies());
},
error: (err) => {
  console.error(`❌ Failed to load ${companyType} companies`, err);
  this.companies.set([]);
  alert(`Failed to load ${companyType} list.`);
}
  });
}


openCompanyModal(user: User, role: string, companyType: string) {
  this.currentAction = { userId: user.id, role, companyType };
  console.log('✅ currentAction set:', this.currentAction);

this.selectedCompanyId.set(null);
  this.companies.set([]);      // ← Clear previous list
  this.isModalOpen = true;    // ← Show modal

  this.loadCompanies(companyType); // 🔥 Load companies here!
}
}