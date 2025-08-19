// tour.component.ts
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Tours, TourService } from '../../../../../core/services/tour-services';


@Component({
  selector: 'app-tour',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tour.html',
  styleUrls: ['./tour.css']
})
export class TourComponent implements OnInit {
  tourId: string | null = null;
  tour?: Tours;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private tourService: TourService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.tourId = this.route.snapshot.paramMap.get('id');
    if (this.tourId) {
      this.tourService.getTour(this.tourId).subscribe({
        next: (data) => {
          this.tour = data;
          this.loading = false;
          this.cd.detectChanges();

        },
        error: (err) => {
          console.error('Error fetching tour:', err);
          this.error = 'Failed to load tour details.';
          this.loading = false;
          this.cd.detectChanges();

        }
      });
    }
  }

  goBack(): void {
    this.cd.detectChanges();
    this.location.back();
  }
}
