import { Component, computed, inject, signal } from '@angular/core';
import { Room } from '../../../../shared/Interfaces/ihotel';
import { HotelService } from '../../../../core/services/hotel-service';
import { finalize } from 'rxjs';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe, formatNumber } from '@angular/common';

@Component({
  selector: 'app-hotel-agency-room-list',
  imports: [RouterLink,DatePipe,DecimalPipe],
  templateUrl: './hotel-agency-room-list.html',
  styleUrl: './hotel-agency-room-list.css'
})
export class HotelAgencyRoomList {
  Rooms = signal<Room[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  deletingRoomId = signal<number | null>(null);
  successMessage = signal<string | null>(null);
  
  // ✅ Computed: derived state
  noRooms = computed(() => !this.loading() && this.Rooms().length === 0);

  Hotelservice = inject(HotelService);
  constructor(){
    this.loadRooms();
  }
  loadRooms(): void {
    this.loading.set(true);
    this.error.set(null);
    
    this.Hotelservice.getMyHotels().pipe(
      finalize(() => {
        this.loading.set(false);
      })
    ).subscribe({
      next: (data) => {
        // Handle array response - extract Rooms from all companies
        if (Array.isArray(data) && data.length > 0) {
          // Flatten all Rooms from all companies into a single array
          const allRooms: Room[] = data.flatMap(company => company.rooms || []);
          this.Rooms.set(allRooms);
        } else {
          this.Rooms.set([]);
        }
      },
      error: (err) => {
        console.error('Error loading Rooms:', err);
        this.error.set('Failed to load Rooms.');
      }
    });
  }

  deleteRoom(RoomId: number): void {
    // Show confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you want to delete this Room? This action cannot be undone.'
    );
    
    if (!confirmed) {
      return;
    }

    this.deletingRoomId.set(RoomId);
    this.error.set(null);
    this.successMessage.set(null);

    this.Hotelservice.deleteRoom(RoomId).pipe(
      finalize(() => {
        this.deletingRoomId.set(null);
      })
    ).subscribe({
      next: () => {
        // Remove the deleted Room from the list
        const updatedRooms = this.Rooms().filter(Room => Room.id !== RoomId);
        this.Rooms.set(updatedRooms);
        
        // Show success message
        this.successMessage.set('Room deleted successfully!');
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          this.successMessage.set(null);
        }, 3000);
      },
      error: (err) => {
        console.error('Error deleting Room:', err);
        this.error.set('Failed to delete Room. Please try again.');
      }
    });
  }

  // Helper method to check if a specific Room is being deleted
  isDeleting(RoomId: number): boolean {
    return this.deletingRoomId() === RoomId;
  }

  // Method to dismiss error message
  dismissError(): void {
    this.error.set(null);
  }

  // Method to dismiss success message
  dismissSuccess(): void {
    this.successMessage.set(null);
  }
}
