import { Component, inject } from '@angular/core';
import { Sidebar } from './layout/sidebar/sidebar';
import { Conversation } from './layout/conversation/conversation';
import { UserService } from '../../core/services/user';
import { UserStore } from '../../core/store/user';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [Sidebar, Conversation],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat {
  roomId: number | null = null;
  socket: WebSocket | null = null;

  private userService = inject(UserService);
  private userStore = inject(UserStore);

  ngOnInit() {
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
}
