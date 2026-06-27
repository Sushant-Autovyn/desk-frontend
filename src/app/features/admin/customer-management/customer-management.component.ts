import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { Customer, Ticket } from '../../../core/models';

@Component({
  selector: 'app-customer-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './customer-management.component.html'
})
export class CustomerManagementComponent implements OnInit {
  private api = inject(ApiService);
  private notif = inject(NotificationService);

  customers = signal<Customer[]>([]);
  tickets = signal<Ticket[]>([]);
  searchQuery = signal('');
  statusFilter = signal('all');
  currentPage = signal(1);
  itemsPerPage = 8;
  notesModal = signal(false);
  historyModal = signal(false);
  selectedCustomer = signal<Customer | null>(null);
  editNotes = '';
  successMessage = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    this.customers.set(this.api.getCustomers());
    try { this.tickets.set(await this.api.getTickets()); } catch {}
  }

  get filteredCustomers(): Customer[] {
    const q = this.searchQuery().toLowerCase();
    return this.customers().filter(c => {
      if (q && !c.name.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q)) return false;
      if (this.statusFilter() !== 'all' && c.status !== this.statusFilter()) return false;
      return true;
    });
  }

  get paginatedCustomers(): Customer[] {
    const p = this.currentPage();
    return this.filteredCustomers.slice((p - 1) * this.itemsPerPage, p * this.itemsPerPage);
  }

  get totalPages(): number { return Math.ceil(this.filteredCustomers.length / this.itemsPerPage); }
  pageNumbers(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }

  customerTickets(email: string): Ticket[] {
    return this.tickets().filter(t => t.email.toLowerCase() === email.toLowerCase());
  }

  openNotes(c: Customer): void { this.selectedCustomer.set(c); this.editNotes = c.notes; this.notesModal.set(true); }
  openHistory(c: Customer): void { this.selectedCustomer.set(c); this.historyModal.set(true); }

  saveNotes(): void {
    if (!this.selectedCustomer()) return;
    this.api.updateCustomerNotes(this.selectedCustomer()!.email, this.editNotes);
    this.customers.set(this.api.getCustomers());
    this.notesModal.set(false);
    this.showSuccess('Notes saved.');
  }

  async toggleStatus(c: Customer): Promise<void> {
    const next = c.status === 'active' ? 'blocked' : 'active';
    this.api.updateCustomerStatus(c.email, next);
    this.customers.set(this.api.getCustomers());
    this.showSuccess(`Customer ${next === 'blocked' ? 'blocked' : 'unblocked'}.`);
  }

  async handleDelete(c: Customer): Promise<void> {
    const ok = await this.notif.confirm(`Delete customer "${c.name}"?`, { title: 'Delete customer', confirmText: 'Delete', cancelText: 'Cancel', intent: 'danger' });
    if (!ok) return;
    this.api.deleteCustomer(c.email);
    this.customers.set(this.api.getCustomers());
    this.showSuccess('Customer deleted.');
  }

  onSearchChange(v: string): void { this.searchQuery.set(v); this.currentPage.set(1); }
  onStatusChange(v: string): void { this.statusFilter.set(v); this.currentPage.set(1); }

  formatDate(d: string): string { return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }

  private showSuccess(msg: string): void { this.successMessage.set(msg); setTimeout(() => this.successMessage.set(null), 3000); }
}
