import { Injectable } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts: Toast[] = [];
  private toastId = 0;

  show(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const id = this.toastId++;
    this.toasts.push({ id, message, type });
    this.removeToastAfterDelay(id);
  }

  getToasts() {
    return [...this.toasts];
  }

  remove(id: number) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  private removeToastAfterDelay(id: number) {
    setTimeout(() => this.remove(id), 5000);
  }
}