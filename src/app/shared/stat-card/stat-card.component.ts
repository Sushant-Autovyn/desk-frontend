import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export type StatColor = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'pink';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="group relative rounded-2xl border border-slate-200/70 bg-white overflow-hidden flex flex-col gap-4 p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 shadow-sm">
      <!-- colored accent strip (left, vertical) -->
      <div class="absolute top-0 left-0 bottom-0 w-1" [class]="stripClass"></div>

      <div class="flex items-start justify-between">
        <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">{{ title }}</span>
        <div class="flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-110" [class]="iconBgClass">
          <span class="[&>svg]:h-[18px] [&>svg]:w-[18px]" [class]="iconTextClass" [innerHTML]="iconSvg"></span>
        </div>
      </div>

      <div>
        <p class="text-[28px] font-bold text-slate-900 tabular-nums leading-none tracking-tight">{{ value }}</p>
        @if (trend) {
          <p class="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
            <span class="inline-flex items-center gap-0.5 font-bold" [class]="trend.isPositive ? 'text-emerald-600' : 'text-rose-500'">
              @if (trend.isPositive) {
                <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>
              } @else {
                <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              }
              {{ trend.value }}
            </span>
            <span>{{ trend.label }}</span>
          </p>
        } @else {
          <p class="mt-2 h-4"></p>
        }
      </div>
    </div>
  `
})
export class StatCardComponent {
  @Input() title = '';
  @Input() value: string | number = 0;
  @Input() icon: 'message' | 'check' | 'users' | 'usercheck' | 'trending' | 'clock' | 'star' | 'zap' = 'message';
  @Input() color: StatColor = 'primary';
  @Input() trend?: { value: string; isPositive: boolean; label: string };

  private sanitizer = inject(DomSanitizer);

  private palette: Record<StatColor, { strip: string; iconBg: string; iconText: string }> = {
    primary: { strip: 'bg-blue-500',    iconBg: 'bg-blue-50',    iconText: 'text-blue-600' },
    success: { strip: 'bg-emerald-500', iconBg: 'bg-emerald-50', iconText: 'text-emerald-600' },
    warning: { strip: 'bg-amber-400',   iconBg: 'bg-amber-50',   iconText: 'text-amber-600' },
    danger:  { strip: 'bg-red-500',     iconBg: 'bg-red-50',     iconText: 'text-red-600' },
    info:    { strip: 'bg-sky-500',     iconBg: 'bg-sky-50',     iconText: 'text-sky-600' },
    pink:    { strip: 'bg-pink-500',    iconBg: 'bg-pink-50',    iconText: 'text-pink-600' },
  };

  private icons: Record<string, string> = {
    message: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    usercheck: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>`,
    trending: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
    clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    star: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    zap: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  };

  get stripClass(): string { return this.palette[this.color].strip; }
  get iconBgClass(): string { return this.palette[this.color].iconBg; }
  get iconTextClass(): string { return this.palette[this.color].iconText; }
  get iconSvg(): SafeHtml { return this.sanitizer.bypassSecurityTrustHtml(this.icons[this.icon] || this.icons['message']); }
}
