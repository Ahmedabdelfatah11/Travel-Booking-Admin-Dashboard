import { Injectable } from '@angular/core';

// Define allowed toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts: Toast[] = [];

  /**
   * Show a toast notification
   * @param message The message to display
   * @param type Type of toast: 'success' | 'error' | 'warning' | 'info'
   * @param duration Duration in milliseconds (default: 5000)
   */
  show(message: string, type: ToastType = 'info', duration: number = 5000): void {
    const id = Date.now() + Math.random(); // Unique ID
    const toast: Toast = { id, message, type, duration };

    this.toasts.push(toast);
    this.startRemoveTimer(id, duration);
  }

  /**
   * Get all current toasts (immutable copy)
   */
  getToasts(): Toast[] {
    return [...this.toasts];
  }

  /**
   * Remove a toast by ID
   * @param id Toast ID
   */
  remove(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  /**
   * Start timer to auto-remove toast
   * @param id Toast ID
   * @param duration Duration in ms
   */
  private startRemoveTimer(id: number, duration: number): void {
    setTimeout(() => {
      this.remove(id);
    }, duration);
  }
}