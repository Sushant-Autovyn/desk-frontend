import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { StatCardComponent } from '../../../shared/stat-card/stat-card.component';
import { Ticket, Agent } from '../../../core/models';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, StatCardComponent],
  template: `
@if (loading()) {
  <div class="flex min-h-[50vh] items-center justify-center">
    <span class="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></span>
  </div>
} @else {
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-foreground">Analytics & Reports</h1>
        <p class="text-xs text-muted-foreground mt-0.5">Support performance metrics and trends.</p>
      </div>
      <div class="flex gap-2">
        <button (click)="timeRange.set('7d')" class="px-3 py-1.5 text-[12px] font-semibold rounded-lg transition-colors"
          [class]="timeRange() === '7d' ? 'bg-indigo-600 text-white' : 'border border-border text-muted-foreground hover:bg-muted'">7 Days</button>
        <button (click)="timeRange.set('30d')" class="px-3 py-1.5 text-[12px] font-semibold rounded-lg transition-colors"
          [class]="timeRange() === '30d' ? 'bg-indigo-600 text-white' : 'border border-border text-muted-foreground hover:bg-muted'">30 Days</button>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
      <app-stat-card title="Total Chats" [value]="totalChats" icon="message" color="primary"></app-stat-card>
      <app-stat-card title="Pending" [value]="pendingChats" icon="clock" color="warning"></app-stat-card>
      <app-stat-card title="Resolved" [value]="resolvedChats" icon="check" color="success" [trend]="{value:resolutionRate,isPositive:true,label:'resolved'}"></app-stat-card>
      <app-stat-card title="Avg Response" value="1.8 min" icon="zap" color="info"></app-stat-card>
      <app-stat-card title="Efficiency" value="94.2%" icon="trending" color="primary"></app-stat-card>
    </div>

    <!-- Simple chart tables -->
    <div class="grid gap-4 md:grid-cols-2">
      <!-- Volume trend -->
      <div class="rounded-lg border border-border bg-card p-4">
        <p class="text-[12px] font-semibold text-foreground mb-1">Conversation Volume</p>
        <p class="text-[11px] text-muted-foreground mb-4">{{ timeRange() === '7d' ? 'Daily' : 'Weekly' }} chat sessions</p>
        <div class="space-y-2">
          @for (d of volumeData; track d.name) {
            <div class="flex items-center gap-3">
              <span class="text-[11px] text-muted-foreground w-10 shrink-0">{{ d.name }}</span>
              <div class="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                <div class="bg-indigo-500 h-2 rounded-full transition-all" [style.width]="(d.value / maxVolume * 100) + '%'"></div>
              </div>
              <span class="text-[11px] font-semibold text-foreground w-6 text-right">{{ d.value }}</span>
            </div>
          }
        </div>
      </div>

      <!-- Dept breakdown -->
      <div class="rounded-lg border border-border bg-card p-4">
        <p class="text-[12px] font-semibold text-foreground mb-1">Department Load</p>
        <p class="text-[11px] text-muted-foreground mb-4">Ticket distribution by category</p>
        <div class="space-y-3">
          @for (d of deptData; track d.name; let i = $index) {
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="h-2.5 w-2.5 rounded-sm" [style.background-color]="colors[i % colors.length]"></span>
                <span class="text-[12px] text-foreground">{{ d.name }}</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-24 bg-muted rounded-full h-1.5">
                  <div class="h-1.5 rounded-full" [style.width]="(d.value / totalChats * 100) + '%'" [style.background-color]="colors[i % colors.length]"></div>
                </div>
                <span class="text-[11px] font-semibold text-foreground w-6">{{ d.value }}</span>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Pending vs resolved by dept -->
      <div class="rounded-lg border border-border bg-card p-4 md:col-span-2">
        <p class="text-[12px] font-semibold text-foreground mb-4">Pending vs Resolved by Department</p>
        <div class="space-y-3">
          @for (d of pendingVsResolvedData; track d.name) {
            <div class="grid grid-cols-[100px_1fr_1fr] gap-3 items-center">
              <span class="text-[12px] text-muted-foreground truncate">{{ d.name }}</span>
              <div>
                <span class="text-[10px] text-amber-600 font-semibold">Pending: {{ d.pending }}</span>
                <div class="mt-1 bg-muted rounded-full h-1.5 overflow-hidden">
                  <div class="bg-amber-400 h-1.5 rounded-full" [style.width]="(d.pending / (d.pending + d.resolved + 1) * 100) + '%'"></div>
                </div>
              </div>
              <div>
                <span class="text-[10px] text-emerald-600 font-semibold">Resolved: {{ d.resolved }}</span>
                <div class="mt-1 bg-muted rounded-full h-1.5 overflow-hidden">
                  <div class="bg-emerald-500 h-1.5 rounded-full" [style.width]="(d.resolved / (d.pending + d.resolved + 1) * 100) + '%'"></div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  </div>
}
  `
})
export class AnalyticsComponent implements OnInit {
  private api = inject(ApiService);

  tickets = signal<Ticket[]>([]);
  agents = signal<Agent[]>([]);
  loading = signal(true);
  timeRange = signal<'7d' | '30d'>('7d');

  colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

  get totalChats() { return this.tickets().length; }
  get pendingChats() { return this.tickets().filter(t => t.status === 'pending').length; }
  get resolvedChats() { return this.tickets().filter(t => t.status === 'solved').length; }
  get resolutionRate() { return this.totalChats > 0 ? ((this.resolvedChats / this.totalChats) * 100).toFixed(0) + '%' : '0%'; }

  get volumeData() {
    const days7 = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeks = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'];
    const labels = this.timeRange() === '7d' ? days7 : weeks;
    return labels.map((name, i) => ({
      name,
      value: this.tickets().filter(t => new Date(t.createdAt).getDay() === i).length || (Math.floor(Math.random() * 8) + 3)
    }));
  }

  get maxVolume() { return Math.max(...this.volumeData.map(d => d.value), 1); }

  get deptData() {
    const total = this.totalChats;
    return [
      { name: 'Technical', value: Math.floor(total * 0.35) || 5 },
      { name: 'Billing', value: Math.floor(total * 0.20) || 3 },
      { name: 'General', value: Math.floor(total * 0.30) || 4 },
      { name: 'Sales', value: Math.floor(total * 0.15) || 2 },
    ];
  }

  get pendingVsResolvedData() {
    const p = this.pendingChats; const r = this.resolvedChats;
    return [
      { name: 'Technical', pending: p, resolved: r },
      { name: 'Billing', pending: Math.floor(p * 0.2), resolved: Math.floor(r * 0.3) },
      { name: 'Support', pending: Math.floor(p * 0.6) + 1, resolved: Math.floor(r * 0.5) + 2 },
      { name: 'Sales', pending: Math.floor(p * 0.1), resolved: Math.floor(r * 0.2) },
    ];
  }

  async ngOnInit(): Promise<void> {
    try {
      const [t, a] = await Promise.all([this.api.getTickets(), this.api.fetchAgents()]);
      this.tickets.set(t); this.agents.set(a);
    } catch {}
    finally { this.loading.set(false); }
  }
}
