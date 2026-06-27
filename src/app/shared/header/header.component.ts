import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

interface Tab { to: string; label: string; }

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  styles: [':host { display: contents; }'],
  template: `
    <header class="flex h-[68px] shrink-0 w-full items-center justify-between rounded-[22px] bg-[#3a4150] shadow-[0_20px_50px_-30px_rgba(15,23,42,0.4)] px-4 sm:px-5">

      <!-- Left: hamburger + pill nav + search -->
      <div class="flex items-center gap-3 min-w-0">
        <button (click)="onMenuToggle.emit()" class="rounded-xl p-2 text-slate-300 hover:bg-white/10 hover:text-white transition-colors lg:hidden">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>

        <!-- Search bar -->
        <div class="hidden md:flex items-center gap-2.5 rounded-full bg-white/10 px-4 h-10 w-72 focus-within:bg-white/15 transition-colors">
          <svg class="h-[18px] w-[18px] text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Search tickets, agents, customers…" class="w-full bg-transparent text-[13px] text-white placeholder-slate-400 outline-none"/>
        </div>

        <span class="md:hidden text-[15px] font-bold text-white truncate">{{ title || 'Dashboard' }}</span>
      </div>

      <!-- Right: action + bell + profile -->
      <div class="flex items-center gap-2.5 shrink-0">
        <a [routerLink]="action.to" class="hidden sm:inline-flex items-center gap-2 rounded-full bg-white px-4 h-10 text-[13px] font-semibold text-slate-900 hover:bg-slate-100 transition-colors">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          {{ action.label }}
        </a>

        <button (click)="notification.clearAlertCount()" class="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-slate-300 hover:text-white hover:bg-white/15 transition-colors">
          <svg class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          @if (alertCount() > 0) {
            <span class="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white leading-none ring-2 ring-[#3a4150]">
              {{ alertCount() > 9 ? '9+' : alertCount() }}
            </span>
          }
        </button>

        <div class="relative">
          <button (click)="dropdownOpen.set(!dropdownOpen())"
            class="flex items-center gap-2.5 rounded-full bg-white/10 pl-1.5 pr-3 h-10 hover:bg-white/15 transition-all">
            <div class="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-[10px] shrink-0">{{ initials }}</div>
            <div class="hidden sm:block text-left">
              <p class="text-[12px] font-semibold text-white leading-none max-w-[100px] truncate">{{ user?.name }}</p>
              <p class="text-[10px] text-slate-300 capitalize leading-none mt-0.5">{{ user?.role }}</p>
            </div>
            <svg class="h-3 w-3 text-slate-300 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </button>

          @if (dropdownOpen()) {
            <div class="fixed inset-0 z-40" (click)="dropdownOpen.set(false)"></div>
            <div class="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden animate-scale-in">
              <div class="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                <p class="text-[13px] font-semibold text-slate-800 truncate">{{ user?.name }}</p>
                <p class="text-[11px] text-slate-400 truncate mt-0.5">{{ user?.email }}</p>
              </div>
              <div class="p-1.5">
                <a [routerLink]="user?.role === 'admin' ? '/admin/dashboard' : '/agent/profile'" (click)="dropdownOpen.set(false)"
                  class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] text-slate-700 hover:bg-slate-100 transition-colors">
                  <svg class="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  My Profile
                </a>
                <button (click)="dropdownOpen.set(false); auth.logout()" class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] text-rose-500 hover:bg-rose-50 transition-colors">
                  <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Sign out
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent {
  @Input() title?: string;
  @Output() onMenuToggle = new EventEmitter<void>();

  auth = inject(AuthService);
  notification = inject(NotificationService);

  dropdownOpen = signal(false);

  get user() { return this.auth.user(); }
  get initials() { return this.user?.name?.substring(0, 2).toUpperCase() ?? '??'; }
  get alertCount() { return this.notification.alertCount; }

  private adminTabs: Tab[] = [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/live-chats', label: 'Live Chats' },
    { to: '/admin/chat-history', label: 'Reports' },
  ];
  private agentTabs: Tab[] = [
    { to: '/agent/dashboard', label: 'Dashboard' },
    { to: '/agent/my-chats', label: 'My Chats' },
    { to: '/agent/chat-history', label: 'History' },
  ];

  get tabs(): Tab[] { return this.user?.role === 'admin' ? this.adminTabs : this.agentTabs; }

  get action(): { to: string; label: string } {
    return this.user?.role === 'admin'
      ? { to: '/admin/live-chats', label: 'Open Live Chats' }
      : { to: '/agent/my-chats', label: 'Open My Chats' };
  }
}
