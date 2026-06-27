import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { NotificationOverlayComponent } from './shared/notification-overlay/notification-overlay.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NotificationOverlayComponent],
  template: `
    <router-outlet />
    <app-notification-overlay />
  `,
  styles: [':host { display: block; height: 100dvh; }']
})
export class App implements OnInit {
  private auth = inject(AuthService);

  ngOnInit(): void {
    this.auth.restoreSession();
  }
}
