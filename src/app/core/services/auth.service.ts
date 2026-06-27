import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { SocketService } from './socket.service';
import { AuthenticatedUser } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private socket = inject(SocketService);
  private router = inject(Router);

  private _user = signal<AuthenticatedUser | null>(null);
  private _loading = signal(true);
  private _theme = signal<'light' | 'dark'>('light');

  readonly user = this._user.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly theme = this._theme.asReadonly();
  readonly isAuthenticated = computed(() => !!this._user());

  constructor() {
    this.api.initStorage();
  }

  restoreSession(): void {
    const stored = localStorage.getItem('enterprise_auth_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this._user.set(parsed);
        this.socket.connect();
        this.socket.joinCompany(null);
      } catch {
        localStorage.removeItem('enterprise_auth_user');
      }
    }

    // Admin/agent console uses a fixed LIGHT theme to match the dashboard design.
    this.applyTheme('light');
    this._loading.set(false);
  }

  async login(email: string, password: string): Promise<void> {
    this._loading.set(true);
    try {
      const data = await this.api.login(email, password);
      this._user.set(data);
      localStorage.setItem('enterprise_auth_user', JSON.stringify(data));
      this.socket.connect();
      this.socket.joinCompany(null);
    } finally {
      this._loading.set(false);
    }
  }

  logout(): void {
    const u = this._user();
    if (u) this.api.logActivity(`${u.name} logged out`, u.name, u.role);
    this.socket.disconnect();
    this._user.set(null);
    localStorage.removeItem('enterprise_auth_user');
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  toggleTheme(): void {
    const next = this._theme() === 'light' ? 'dark' : 'light';
    this.applyTheme(next);
    localStorage.setItem('enterprise_theme', next);
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    this._theme.set(theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}
