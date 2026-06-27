import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { StatCardComponent } from '../../../shared/stat-card/stat-card.component';
import { Ticket } from '../../../core/models';

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StatCardComponent],
  template: `
@if (loading()) {
  <div class="flex min-h-[50vh] items-center justify-center">
    <span class="w-6 h-6 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin"></span>
  </div>
} @else {
  <div class="space-y-6">
    <div>
      <h1 class="text-[22px] font-bold text-slate-900 tracking-tight">Welcome back, {{ user?.name || 'Agent' }} 👋</h1>
      <p class="text-[13px] text-slate-400 mt-0.5">Here's your support activity at a glance.</p>
    </div>

    <div class="grid gap-4 grid-cols-2 sm:grid-cols-4">
      <app-stat-card title="My Chats" [value]="myTickets.length" icon="message" color="primary"></app-stat-card>
      <app-stat-card title="Active" [value]="activeTickets.length" icon="clock" color="warning"></app-stat-card>
      <app-stat-card title="Resolved" [value]="resolvedTickets.length" icon="check" color="success"></app-stat-card>
      <app-stat-card title="Rate" [value]="resolutionRate" icon="trending" color="info"></app-stat-card>
    </div>

    <!-- Recent assigned chats -->
    <div class="rounded-3xl bg-white border border-slate-200/70 shadow-sm overflow-hidden">
      <div class="flex items-center justify-between px-6 py-5">
        <div>
          <h2 class="text-[15px] font-bold text-slate-900">My Active Chats</h2>
          <p class="text-[11px] text-slate-400 mt-0.5">Conversations assigned to you</p>
        </div>
        <a routerLink="/agent/my-chats" class="text-[12px] font-semibold text-blue-600 hover:text-blue-700 rounded-full px-3 py-1.5 hover:bg-blue-50 transition-colors">View all</a>
      </div>
      <div class="divide-y divide-slate-100">
        @for (t of activeTickets.slice(0,6); track t._id) {
          <a [routerLink]="['/agent/my-chats']" class="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/70 transition-colors cursor-pointer">
            <div class="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold text-[13px] shrink-0" style="background:linear-gradient(135deg,#3b82f6,#6366f1)">
              {{ t.name[0].toUpperCase() }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-[13px] font-semibold text-slate-800 truncate">{{ t.name }}</p>
              <p class="text-[11px] text-slate-400 truncate">{{ t.issue }}</p>
            </div>
            <span class="hidden sm:block text-[11px] text-slate-400 shrink-0">{{ formatDate(t.createdAt) }}</span>
            <span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold bg-amber-50 text-amber-600 shrink-0">
              <span class="h-1.5 w-1.5 rounded-full bg-amber-500"></span> Open
            </span>
          </a>
        }
        @if (activeTickets.length === 0) {
          <div class="px-6 py-14 text-center text-[12px] text-slate-400">No active chats assigned to you.</div>
        }
      </div>
    </div>
  </div>
}
  `
})
export class AgentDashboardComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  tickets = signal<Ticket[]>([]);
  assignments = signal<Record<string, string>>({});
  loading = signal(true);

  get user() { return this.auth.user(); }

  get myTickets(): Ticket[] {
    return this.tickets().filter(t => this.assignments()[t._id] === this.user?.agentId);
  }
  get activeTickets(): Ticket[] { return this.myTickets.filter(t => t.status === 'pending'); }
  get resolvedTickets(): Ticket[] { return this.myTickets.filter(t => t.status === 'solved'); }
  get resolutionRate(): string {
    const t = this.myTickets.length;
    return t > 0 ? ((this.resolvedTickets.length / t) * 100).toFixed(0) + '%' : '0%';
  }

  async ngOnInit(): Promise<void> {
    try {
      const t = await this.api.getTickets();
      this.tickets.set(t);
      this.assignments.set(this.api.getAssignments());
    } catch {}
    finally { this.loading.set(false); }
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
}
