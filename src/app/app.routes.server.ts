import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'car/edit/:id',
    renderMode: RenderMode.Server // or RenderMode.Client
  },
  {
    path: 'hotel/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'tour-admin/edit-tour/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'flight-admin/edit-flight/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'tour/:id',
    renderMode: RenderMode.Server
  }

];
