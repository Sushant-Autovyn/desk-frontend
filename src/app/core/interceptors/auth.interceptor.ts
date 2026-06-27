import { HttpInterceptorFn, HttpClient, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { BACKEND_URL } from '../config';

const STORAGE_KEY = 'enterprise_auth_user';

// Shared refresh state so that if several requests get 401 at once, only ONE
// refresh call fires and the rest queue for the new token.
let isRefreshing = false;
const newTokenSubject = new BehaviorSubject<string | null>(null);

interface StoredUser { token?: string; refreshToken?: string; [k: string]: unknown; }

function readUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistTokens(token: string, refreshToken?: string): void {
  const user = readUser() || {};
  user.token = token;
  if (refreshToken) user.refreshToken = refreshToken;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

function forceLogout(router: Router): void {
  localStorage.removeItem(STORAGE_KEY);
  if (!router.url.includes('/login')) {
    router.navigate(['/login'], { replaceUrl: true });
  }
}

function withToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const http = inject(HttpClient);

  const user = readUser();
  const token = user?.token;
  const authReq = token ? withToken(req, token) : req;

  // Never run refresh logic on the auth endpoints themselves.
  const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/auth/refresh');

  return next(authReq).pipe(
    catchError(err => {
      if (err.status !== 401 || isAuthEndpoint) {
        return throwError(() => err);
      }

      const refreshToken = readUser()?.refreshToken;
      if (!refreshToken) {
        forceLogout(router);
        return throwError(() => err);
      }

      return handle401(req, next, http, router, refreshToken);
    })
  );
};

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  http: HttpClient,
  router: Router,
  refreshToken: string
): Observable<any> {
  // First 401 → kick off a single refresh; subsequent 401s wait for its result.
  if (!isRefreshing) {
    isRefreshing = true;
    newTokenSubject.next(null);

    return http.post<{ token: string; refreshToken: string }>(
      `${BACKEND_URL}/auth/refresh`,
      { refreshToken }
    ).pipe(
      switchMap(res => {
        isRefreshing = false;
        persistTokens(res.token, res.refreshToken);
        newTokenSubject.next(res.token);
        return next(withToken(req, res.token));
      }),
      catchError(refreshErr => {
        isRefreshing = false;
        forceLogout(router);
        return throwError(() => refreshErr);
      })
    );
  }

  // A refresh is already in flight — wait for the new token, then retry once.
  return newTokenSubject.pipe(
    filter(t => t !== null),
    take(1),
    switchMap(t => next(withToken(req, t as string)))
  );
}
