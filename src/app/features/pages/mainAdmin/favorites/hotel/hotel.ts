// hotel.component.ts
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Hotel, HotelService } from '../../../../../core/services/hotel-service';

@Component({
  selector: 'app-hotel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hotel.html',
  styleUrls: ['./hotel.css']
})
export class HotelComponent implements OnInit {
  hotelId: string | null = null;
  hotel?: Hotel;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private hotelService: HotelService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.hotelId = this.route.snapshot.paramMap.get('id');
    if (this.hotelId) {
      this.hotelService.getHotelById(this.hotelId).subscribe({
        next: (data) => {
          this.hotel = data;
          this.loading = false;
          this.cd.detectChanges();

        },
        error: (err:any) => {
          console.error('Error fetching hotel:', err);
          this.error = 'Failed to load hotel details';
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
