import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [authGuard(['admin'])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'live-chats', loadComponent: () => import('./features/admin/live-chats/live-chats.component').then(m => m.LiveChatsComponent) },
      { path: 'agents', loadComponent: () => import('./features/admin/agent-management/agent-management.component').then(m => m.AgentManagementComponent) },
      { path: 'departments', loadComponent: () => import('./features/admin/department-management/department-management.component').then(m => m.DepartmentManagementComponent) },
      { path: 'chat-history', loadComponent: () => import('./features/admin/chat-history/chat-history.component').then(m => m.ChatHistoryComponent) },
      { path: 'customers', loadComponent: () => import('./features/admin/customer-management/customer-management.component').then(m => m.CustomerManagementComponent) },
      { path: 'analytics', loadComponent: () => import('./features/admin/analytics/analytics.component').then(m => m.AnalyticsComponent) },
    ],
  },
  {
    path: 'agent',
    loadComponent: () => import('./features/agent/agent-layout/agent-layout.component').then(m => m.AgentLayoutComponent),
    canActivate: [authGuard(['agent'])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/agent/agent-dashboard/agent-dashboard.component').then(m => m.AgentDashboardComponent) },
      { path: 'my-chats', loadComponent: () => import('./features/agent/my-chats/my-chats.component').then(m => m.MyChatsComponent) },
      { path: 'chat-history', loadComponent: () => import('./features/agent/agent-chat-history/agent-chat-history.component').then(m => m.AgentChatHistoryComponent) },
      { path: 'profile', loadComponent: () => import('./features/agent/agent-profile/agent-profile.component').then(m => m.AgentProfileComponent) },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
