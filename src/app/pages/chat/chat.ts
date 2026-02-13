import { Component, inject, signal, HostListener, effect, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Sidebar } from './layout/sidebar/sidebar';
import { Conversation } from './layout/conversation/conversation';
import { UserService } from '../../core/services/user';
import { UserStore } from '../../core/store/user';
import { RoomsStore } from '../../core/store/rooms';
import { AuthService } from '../../core/services/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [Sidebar, Conversation, CommonModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat implements OnDestroy {
  roomId: number | null = null;
  socket: WebSocket | null = null;

  private userService = inject(UserService);
  private authService = inject(AuthService);
  private router = inject(Router);
  userStore = inject(UserStore);
  roomsStore = inject(RoomsStore);

  // Control de vista móvil
  isMobile = signal(false);
  showSidebar = signal(true);

  // Timer para verificar token periódicamente
  private tokenCheckInterval?: any;

  @HostListener('window:resize')
  onResize() {
    this.checkMobile();
  }

  constructor() {
    // Escuchar cambios en el activeRoom para ocultar sidebar en móvil
    effect(() => {
      const room = this.roomsStore.activeRoom();
      const user = this.userStore.selectedUser();

      if ((room || user) && this.isMobile()) {
        this.showSidebar.set(false);
      }
    });
  }

  ngOnInit() {
    this.checkMobile();

    // Verificar token antes de hacer cualquier petición
    if (!this.authService.isAuthenticated()) {
      console.warn('Token inválido o expirado al cargar el chat');
      this.router.navigate(['/login']);
      return;
    }

    // Obtenemos el usuario logueado con token actual
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.userStore.setCurrentUser(user);
      },
      error: (err) => {
        console.error('No se pudo obtener el usuario logueado', err);

        // Si falla la petición inicial, probablemente el token expiró
        if (err.status === 401) {
          console.warn('Error 401 al cargar usuario, redirigiendo a login...');
          this.router.navigate(['/login']);
        }
      },
    });

    // Verificar el token cada 5 minutos
    this.startTokenCheck();
  }

  ngOnDestroy() {
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval);
    }
  }

  private startTokenCheck() {
    // Verificar cada 5 minutos si el token sigue válido
    this.tokenCheckInterval = setInterval(
      () => {
        const remainingTime = this.authService.getTokenRemainingTime();

        if (remainingTime !== null && remainingTime <= 0) {
          console.warn('Token expirado detectado, cerrando sesión...');
          this.authService.logout();
        } else if (remainingTime !== null && remainingTime <= 5) {
          console.warn(`Token expirará en ${remainingTime} minutos`);
          // Aquí podrías mostrar una notificación al usuario
        }
      },
      5 * 60 * 1000,
    ); // Cada 5 minutos
  }

  checkMobile() {
    this.isMobile.set(window.innerWidth < 768);
  }

  toggleSidebar(): void {
    this.showSidebar.update((v) => !v);
  }

  showSidebarView(): void {
    this.showSidebar.set(true);
  }
}
