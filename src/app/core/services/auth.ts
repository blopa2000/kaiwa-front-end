import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { TokenService } from './token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private API_URL = 'http://localhost:8000/api';

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
  ) {}

  login(data: { email: string; password: string }) {
    return this.http.post<any>(`${this.API_URL}/users/login/`, data).pipe(
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
    return this.http.post(`${this.API_URL}/users/register/`, data);
  }

  logout(): void {
    this.tokenService.removeToken();
  }

  isAuthenticated(): boolean {
    return this.tokenService.isLoggedIn();
  }
}
