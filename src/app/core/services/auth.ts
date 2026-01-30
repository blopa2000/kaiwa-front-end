import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { TokenService } from './token';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // estado global
  isAuthenticated = signal<boolean>(this.hasToken());

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
  ) {}

  private hasToken(): boolean {
    return !!localStorage.getItem('access');
  }

  login(data: { email: string; password: string }) {
    return this.http.post<any>(`${environment.apiUrl}/users/login/`, data).pipe(
      tap((res) => {
        this.tokenService.setToken(res.access);
      }),
    );
  }

  register(data: {
    email: string;
    username: string;
    password: string;
    first_name: string;
    last_name: string;
  }) {
    return this.http.post(`${environment.apiUrl}/users/register/`, data);
  }

  setSession(access: string, refresh: string) {
    localStorage.setItem('access', access);
    localStorage.setItem('refresh', refresh);
    this.isAuthenticated.set(true);
  }

  logout() {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    this.isAuthenticated.set(false);
  }
}
