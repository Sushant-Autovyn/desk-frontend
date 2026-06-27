import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styles: [`
    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus,
    input:-webkit-autofill:active {
      -webkit-text-fill-color: #ffffff !important;
      -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
      box-shadow: 0 0 0 1000px transparent inset !important;
      transition: background-color 99999s ease-in-out 0s !important;
      caret-color: #ffffff;
    }
  `]
})
export class LoginComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  showPassword = signal(false);
  error = signal<string | null>(null);
  loading = signal(false);
  year = new Date().getFullYear();

  features = [
    { icon: `<svg class="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`, text: 'Role-based access for admins and agents' },
    { icon: `<svg class="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`, text: 'Real-time chat monitoring & assignment' },
    { icon: `<svg class="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`, text: 'Instant notifications and live ticket routing' },
    { icon: `<svg class="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`, text: 'Full conversation history and team analytics' },
  ];

  stats = [
    { value: '20K+', label: 'Daily Users' },
    { value: '99.9%', label: 'Uptime SLA' },
    { value: '<1s', label: 'Response' },
  ];

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      const role = this.auth.user()?.role;
      this.router.navigate([role === 'admin' ? '/admin/dashboard' : '/agent/dashboard'], { replaceUrl: true });
    }
  }

  async handleSubmit(): Promise<void> {
    this.error.set(null);
    if (!this.email || !this.password) { this.error.set('Please fill in all fields'); return; }
    this.loading.set(true);
    try {
      await this.auth.login(this.email, this.password);
      const role = this.auth.user()?.role;
      this.router.navigate([role === 'admin' ? '/admin/dashboard' : '/agent/dashboard'], { replaceUrl: true });
    } catch (err: any) {
      this.error.set(err?.error?.message || err?.message || 'Authentication failed. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
