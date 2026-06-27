import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../core/services/auth.service';

interface NavLink { to: string; label: string; icon: SafeHtml; }

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  styles: [':host { display: contents; }'],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[2px] lg:hidden" (click)="setIsOpen.emit(false)"></div>
    }

    <!-- Icon rail (static inside the rounded app panel on desktop, drawer on mobile) -->
    <aside class="fixed inset-y-0 left-0 z-50 flex w-[76px] shrink-0 flex-col items-center bg-[#3a4150] py-6 transition-transform duration-300 ease-in-out lg:static lg:inset-auto lg:z-auto lg:translate-x-0 lg:rounded-[26px] lg:shadow-[0_20px_50px_-30px_rgba(15,23,42,0.4)]"
      [class.translate-x-0]="isOpen" [class.-translate-x-full]="!isOpen">

      <!-- Logo (top) -->
      <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 shrink-0">
        <svg width="24" height="24" viewBox="18 18 84 84" fill="none">
          <ellipse cx="42" cy="42" rx="18" ry="10" transform="rotate(-45 42 42)" fill="#2196F3"/>
          <circle cx="35" cy="35" r="8" fill="#2196F3"/>
          <ellipse cx="78" cy="42" rx="18" ry="10" transform="rotate(45 78 42)" fill="#4CAF50"/>
          <circle cx="85" cy="35" r="8" fill="#4CAF50"/>
          <ellipse cx="42" cy="78" rx="18" ry="10" transform="rotate(45 42 78)" fill="#FF9800"/>
          <circle cx="35" cy="85" r="8" fill="#FF9800"/>
          <ellipse cx="78" cy="78" rx="18" ry="10" transform="rotate(-45 78 78)" fill="#E91E63"/>
          <circle cx="85" cy="85" r="8" fill="#E91E63"/>
        </svg>
      </div>

      <!-- Nav (vertically centered) -->
      <nav class="flex-1 flex flex-col items-center justify-center gap-2.5">
        @for (link of links; track link.to) {
          <a [routerLink]="link.to" routerLinkActive #rla="routerLinkActive"
            [routerLinkActiveOptions]="{exact: false}"
            [title]="link.label" (click)="setIsOpen.emit(false)"
            class="group relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-150"
            [class]="rla.isActive
              ? 'bg-white text-blue-600 shadow-md'
              : 'text-slate-300 hover:bg-white/10 hover:text-white'">
            <span class="block h-5 w-5 [&>svg]:h-5 [&>svg]:w-5" [innerHTML]="link.icon"></span>
            <span class="pointer-events-none absolute left-[58px] z-50 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-white opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0 shadow-lg">
              {{ link.label }}
            </span>
          </a>
        }
      </nav>

      <!-- Bottom: logout + avatar -->
      <div class="flex flex-col items-center gap-3 shrink-0">
        <button (click)="logout()" title="Sign out"
          class="flex h-12 w-12 items-center justify-center rounded-2xl text-slate-300 hover:bg-rose-500/15 hover:text-rose-300 transition-colors">
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-[12px] ring-2 ring-white shadow" [title]="user?.name">
          {{ initials }}
        </div>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  @Input() isOpen = false;
  @Output() setIsOpen = new EventEmitter<boolean>();

  private auth = inject(AuthService);
  private sanitizer = inject(DomSanitizer);

  get user() { return this.auth.user(); }
  get role() { return this.user?.role || 'agent'; }
  get initials() { return this.user?.name?.substring(0, 2).toUpperCase() ?? '??'; }

  private safe(svg: string): SafeHtml { return this.sanitizer.bypassSecurityTrustHtml(svg); }

  private I = {
    grid: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>`,
    chat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/></svg>`,
    agents: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    dept: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  };

  private adminLinks: NavLink[] = [
    { to: '/admin/dashboard',    label: 'Dashboard',    icon: this.safe(this.I.grid) },
    { to: '/admin/live-chats',   label: 'Live Chats',   icon: this.safe(this.I.chat) },
    { to: '/admin/chat-history', label: 'Chat History', icon: this.safe(this.I.clock) },
    { to: '/admin/agents',       label: 'Agents',       icon: this.safe(this.I.agents) },
    { to: '/admin/customers',    label: 'Customers',    icon: this.safe(this.I.users) },
    { to: '/admin/departments',  label: 'Departments',  icon: this.safe(this.I.dept) },
  ];

  private agentLinks: NavLink[] = [
    { to: '/agent/dashboard',    label: 'Dashboard',    icon: this.safe(this.I.grid) },
    { to: '/agent/my-chats',     label: 'My Chats',     icon: this.safe(this.I.chat) },
    { to: '/agent/chat-history', label: 'Chat History', icon: this.safe(this.I.clock) },
    { to: '/agent/profile',      label: 'Profile',      icon: this.safe(this.I.user) },
  ];

  get links(): NavLink[] { return this.role === 'admin' ? this.adminLinks : this.agentLinks; }

  logout() { this.auth.logout(); }
}
