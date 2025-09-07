import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Login route
  {
    path: 'login',
    renderMode: RenderMode.Prerender
  },

  // Super Admin routes
  {
    path: 'admin/car/edit/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'admin/dashboard',
    renderMode: RenderMode.Server
  },
  {
    path: 'admin/tour',
    renderMode: RenderMode.Server
  },
  {
    path: 'admin/hotel',
    renderMode: RenderMode.Server
  },
  {
    path: 'admin/car',
    renderMode: RenderMode.Server
  },
  {
    path: 'admin/flight',
    renderMode: RenderMode.Server
  },

  // Tour Admin routes
  {
    path: 'tour-admin/edit-tour/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'tour-admin/dashboard',
    renderMode: RenderMode.Server
  },
  {
    path: 'tour-admin/tours',
    renderMode: RenderMode.Server
  },

  // Flight Admin routes
  {
    path: 'flight-admin/edit-flight/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'flight-admin/dashboard',
    renderMode: RenderMode.Server
  },
  {
    path: 'flight-admin/flights',
    renderMode: RenderMode.Server
  },

  // Hotel Admin routes
  {
    path: 'admin/hotel/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'admin/tour/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'hotel-admin/edit-Room/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'hotel-admin/dashboard',
    renderMode: RenderMode.Server
  },
  {
    path: 'hotel-admin/Rooms',
    renderMode: RenderMode.Server
  },

  // Car Rental Admin routes
  {
    path: 'car-admin/edit-Car/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'car-admin/dashboard',
    renderMode: RenderMode.Server
  },
  {
    path: 'car-admin/Cars',
    renderMode: RenderMode.Server
  },

  // Catch-all route - should be last
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];