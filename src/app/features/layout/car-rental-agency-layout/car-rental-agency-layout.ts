import { Component, ElementRef, inject, Input, ViewChild } from '@angular/core';
import { Auth } from '../../../core/services/auth';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserProfile } from '../../../shared/Interfaces/users/user-profile';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-car-rental-agency-layout',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './car-rental-agency-layout.html',
  styleUrls: ['./car-rental-agency-layout.css']
})
export class CarRentalAgencyLayout {
  @Input() isSpecialPage = false;
  auth = inject(Auth);
  router = inject(Router);
  private http = inject(HttpClient);

  userProfile: UserProfile | null = null;
  isLoadingProfile = true;

  logout() {
    this.auth.Logout();
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  isCarAdmin(): boolean {
    return this.auth.hasRole('CarRentalAdmin');
  }

  @ViewChild('iconMask', { static: false }) iconMask!: ElementRef;

  hoverIcon(isHover: boolean) {
    if (this.iconMask) {
      const el = this.iconMask.nativeElement;
      el.style.backgroundColor = isHover ? '#47ebbf' : '#808080';
    }
  }

  private isToggled = false;

  toggleSidebar(event: Event): void {
    event.preventDefault();
    this.isToggled = !this.isToggled;
    const body = document.body;
    body.classList.toggle('sb-sidenav-toggled', this.isToggled);
    localStorage.setItem('sb|sidebar-toggle', this.isToggled ? 'true' : 'false');
  }

  ngOnInit(): void {
    const saved = localStorage.getItem('sb|sidebar-toggle') === 'true';
    this.isToggled = saved;
    const body = document.body;
    body.classList.toggle('sb-sidenav-toggled', saved);

    this.loadUserProfile();
  }

  private loadUserProfile(): void {
    const token = this.auth.getToken();
    if (!token) {
      this.isLoadingProfile = false;
      return;
    }

    this.http.get<UserProfile>('http://pyramigo.runasp.net/api/UserProfile/GetCurrentUser', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.isLoadingProfile = false;
      },
      error: (err) => {
        console.error('Failed to load user profile', err);
        this.isLoadingProfile = false;
      }
    });
  }

  get isSidebarToggled(): boolean {
    return this.isToggled;
  }

  get displayName(): string {
    if (!this.userProfile) return 'User';
    return `${this.userProfile.firstName} ${this.userProfile.lastName}`.trim() 
      || this.userProfile.userName 
      || 'User';
  }

  get profileImageUrl(): string {
    const url = this.userProfile?.profilePictureUrl;
    if (!url) return 'https://via.placeholder.com/150?text=User';

    // Ensure full URL (in case backend returns relative path)
    return url.startsWith('http') 
      ? url 
      : `http://pyramigo.runasp.net${url.replace(/^\/+/, '/')}`;
  }
}