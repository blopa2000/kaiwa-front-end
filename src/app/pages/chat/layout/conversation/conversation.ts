import { Component, inject, signal, NgZone, effect } from '@angular/core';
import { UserStore } from '../../../../core/store/user';
import { RoomsStore } from '../../../../core/store/rooms';
import { MessageService } from '../../../../core/services/message';
import { EmptyState } from '../../components/empty-state/empty-state';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../../environments/environment';
import { RoomsService } from '../../../../core/services/rooms';

@Component({
  selector: 'app-conversation',
  standalone: true,
  imports: [EmptyState, FormsModule, CommonModule],
  templateUrl: './conversation.html',
})
export class Conversation {
  private ngZone = inject(NgZone);
  userStore = inject(UserStore);
  roomsStore = inject(RoomsStore);
  roomsService = inject(RoomsService);
  messageService = inject(MessageService);

  messageText = '';
  socket: WebSocket | null = null;
  messages = signal<any[]>([]);

  // Usuario temporal (nuevo chat) seleccionado en búsqueda
  get activeUser() {
    return this.userStore.selectedUser();
  }

  // Room activa
  get activeRoom() {
    return this.roomsStore.activeRoom();
  }

  // Chat actual: puede ser usuario temporal o room
  get chat() {
    return this.activeUser || this.activeRoom;
  }

  // ID del usuario logueado
  get currentUserId() {
    return this.userStore.currentUser()?.id;
  }

  constructor() {
    // Efecto: conectar automáticamente WS al cambiar de room
    effect(() => {
      const room = this.activeRoom;
      if (room) {
        this.connectSocket(room.id);
        this.messages.set([]); // limpiar mensajes anteriores
      } else {
        console.log('seleccionado desde el input');

        this.socket?.close();
      }
    });
  }

  sendMessage() {
    const content = this.messageText.trim();
    const chat = this.chat;
    if (!content || !chat) return;

    // Primer mensaje (usuario temporal)

    if (this.activeUser) {
      this.messageService.sendFirstMessage({ content, recipient_id: chat.id }).subscribe((res) => {
        // Limpiamos input
        this.messageText = '';
        this.userStore.clearUser();

        // Obtenemos la última room creada
        this.roomsService.getLastRoom().subscribe((lastRoom) => {
          if (lastRoom) {
            console.log(lastRoom);

            // Actualizamos el store
            this.roomsStore.updateRoom(lastRoom);
            this.roomsStore.selectRoom(lastRoom);

            // Conectamos el WS de la room
            this.connectSocket(lastRoom.id);
          }
        });
      });
      return;
    }

    // Mensajes normales (room existente)
    this.socket?.send(JSON.stringify({ type: 'message', content }));
    this.messageText = '';
  }

  connectSocket(roomId: number) {
    const token = localStorage.getItem('access');
    if (!token) return;

    // Cierra socket anterior si existe
    this.socket?.close();

    // Abre nuevo socket para la room
    this.socket = new WebSocket(`${environment.socketUrl}/chat/${roomId}/?token=${token}`);

    // Recibir mensajes en tiempo real
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      this.ngZone.run(() => {
        console.log('WS mensaje recibido', data);

        if (data.type === 'message') {
          // Agregar al inicio del array (último arriba)
          this.messages.update((msgs) => [data, ...msgs]);

          // Actualizar last_message en RoomsStore
          if (this.activeRoom) {
            const updatedRoom = { ...this.activeRoom, last_message: data };
            this.roomsStore.updateRoom(updatedRoom);
          }
        }
      });
    };
  }
}
