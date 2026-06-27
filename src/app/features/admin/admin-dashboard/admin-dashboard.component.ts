import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { StatCardComponent } from '../../../shared/stat-card/stat-card.component';
import { Ticket, Agent } from '../../../core/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StatCardComponent],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  private api = inject(ApiService);

  tickets = signal<Ticket[]>([]);
  agents = signal<Agent[]>([]);
  loading = signal(true);

  get totalConvs() { return this.tickets().length; }
  get activeChats() { return this.tickets().filter(t => t.status === 'pending').length; }
  get resolvedChats() { return this.tickets().filter(t => t.status === 'solved').length; }
  get totalAgents() { return this.agents().length; }
  get onlineAgents() { return this.agents().filter(a => a.status === 'active').length; }
  get resolutionRate() {
    return this.totalConvs > 0 ? ((this.resolvedChats / this.totalConvs) * 100).toFixed(1) + '%' : '100%';
  }

  // Donut chart segments (resolved vs active/open).
  get circ() { return 2 * Math.PI * 42; }
  get resolvedLen() { return this.totalConvs ? (this.resolvedChats / this.totalConvs) * this.circ : 0; }
  get pendingLen() { return this.totalConvs ? (this.activeChats / this.totalConvs) * this.circ : 0; }
  get resolvedPct() { return this.totalConvs ? Math.round((this.resolvedChats / this.totalConvs) * 100) : 0; }
  get pendingPct() { return this.totalConvs ? Math.round((this.activeChats / this.totalConvs) * 100) : 0; }

  get today() {
    return new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  }

  get recentTickets() { return this.tickets().slice(0, 5); }

  async ngOnInit(): Promise<void> {
    try {
      const [ticketList, agentList] = await Promise.all([
        this.api.getTickets(),
        this.api.fetchAgents(),
      ]);
      this.tickets.set(ticketList);
      this.agents.set(agentList);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      this.loading.set(false);
    }
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
