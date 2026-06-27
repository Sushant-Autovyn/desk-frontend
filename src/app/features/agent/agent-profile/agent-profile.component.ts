import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Agent } from '../../../core/models';

@Component({
  selector: 'app-agent-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="max-w-lg mx-auto space-y-6">
  <div>
    <h1 class="text-xl font-bold text-foreground">My Profile</h1>
    <p class="text-xs text-muted-foreground mt-0.5">View and update your account information.</p>
  </div>

  @if (agent()) {
    <!-- Avatar card -->
    <div class="rounded-2xl border border-border bg-card p-6 flex items-center gap-5">
      <div class="h-16 w-16 rounded-2xl bg-indigo-500/15 flex items-center justify-center text-2xl font-bold text-indigo-600 shrink-0">
        {{ agent()!.name[0].toUpperCase() }}
      </div>
      <div>
        <p class="text-base font-bold text-foreground">{{ agent()!.name }}</p>
        <p class="text-[12px] text-muted-foreground">{{ agent()!.email }}</p>
        <p class="mt-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold bg-indigo-500/10 text-indigo-600">
          {{ agent()!.department || 'Support' }}
        </p>
      </div>
    </div>

    <!-- Info form -->
    <div class="rounded-2xl border border-border bg-card p-6 space-y-4">
      <p class="text-[13px] font-semibold text-foreground">Account Details</p>
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Full Name</label>
          <input [(ngModel)]="editName" class="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-indigo-500"/>
        </div>
        <div>
          <label class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Email</label>
          <input [value]="agent()!.email" disabled class="w-full px-3 py-2.5 bg-muted/20 border border-border rounded-xl text-sm text-muted-foreground cursor-not-allowed"/>
        </div>
        <div>
          <label class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Department</label>
          <input [value]="agent()!.department || '—'" disabled class="w-full px-3 py-2.5 bg-muted/20 border border-border rounded-xl text-sm text-muted-foreground cursor-not-allowed"/>
        </div>
        <div>
          <label class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Status</label>
          <span class="flex items-center gap-2 px-3 py-2.5 bg-muted/20 border border-border rounded-xl text-sm">
            <span class="h-2 w-2 rounded-full" [class]="agent()!.status === 'online' ? 'bg-emerald-500' : 'bg-muted-foreground'"></span>
            <span class="text-foreground capitalize">{{ agent()!.status || 'offline' }}</span>
          </span>
        </div>
      </div>

      @if (profileSuccess()) {
        <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[12px]">{{ profileSuccess() }}</div>
      }
      <div class="flex justify-end">
        <button (click)="saveProfile()" class="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">Save Changes</button>
      </div>
    </div>

    <!-- Password form -->
    <div class="rounded-2xl border border-border bg-card p-6 space-y-4">
      <p class="text-[13px] font-semibold text-foreground">Change Password</p>
      <div class="space-y-3">
        <div>
          <label class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">New Password</label>
          <input type="password" [(ngModel)]="newPassword" placeholder="Min. 8 characters" class="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-indigo-500"/>
        </div>
        <div>
          <label class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Confirm Password</label>
          <input type="password" [(ngModel)]="confirmPassword" placeholder="Repeat new password" class="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-indigo-500"/>
        </div>
        @if (pwError()) {
          <p class="text-[12px] text-rose-500">{{ pwError() }}</p>
        }
        @if (pwSuccess()) {
          <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[12px]">{{ pwSuccess() }}</div>
        }
      </div>
      <div class="flex justify-end">
        <button (click)="changePassword()" class="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">Update Password</button>
      </div>
    </div>
  } @else {
    <div class="flex justify-center py-16">
      <span class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></span>
    </div>
  }
</div>
  `
})
export class AgentProfileComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private notif = inject(NotificationService);

  agent = signal<Agent | null>(null);
  editName = '';
  newPassword = '';
  confirmPassword = '';
  profileSuccess = signal<string | null>(null);
  pwError = signal<string | null>(null);
  pwSuccess = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      const agents = await this.api.fetchAgents();
      const me = agents.find(a => a.id === this.auth.user()?.agentId);
      if (me) { this.agent.set(me); this.editName = me.name; }
    } catch {}
  }

  async saveProfile(): Promise<void> {
    if (!this.agent() || !this.editName.trim()) return;
    try {
      await this.api.updateAgent(this.agent()!.id, { name: this.editName });
      this.agent.update(a => a ? { ...a, name: this.editName } : a);
      this.profileSuccess.set('Profile updated successfully.');
      setTimeout(() => this.profileSuccess.set(null), 3000);
    } catch { this.notif.error('Failed to update profile.'); }
  }

  async changePassword(): Promise<void> {
    this.pwError.set(null);
    if (this.newPassword.length < 8) { this.pwError.set('Password must be at least 8 characters.'); return; }
    if (this.newPassword !== this.confirmPassword) { this.pwError.set('Passwords do not match.'); return; }
    try {
      await this.api.changePassword(this.agent()!.id, this.newPassword);
      this.pwSuccess.set('Password updated successfully.');
      this.newPassword = ''; this.confirmPassword = '';
      setTimeout(() => this.pwSuccess.set(null), 3000);
    } catch { this.pwError.set('Failed to update password.'); }
  }
}
