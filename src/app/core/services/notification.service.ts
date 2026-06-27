import { Injectable, signal } from '@angular/core';
import { ToastNotification, NewTicketAlert, ConfirmState, ConfirmOptions, NotificationType } from '../models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly notifications = signal<ToastNotification[]>([]);
  readonly ticketAlerts = signal<NewTicketAlert[]>([]);
  readonly confirmState = signal<ConfirmState | null>(null);
  readonly alertCount = signal(0);

  notify(message: string, type: NotificationType = 'info'): void {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.notifications.update(n => [...n, { id, type, message }]);
    setTimeout(() => this.removeNotification(id), 4500);
  }

  success(message: string): void { this.notify(message, 'success'); }
  error(message: string): void { this.notify(message, 'error'); }
  info(message: string): void { this.notify(message, 'info'); }

  removeNotification(id: string): void {
    this.notifications.update(n => n.filter(x => x.id !== id));
  }

  newTicketAlert(ticketId: string, name: string, issue: string): void {
    const id = `ticket-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.ticketAlerts.update(a => [...a.slice(-2), { id, name, issue, ticketId }]);
    this.alertCount.update(c => c + 1);
    setTimeout(() => this.removeTicketAlert(id), 9000);
  }

  removeTicketAlert(id: string): void {
    this.ticketAlerts.update(a => a.filter(x => x.id !== id));
  }

  clearAlertCount(): void { this.alertCount.set(0); }

  confirm(message: string, options?: ConfirmOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      this.confirmState.set({ id, message, options, resolve });
    });
  }

  resolveConfirm(result: boolean): void {
    const state = this.confirmState();
    if (!state) return;
    state.resolve(result);
    this.confirmState.set(null);
  }
}
