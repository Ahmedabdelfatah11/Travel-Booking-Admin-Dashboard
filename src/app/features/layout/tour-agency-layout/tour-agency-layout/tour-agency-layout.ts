import { Component, ElementRef, inject, Input, ViewChild } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { Auth } from '../../../../core/services/auth';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserProfile } from '../../../../shared/Interfaces/users/user-profile';

// Add imports for standalone
@Component({
  selector: 'app-tour-agency-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink],
  templateUrl: './tour-agency-layout.html',
  styleUrls: ['./tour-agency-layout.css']
})
export class TourAgencyLayout {
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

  isTourAdmin(): boolean {
    return this.auth.hasRole('TourAdmin');
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

    return url.startsWith('http')
      ? url
      : `http://pyramigo.runasp.net${url.replace(/^\/+/, '/')}`;
  }
}