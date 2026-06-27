import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { Agent, Department } from '../../../core/models';

@Component({
  selector: 'app-agent-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './agent-management.component.html'
})
export class AgentManagementComponent implements OnInit {
  private api = inject(ApiService);
  private notif = inject(NotificationService);

  agents = signal<Agent[]>([]);
  departments = signal<Department[]>([]);
  searchQuery = signal('');
  statusFilter = signal<'all' | 'active' | 'inactive'>('all');
  deptFilter = signal('all');
  currentPage = signal(1);
  itemsPerPage = 6;
  modalOpen = signal(false);
  editingAgent = signal<Agent | null>(null);
  successMessage = signal<string | null>(null);

  formName = ''; formEmail = ''; formPassword = '';
  formDept = ''; formRole: 'admin' | 'agent' = 'agent';
  formStatus: 'active' | 'inactive' = 'active';
  formError = signal<string | null>(null);

  get filteredAgents(): Agent[] {
    return this.agents().filter(a => {
      const q = this.searchQuery().toLowerCase();
      const matchSearch = a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
      const matchStatus = this.statusFilter() === 'all' || a.status === this.statusFilter();
      const matchDept = this.deptFilter() === 'all' || a.department === this.deptFilter();
      return matchSearch && matchStatus && matchDept;
    });
  }

  get paginatedAgents(): Agent[] {
    const p = this.currentPage();
    return this.filteredAgents.slice((p - 1) * this.itemsPerPage, p * this.itemsPerPage);
  }

  async ngOnInit(): Promise<void> { await this.loadData(); }

  async loadData(): Promise<void> {
    try { this.agents.set(await this.api.fetchAgents()); } catch {}
    this.departments.set(this.api.getDepartments());
  }

  openAdd(): void {
    this.editingAgent.set(null);
    this.formName = ''; this.formEmail = ''; this.formPassword = '';
    this.formDept = this.departments().length > 0 ? this.departments()[0].name : 'Support';
    this.formRole = 'agent'; this.formStatus = 'active';
    this.formError.set(null); this.modalOpen.set(true);
  }

  openEdit(agent: Agent): void {
    this.editingAgent.set(agent);
    this.formName = agent.name; this.formEmail = agent.email; this.formPassword = '';
    this.formDept = agent.department; this.formRole = agent.role;
    this.formStatus = (agent.status === 'active' || agent.status === 'inactive') ? agent.status : 'active';
    this.formError.set(null); this.modalOpen.set(true);
  }

  async handleSave(): Promise<void> {
    this.formError.set(null);
    if (!this.formName || !this.formEmail || (!this.editingAgent() && !this.formPassword)) {
      this.formError.set('Please fill in all required fields'); return;
    }
    try {
      if (this.editingAgent()) {
        await this.api.updateAgent(this.editingAgent()!.id, { name: this.formName, email: this.formEmail, department: this.formDept, role: this.formRole, status: this.formStatus });
        this.showSuccess('Agent profile updated successfully.');
      } else {
        if (this.agents().some(a => a.email.toLowerCase() === this.formEmail.toLowerCase())) {
          this.formError.set('An agent with this email already exists.'); return;
        }
        await this.api.addAgent({ name: this.formName, email: this.formEmail, password: this.formPassword, department: this.formDept, role: this.formRole, status: this.formStatus });
        this.showSuccess(`Agent ${this.formName} registered successfully.`);
      }
      await this.loadData(); this.modalOpen.set(false);
    } catch (err: any) { this.formError.set(err?.message || 'Failed to save agent.'); }
  }

  async handleDelete(agent: Agent): Promise<void> {
    if (agent.id === 'admin-1') { this.notif.error('Cannot delete the master administrator account.'); return; }
    const ok = await this.notif.confirm(`Remove agent "${agent.name}"? This cannot be undone.`, { title: 'Confirm remove', confirmText: 'Remove agent', cancelText: 'Cancel', intent: 'danger' });
    if (!ok) return;
    try { await this.api.deleteAgent(agent.id); await this.loadData(); this.showSuccess('Agent removed.'); }
    catch (err: any) { this.notif.error(err?.message || 'Failed to delete.'); }
  }

  async handleToggleStatus(agent: Agent): Promise<void> {
    if (agent.id === 'admin-1') { this.notif.error('Cannot disable master admin.'); return; }
    const next = agent.status === 'active' ? 'inactive' : 'active';
    try { await this.api.updateAgent(agent.id, { status: next }); await this.loadData(); this.showSuccess(`Status set to ${next}.`); }
    catch (err: any) { this.notif.error(err?.message || 'Failed to toggle status.'); }
  }

  async handleResetPassword(agent: Agent): Promise<void> {
    try {
      const pw = await this.api.resetPassword(agent.id);
      this.notif.success(`Password reset!\n\nAgent: ${agent.name}\nTemporary Password: ${pw}\n\nShare this securely.`);
    } catch (err: any) { this.notif.error(err?.message || 'Failed to reset password.'); }
  }

  onSearchChange(v: string): void { this.searchQuery.set(v); this.currentPage.set(1); }
  onStatusChange(v: string): void { this.statusFilter.set(v as any); this.currentPage.set(1); }
  onDeptChange(v: string): void { this.deptFilter.set(v); this.currentPage.set(1); }

  private showSuccess(msg: string): void {
    this.successMessage.set(msg); setTimeout(() => this.successMessage.set(null), 4000);
  }

  get totalPages(): number { return Math.ceil(this.filteredAgents.length / this.itemsPerPage); }
  pageNumbers(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }
}
