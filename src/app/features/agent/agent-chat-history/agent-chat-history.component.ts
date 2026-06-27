import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { Ticket, Message } from '../../../core/models';

@Component({
  selector: 'app-agent-chat-history',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
<div class="space-y-6">
  <div>
    <h1 class="text-xl font-bold text-foreground">My Chat History</h1>
    <p class="text-xs text-muted-foreground mt-0.5">Past conversations assigned to you.</p>
  </div>

  <div class="flex gap-3 bg-card p-4 rounded-2xl border border-border">
    <div class="relative flex-1">
      <svg class="absolute inset-y-0 left-3 my-auto h-4 w-4 text-muted-foreground pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input type="text" [(ngModel)]="filterEmail" (ngModelChange)="page.set(1)" placeholder="Search by email..." class="w-full pl-10 pr-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-foreground placeholder-muted-foreground"/>
    </div>
    <select [(ngModel)]="filterStatus" (ngModelChange)="page.set(1)" class="px-3 py-2.5 bg-muted/30 border border-border rounded-xl text-sm text-foreground focus:outline-none cursor-pointer">
      <option value="all">All</option><option value="pending">Open</option><option value="solved">Resolved</option>
    </select>
  </div>

  <div class="rounded-2xl border border-border bg-card overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="bg-muted/30 border-b border-border">
          <tr>
            @for (h of ['Customer','Issue','Date','Status','Transcript']; track h) {
              <th class="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{{ h }}</th>
            }
          </tr>
        </thead>
        <tbody class="divide-y divide-border/60">
          @if (loading()) {
            @for (i of [1,2,3,4]; track i) {
              <tr><td colspan="5" class="px-4 py-4"><div class="h-4 bg-muted rounded animate-pulse"></div></td></tr>
            }
          } @else {
            @for (t of paginated; track t._id) {
              <tr class="hover:bg-muted/10 transition-colors">
                <td class="px-4 py-3">
                  <p class="text-[12px] font-semibold text-foreground">{{ t.name }}</p>
                  <p class="text-[11px] text-muted-foreground">{{ t.email }}</p>
                </td>
                <td class="px-4 py-3 text-[12px] text-muted-foreground max-w-[200px] truncate">{{ t.issue }}</td>
                <td class="px-4 py-3 text-[11px] text-muted-foreground whitespace-nowrap">{{ fmt(t.createdAt) }}</td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold"
                    [class]="t.status === 'pending' ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'">
                    {{ t.status === 'pending' ? 'Open' : 'Resolved' }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <button (click)="open(t)" class="text-[12px] font-semibold text-indigo-500 hover:text-indigo-400">View →</button>
                </td>
              </tr>
            }
            @if (paginated.length === 0) {
              <tr><td colspan="5" class="py-12 text-center text-[12px] text-muted-foreground">No conversations found.</td></tr>
            }
          }
        </tbody>
      </table>
    </div>
    @if (totalPages > 1) {
      <div class="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/10">
        <span class="text-[12px] text-muted-foreground">{{ filtered.length }} conversations</span>
        <div class="flex gap-1">
          @for (p of pages(); track p) {
            <button (click)="page.set(p)" class="h-7 w-7 rounded text-[12px] font-medium transition-colors"
              [class]="page() === p ? 'bg-indigo-600 text-white' : 'text-muted-foreground hover:bg-muted'">{{ p }}</button>
          }
        </div>
      </div>
    }
  </div>
</div>

<app-modal [isOpen]="modal()" [title]="'Transcript: ' + (selected()?.name || '')" size="lg" (onClose)="modal.set(false)">
  @if (selected()) {
    <div class="space-y-3 max-h-[450px] overflow-y-auto pr-2 scrollbar-thin">
      @for (msg of msgs(); track $index) {
        <div class="flex flex-col" [class]="msg.sender === 'support' ? 'items-end' : 'items-start'">
          <div class="max-w-[70%] px-3 py-2 rounded-xl text-[12px]"
            [class]="msg.sender === 'support' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-muted text-foreground border border-border rounded-tl-none'">
            {{ msg.text }}
            @if (msg.imageUrl) { <img [src]="msg.imageUrl" class="max-w-[160px] rounded mt-1"/> }
          </div>
          <span class="text-[9px] text-muted-foreground mt-0.5 px-1">{{ fmtTime(msg.createdAt) }}</span>
        </div>
      }
      @if (msgs().length === 0) {
        <p class="text-center text-[12px] text-muted-foreground py-8">No messages.</p>
      }
    </div>
  }
</app-modal>
  `
})
export class AgentChatHistoryComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  tickets = signal<Ticket[]>([]);
  assignments = signal<Record<string, string>>({});
  loading = signal(true);
  page = signal(1);
  per = 8;
  modal = signal(false);
  selected = signal<Ticket | null>(null);
  msgs = signal<Message[]>([]);

  filterEmail = ''; filterStatus = 'all';

  get user() { return this.auth.user(); }

  get filtered(): Ticket[] {
    return this.tickets().filter(t => {
      if (this.assignments()[t._id] !== this.user?.agentId) return false;
      if (this.filterStatus !== 'all' && t.status !== this.filterStatus) return false;
      if (this.filterEmail && !t.email.toLowerCase().includes(this.filterEmail.toLowerCase())) return false;
      return true;
    });
  }
  get paginated(): Ticket[] { const p = this.page(); return this.filtered.slice((p-1)*this.per, p*this.per); }
  get totalPages(): number { return Math.ceil(this.filtered.length / this.per); }
  pages(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }

  async ngOnInit(): Promise<void> {
    try {
      const t = await this.api.getTickets();
      this.tickets.set(t);
      this.assignments.set(this.api.getAssignments());
    } catch {}
    finally { this.loading.set(false); }
  }

  async open(t: Ticket): Promise<void> {
    this.selected.set(t); this.msgs.set([]); this.modal.set(true);
    try { this.msgs.set(await this.api.getChats(t._id)); } catch {}
  }

  fmt(d: string): string { return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }
  fmtTime(d: string): string { return new Date(d).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }); }
}
