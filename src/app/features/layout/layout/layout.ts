import { Component, ElementRef, inject, Input, ViewChild } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router'; 
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet,RouterLink],
  templateUrl: './layout.html',
  standalone:true,
  styleUrl: './layout.css'
})
export class Layout {
    company: any;  
    @Input() isSpecialPage = false;
  auth = inject(Auth);
  router = inject(Router);


   logout() {
    this.auth.Logout();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
   isSuperAdmin(): boolean {
    return this.auth.hasRole('SuperAdmin');
  }
    @ViewChild('iconMask', { static: false }) iconMask!: ElementRef;

  hoverIcon(isHover: boolean) {
    if (this.iconMask) {
      const el = this.iconMask.nativeElement;
      el.style.backgroundColor = isHover ? '#47ebbf' : '#808080';
    }
  }
  
    private isToggled = false;
   // Toggle sidebar via Angular
  toggleSidebar(event: Event): void {
    event.preventDefault();
    this.isToggled = !this.isToggled;

    // Toggle class on body
    const body = document.body;
    body.classList.toggle('sb-sidenav-toggled', this.isToggled);

    // Save to localStorage
    localStorage.setItem('sb|sidebar-toggle', this.isToggled ? 'true' : 'false');
  }

  // Restore state on init
  ngOnInit(): void {
    const saved = localStorage.getItem('sb|sidebar-toggle') === 'true';
    this.isToggled = saved;

    // Apply class immediately
    const body = document.body;
    body.classList.toggle('sb-sidenav-toggled', saved);
  }

  get isSidebarToggled(): boolean {
    return this.isToggled;
  }
}
