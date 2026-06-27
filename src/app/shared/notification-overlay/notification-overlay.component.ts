import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-notification-overlay',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  template: `
    <!-- Notification stack -->
    <div class="pointer-events-none fixed right-4 top-4 z-[10000] flex w-[340px] flex-col gap-3">

      <!-- Ticket alerts -->
      @for (alert of notif.ticketAlerts(); track alert.id) {
        <div class="pointer-events-auto rounded-lg overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.45)] border border-indigo-500/30"
          style="background:linear-gradient(135deg,#1a1d2e 0%,#13162a 100%);animation:slideInRight 300ms cubic-bezier(0.16,1,0.3,1)">
          <div class="h-[3px] w-full" style="background:linear-gradient(90deg,#4f46e5,#7c3aed)"></div>
          <div class="flex items-start gap-3 p-4">
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/20 border border-indigo-500/30 shrink-0 mt-0.5">
              <svg class="w-[18px] h-[18px] text-indigo-400" style="color:#818cf8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">New Support Ticket</span>
                <span class="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse shrink-0"></span>
              </div>
              <p class="text-[13px] font-semibold text-white leading-none mb-1">{{ alert.name }}</p>
              <p class="text-[12px] text-white/50 leading-snug line-clamp-2 mt-1">{{ alert.issue }}</p>
            </div>
            <button (click)="notif.removeTicketAlert(alert.id)" class="text-white/25 hover:text-white/60 transition-colors shrink-0 mt-0.5">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="px-4 pb-3">
            <div class="h-px w-full bg-white/[0.06] mb-2.5"></div>
            <div class="flex items-center justify-between">
              <span class="text-[10px] text-white/25">Go to Live Chats to respond</span>
              <span class="text-[10px] font-semibold text-indigo-400">Just now</span>
            </div>
          </div>
        </div>
      }

      <!-- Toast notifications -->
      @for (n of notif.notifications(); track n.id) {
        <div class="pointer-events-auto rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-xl transition-all duration-200 animate-fade-in"
          [class]="toastClass(n.type)">
          <div class="flex items-start gap-3">
            <div class="mt-0.5 shrink-0" [innerHTML]="toastIcon(n.type)"></div>
            <div class="min-w-0 flex-1 text-sm leading-6 whitespace-pre-line">{{ n.message }}</div>
            <button (click)="notif.removeNotification(n.id)" class="text-slate-500 hover:text-slate-900">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
      }
    </div>

    <!-- Confirm dialog -->
    @if (confirmState()) {
      <app-modal [isOpen]="true" [title]="confirmState()?.options?.title || 'Please confirm'" size="sm" (onClose)="notif.resolveConfirm(false)">
        <div class="space-y-6">
          <p class="text-sm leading-6 text-foreground whitespace-pre-line">{{ confirmState()?.message }}</p>
          <div class="flex justify-end gap-3">
            <button (click)="notif.resolveConfirm(false)" class="rounded-xl border border-border bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-all">
              {{ confirmState()?.options?.cancelText || 'Cancel' }}
            </button>
            <button (click)="notif.resolveConfirm(true)" class="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all"
              [class]="confirmState()?.options?.intent === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'">
              {{ confirmState()?.options?.confirmText || 'Confirm' }}
            </button>
          </div>
        </div>
      </app-modal>
    }
  `
})
export class NotificationOverlayComponent {
  notif = inject(NotificationService);

  get confirmState() { return this.notif.confirmState; }

  toastClass(type: string): string {
    if (type === 'success') return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700';
    if (type === 'error') return 'bg-rose-500/10 border-rose-500/20 text-rose-700';
    return 'bg-slate-100 border-slate-200 text-slate-900';
  }

  toastIcon(type: string): string {
    if (type === 'success') return `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    if (type === 'error') return `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    return `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
  }
}
