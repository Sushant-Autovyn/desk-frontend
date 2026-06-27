import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';
import { HeaderComponent } from '../../../shared/header/header.component';
import { SocketService } from '../../../core/services/socket.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="h-screen w-screen overflow-hidden bg-[#dde0e4] p-3 lg:p-4 flex gap-3 lg:gap-4 text-slate-900">
      <app-sidebar [isOpen]="sidebarOpen()" (setIsOpen)="sidebarOpen.set($event)"></app-sidebar>
      <div class="flex-1 flex flex-col gap-3 lg:gap-4 min-w-0 overflow-hidden">
        <app-header (onMenuToggle)="sidebarOpen.set(true)" [title]="pageTitle"></app-header>
        <main class="flex-1 overflow-y-auto rounded-[24px] bg-[#e9ebef] bg-cover bg-center bg-fixed shadow-[0_20px_50px_-30px_rgba(15,23,42,0.4)] px-4 md:px-6 py-5 scrollbar-thin"
          style="background-image:linear-gradient(rgba(244,246,249,0.52),rgba(238,241,245,0.56)),url('https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?auto=format&fit=crop&w=1600&q=80')">
          <div class="w-full h-full min-h-0">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    </div>
  `
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  private socket = inject(SocketService);
  private notif = inject(NotificationService);
  private router = inject(Router);

  sidebarOpen = signal(false);
  pageTitle = 'Admin Panel';

  private unsubNewTicket?: () => void;

  private titles: Record<string, string> = {
    dashboard: 'Dashboard Overview',
    'live-chats': 'Real-Time Chat Monitor',
    'chat-history': 'Conversation Archives',
    agents: 'Agent Directory',
    customers: 'Customer Directory',
    departments: 'Department Configuration',
    analytics: 'Analytics & Reports',
  };

  ngOnInit(): void {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      const path = this.router.url.split('/').pop() || 'dashboard';
      this.pageTitle = this.titles[path] || 'Admin Panel';
    });
    const path = this.router.url.split('/').pop() || 'dashboard';
    this.pageTitle = this.titles[path] || 'Admin Panel';

    this.unsubNewTicket = this.socket.onNewTicket((ticket) => {
      this.notif.newTicketAlert(ticket._id, ticket.name || 'Unknown', ticket.issue || 'New support request');
    });
  }

  ngOnDestroy(): void {
    this.unsubNewTicket?.();
  }
}
