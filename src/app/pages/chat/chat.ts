import { Component, inject, signal, HostListener, effect } from '@angular/core';
import { Sidebar } from './layout/sidebar/sidebar';
import { Conversation } from './layout/conversation/conversation';
import { UserService } from '../../core/services/user';
import { UserStore } from '../../core/store/user';
import { RoomsStore } from '../../core/store/rooms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [Sidebar, Conversation, CommonModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat {
  roomId: number | null = null;
  socket: WebSocket | null = null;

  private userService = inject(UserService);
  userStore = inject(UserStore);
  roomsStore = inject(RoomsStore);

  // Control de vista móvil
  isMobile = signal(false);
  showSidebar = signal(true);

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

    // Obtenemos el usuario logueado con token actual
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.userStore.setCurrentUser(user);
      },
      error: (err) => {
        console.error('No se pudo obtener el usuario logueado', err);
      },
    });
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
