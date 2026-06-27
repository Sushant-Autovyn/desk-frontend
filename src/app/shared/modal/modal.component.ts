import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-[9998] bg-black/50" (click)="onClose.emit()"></div>
      <div class="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div class="w-full pointer-events-all rounded-lg border border-border bg-card shadow-xl flex flex-col"
          [class]="sizeClass" style="max-height:88vh;overflow:hidden">
          <div class="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
            <h3 class="text-[13px] font-semibold text-foreground">{{ title }}</h3>
            <button (click)="onClose.emit()" class="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin">
            <ng-content></ng-content>
          </div>
        </div>
      </div>
    }
  `
})
export class ModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Output() onClose = new EventEmitter<void>();

  get sizeClass(): string {
    const map = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
    return map[this.size];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      document.body.style.overflow = this.isOpen ? 'hidden' : '';
    }
  }
}
