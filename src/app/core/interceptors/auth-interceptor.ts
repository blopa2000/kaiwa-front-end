import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TokenService } from '../services/token';
import { AuthService } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);

  // Endpoints públicos (NO token)
  if (req.url.includes('/login') || req.url.includes('/register')) {
    return next(req);
  }

  // Verificar si el token ha expirado ANTES de hacer la petición
  if (!authService.isAuthenticated()) {
    console.warn('Token expirado antes de la petición, redirigiendo...');
    tokenService.removeToken();
    router.navigate(['/login']);
    return throwError(() => new Error('Token expirado'));
  }

  const token = tokenService.getToken();

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        console.warn('Error 401: Sesión expirada o no autorizada');

        tokenService.removeToken();

        // evita redirecciones repetidas
        if (!router.url.includes('login')) {
          router.navigate(['/login']);
        }
      }

      return throwError(() => error);
    }),
  );
};
