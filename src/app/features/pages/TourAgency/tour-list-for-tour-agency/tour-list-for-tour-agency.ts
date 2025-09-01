import { Component, computed, signal } from '@angular/core';
import { TourService } from '../../../../core/services/tour-service';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';
import { TourReadDto } from '../../../../shared/Interfaces/i-tour';

@Component({
  selector: 'app-tour-list-for-tour-agency',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterModule],
  templateUrl: './tour-list-for-tour-agency.html',
  styleUrl: './tour-list-for-tour-agency.css'
})
export class TourListForTourAgency {
  tours = signal<TourReadDto[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  noTours = computed(() => !this.loading() && this.tours().length === 0);

  constructor(private tourService: TourService) {
    this.loadTours();
  }

  loadTours(): void {
    this.tourService.getMyTours().subscribe({
      next: (tours) => {
        this.tours.set([...tours]);        
        this.loading.set(false);           
      },
      error: (err) => {
        this.error.set('Failed to load tours.');
        this.loading.set(false);
      }
    });
  }

  getImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) {
      return 'https://via.placeholder.com/400x250?text=No+Image';
    }

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    return `http://pyramigo.runasp.net/api/${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  }
}