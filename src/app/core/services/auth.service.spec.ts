import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
      ],
    });
    localStorage.clear();
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start unauthenticated', () => {
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.user()).toBeNull();
  });

  it('should restore session from localStorage', () => {
    const fakeUser = { name: 'Alice', email: 'alice@test.com', role: 'admin', token: 'tok123' };
    localStorage.setItem('enterprise_auth_user', JSON.stringify(fakeUser));
    service.restoreSession();
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.user()?.name).toBe('Alice');
  });

  it('should apply dark theme', () => {
    localStorage.setItem('enterprise_theme', 'dark');
    service.restoreSession();
    expect(document.documentElement.classList.contains('dark')).toBeTrue();
  });

  it('should logout and clear user', () => {
    const fakeUser = { name: 'Bob', email: 'b@test.com', role: 'agent', token: 't' };
    localStorage.setItem('enterprise_auth_user', JSON.stringify(fakeUser));
    service.restoreSession();
    service.logout();
    expect(service.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem('enterprise_auth_user')).toBeNull();
  });

  it('should toggle theme', () => {
    service.restoreSession();
    const initial = service.theme();
    service.toggleTheme();
    expect(service.theme()).not.toBe(initial);
  });
});
