import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { Ticket, Agent, Message } from '../../../core/models';

@Component({
  selector: 'app-chat-history',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './chat-history.component.html'
})
export class ChatHistoryComponent implements OnInit {
  private api = inject(ApiService);

  tickets = signal<Ticket[]>([]);
  agents = signal<Agent[]>([]);
  assignments = signal<Record<string, string>>({});
  messages = signal<Message[]>([]);
  selectedTicket = signal<Ticket | null>(null);
  modalOpen = signal(false);
  loading = signal(true);
  currentPage = signal(1);
  itemsPerPage = 8;

  filterEmail = ''; filterAgent = ''; filterStatus = 'all'; filterDate = '';

  async ngOnInit(): Promise<void> {
    try {
      const [t, a] = await Promise.all([this.api.getTickets(), this.api.fetchAgents()]);
      this.tickets.set(t); this.agents.set(a);
      this.assignments.set(this.api.getAssignments());
    } catch (err) { console.error(err); }
    finally { this.loading.set(false); }
  }

  get filteredTickets(): Ticket[] {
    return this.tickets().filter(t => {
      if (this.filterEmail && !t.email.toLowerCase().includes(this.filterEmail.toLowerCase())) return false;
      if (this.filterStatus !== 'all' && t.status !== this.filterStatus) return false;
      if (this.filterAgent) {
        const agentId = this.assignments()[t._id];
        const agent = this.agents().find(a => a.id === agentId);
        if (!agent?.name.toLowerCase().includes(this.filterAgent.toLowerCase())) return false;
      }
      if (this.filterDate) {
        const td = new Date(t.createdAt).toISOString().slice(0, 10);
        if (td !== this.filterDate) return false;
      }
      return true;
    });
  }

  get paginatedTickets(): Ticket[] {
    const p = this.currentPage();
    return this.filteredTickets.slice((p - 1) * this.itemsPerPage, p * this.itemsPerPage);
  }

  get totalPages(): number { return Math.ceil(this.filteredTickets.length / this.itemsPerPage); }
  pageNumbers(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }

  async openTranscript(ticket: Ticket): Promise<void> {
    this.selectedTicket.set(ticket);
    this.messages.set([]);
    this.modalOpen.set(true);
    try { this.messages.set(await this.api.getChats(ticket._id)); } catch {}
  }

  getAgentName(ticketId: string): string {
    const id = this.assignments()[ticketId];
    return this.agents().find(a => a.id === id)?.name || '—';
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  formatTime(d: string): string {
    return new Date(d).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  onFilterChange(): void { this.currentPage.set(1); }
}
