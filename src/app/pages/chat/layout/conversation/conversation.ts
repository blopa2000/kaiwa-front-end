import { Component, inject, signal } from '@angular/core';
import { UserStore } from '../../../../core/store/user';
import { RoomsStore } from '../../../../core/store/rooms';
import { MessageService } from '../../../../core/services/message';
import { EmptyState } from '../../components/empty-state/empty-state';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-conversation',
  standalone: true,
  imports: [EmptyState, FormsModule, CommonModule],
  templateUrl: './conversation.html',
})
export class Conversation {
  userStore = inject(UserStore);
  roomsStore = inject(RoomsStore);
  messageService = inject(MessageService);

  messageText = '';
  socket: WebSocket | null = null;
  messages = signal<any[]>([]);

  // Usuario temporal (nuevo chat) o room activa
  get activeUser() {
    return this.userStore.selectedUser();
  }

  get activeRoom() {
    return this.roomsStore.activeRoom();
  }

  get chat() {
    return this.activeUser || this.activeRoom;
  }

  // Actualiza la lista de mensajes según chat activo
  updateMessages() {
    this.messages.set(this.chat?.messages ?? []);
  }

  sendMessage() {
    const content = this.messageText.trim();
    const chat = this.chat;
    if (!content || !chat) return;

    // Primer mensaje (usuario nuevo)
    if (this.activeUser) {
      this.messageService
        .sendFirstMessage({
          content,
          recipient_id: chat.id,
        })
        .subscribe((res) => {
          const room = res.room;

          // Guardamos nueva room
          this.roomsStore.updateRoom(room);

          // Limpiamos usuario temporal
          this.userStore.clearUser();

          // Seleccionamos la room activa
          this.roomsStore.selectRoom(room);

          // Abrimos el socket
          this.connectSocket(room.id);

          this.messageText = '';
        });

      return;
    }

    // Mensajes normales (room existente)
    this.socket?.send(
      JSON.stringify({
        type: 'message',
        content,
      }),
    );

    this.messageText = '';
  }

  connectSocket(roomId: number) {
    const token = localStorage.getItem('access');
    if (!token) return;

    // Cierra socket previo si existe
    this.socket?.close();

    // Abre nuevo socket
    this.socket = new WebSocket(`${environment.socketUrl}/chat/${roomId}/?token=${token}`);

    // Recibir mensajes en tiempo real
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'message') {
        // Actualiza mensajes de la room
        const updatedRoom = { ...this.activeRoom, last_message: data.message };

        // Actualiza store
        this.roomsStore.updateRoom(updatedRoom);

        // Refresca mensajes locales
        this.updateMessages();
      }
    };
  }
}
