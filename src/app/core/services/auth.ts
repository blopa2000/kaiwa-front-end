import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { TokenService } from './token';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private tokenService = inject(TokenService);
  private router = inject(Router);

  // estado global
  isAuthenticatedSignal = signal<boolean>(this.checkAuthentication());

  private checkAuthentication(): boolean {
    const token = this.getToken();

    if (!token) {
      return false;
    }

    // Verificar si el token ha expirado
    if (this.isTokenExpired(token)) {
      console.warn('Token expirado detectado al iniciar');
      this.logout();
      return false;
    }

    return true;
  }

  private getToken(): string | null {
    return localStorage.getItem('access');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();

    if (!token) {
      return false;
    }

    // Verificar si el token ha expirado
    if (this.isTokenExpired(token)) {
      console.warn('Token expirado, cerrando sesión');
      this.logout();
      return false;
    }

    return true;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convertir a milisegundos
      return Date.now() >= exp;
    } catch (error) {
      console.error('Error al decodificar token:', error);
      return true; // Si no se puede decodificar, considerarlo expirado
    }
  }

  // Obtener tiempo restante del token en minutos
  getTokenRemainingTime(): number | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      const remaining = exp - Date.now();
      return Math.floor(remaining / 1000 / 60); // Retornar en minutos
    } catch {
      return null;
    }
  }

  login(data: { email: string; password: string }) {
    return this.http.post<any>(`${environment.apiUrl}/users/login/`, data).pipe(
      tap((res) => {
        this.tokenService.setToken(res.access);

        // Si también devuelve refresh token, guardarlo
        if (res.refresh) {
          localStorage.setItem('refresh', res.refresh);
        }

        this.isAuthenticatedSignal.set(true);
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

  setSession(access: string, refresh?: string) {
    localStorage.setItem('access', access);

    if (refresh) {
      localStorage.setItem('refresh', refresh);
    }

    this.isAuthenticatedSignal.set(true);
  }

  logout() {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    this.tokenService.removeToken();
    this.isAuthenticatedSignal.set(false);

    // Redirigir al login
    if (!this.router.url.includes('login')) {
      this.router.navigate(['/login']);
    }
  }
}
