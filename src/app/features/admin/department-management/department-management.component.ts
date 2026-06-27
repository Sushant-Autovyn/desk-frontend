import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { Department, Agent } from '../../../core/models';

@Component({
  selector: 'app-department-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
<div class="space-y-6">
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div>
      <h1 class="text-xl font-bold text-foreground">Department Configuration</h1>
      <p class="text-xs text-muted-foreground mt-0.5">Manage support departments and view agent distribution.</p>
    </div>
    <button (click)="openAdd()" class="inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-indigo-700 transition-all shrink-0">
      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Add Department
    </button>
  </div>

  @if (successMessage()) {
    <div class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm animate-fade-in">{{ successMessage() }}</div>
  }

  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    @for (dept of departments(); track dept.id) {
      <div class="rounded-xl border border-border bg-card p-5 hover:shadow-sm transition-shadow">
        <div class="flex items-start justify-between">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 shrink-0">
            <svg class="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <div class="flex gap-1">
            <button (click)="openEdit(dept)" class="rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Edit">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button (click)="handleDelete(dept)" class="rounded-lg p-1.5 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600 transition-colors" title="Delete">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
        </div>
        <h3 class="mt-3 text-[14px] font-bold text-foreground">{{ dept.name }}</h3>
        <p class="text-[12px] text-muted-foreground mt-1 leading-relaxed">{{ dept.description || 'No description provided.' }}</p>
        <div class="mt-4 pt-3 border-t border-border/60">
          <span class="text-[11px] text-muted-foreground">{{ getAgentCount(dept.name) }} agents</span>
        </div>
      </div>
    }
    @if (departments().length === 0) {
      <div class="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
        <svg class="h-12 w-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <p class="text-sm font-medium text-foreground">No departments yet</p>
        <p class="text-xs">Add your first department to get started.</p>
      </div>
    }
  </div>
</div>

<app-modal [isOpen]="modalOpen()" [title]="editingDept() ? 'Edit Department' : 'Add Department'" (onClose)="modalOpen.set(false)">
  <form (ngSubmit)="handleSave()" class="space-y-4">
    <div>
      <label class="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Name *</label>
      <input type="text" [(ngModel)]="formName" name="deptName" required placeholder="e.g. Technical Support" class="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-foreground"/>
    </div>
    <div>
      <label class="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Description</label>
      <textarea [(ngModel)]="formDesc" name="deptDesc" rows="3" placeholder="Brief description..." class="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-foreground resize-none"></textarea>
    </div>
    <div class="flex gap-3 justify-end pt-4 border-t border-border">
      <button type="button" (click)="modalOpen.set(false)" class="px-4 py-2.5 border border-border rounded-xl text-sm font-semibold hover:bg-muted text-muted-foreground">Cancel</button>
      <button type="submit" class="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">{{ editingDept() ? 'Save Changes' : 'Add Department' }}</button>
    </div>
  </form>
</app-modal>
  `
})
export class DepartmentManagementComponent implements OnInit {
  private api = inject(ApiService);
  private notif = inject(NotificationService);

  departments = signal<Department[]>([]);
  agents = signal<Agent[]>([]);
  modalOpen = signal(false);
  editingDept = signal<Department | null>(null);
  successMessage = signal<string | null>(null);
  formName = ''; formDesc = '';

  async ngOnInit(): Promise<void> {
    this.departments.set(this.api.getDepartments());
    try { this.agents.set(await this.api.fetchAgents()); } catch {}
  }

  openAdd(): void { this.editingDept.set(null); this.formName = ''; this.formDesc = ''; this.modalOpen.set(true); }
  openEdit(d: Department): void { this.editingDept.set(d); this.formName = d.name; this.formDesc = d.description; this.modalOpen.set(true); }

  handleSave(): void {
    if (!this.formName.trim()) return;
    if (this.editingDept()) {
      this.api.updateDepartment(this.editingDept()!.id, this.formName, this.formDesc);
      this.showSuccess('Department updated.');
    } else {
      this.api.addDepartment(this.formName, this.formDesc);
      this.showSuccess('Department added.');
    }
    this.departments.set(this.api.getDepartments());
    this.modalOpen.set(false);
  }

  async handleDelete(dept: Department): Promise<void> {
    const ok = await this.notif.confirm(`Delete department "${dept.name}"?`, { title: 'Delete department', confirmText: 'Delete', cancelText: 'Cancel', intent: 'danger' });
    if (!ok) return;
    this.api.deleteDepartment(dept.id);
    this.departments.set(this.api.getDepartments());
    this.showSuccess('Department deleted.');
  }

  getAgentCount(name: string): number { return this.agents().filter(a => a.department === name).length; }

  private showSuccess(msg: string): void { this.successMessage.set(msg); setTimeout(() => this.successMessage.set(null), 4000); }
}
