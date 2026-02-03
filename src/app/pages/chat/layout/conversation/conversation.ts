import { Component, inject, signal, effect } from '@angular/core';
import { UserStore } from '../../../../core/store/user';
import { RoomsStore } from '../../../../core/store/rooms';
import { MessageService } from '../../../../core/services/message';
import { RoomsService } from '../../../../core/services/rooms';
import { ConversationSocketService } from '../../../../core/services/conversation-socket';
import { EmptyState } from '../../components/empty-state/empty-state';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-conversation',
  standalone: true,
  imports: [EmptyState, FormsModule, CommonModule],
  templateUrl: './conversation.html',
})
export class Conversation {
  userStore = inject(UserStore);
  roomsStore = inject(RoomsStore);
  roomsService = inject(RoomsService);
  messageService = inject(MessageService);
  socketService = inject(ConversationSocketService);

  messageText = '';
  messages = signal<any[]>([]);
  private lastChatId: number | null = null;
  private lastChatType: 'room' | 'user' | null = null;

  /* ===== getters ===== */

  get activeUser() {
    return this.userStore.selectedUser();
  }

  get activeRoom() {
    return this.roomsStore.activeRoom();
  }

  get chat() {
    return this.activeUser || this.activeRoom;
  }

  get currentUserId() {
    return this.userStore.currentUser()?.id;
  }

  constructor() {
    effect(() => {
      const room = this.activeRoom;
      const user = this.activeUser;
      // 🧠 Determinar chat actual
      const currentChatId = room?.id ?? user?.id ?? null;
      const currentChatType = room ? 'room' : user ? 'user' : null;

      // 🔥 Reset visual total al cambiar de chat
      if (user || currentChatId !== this.lastChatId || currentChatType !== this.lastChatType) {
        this.messages.set([]);
        this.messageText = '';
        this.socketService.disconnect();

        this.lastChatId = currentChatId;
        this.lastChatType = currentChatType;
      }

      // Usuario nuevo (aún sin room)
      if (user) {
        return;
      }

      // Cerramos cualquier socket previo
      if (!user) {
        this.socketService.disconnect();
      }

      // Room existente
      if (room) {
        const roomId = room.id;

        this.socketService.connect(roomId);

        this.socketService.onMessage((msg) => {
          // Ignorar mensajes que no sean del room activo
          if (this.activeRoom?.id !== roomId) return;

          this.messages.update((msgs) => {
            // 🚫 evitar duplicados
            if (msgs.some((m) => m.id === msg.id)) {
              return msgs;
            }
            return [msg, ...msgs];
          });
        });
      }
    });
  }

  sendMessage() {
    const content = this.messageText.trim();
    if (!content || !this.chat) return;

    // PRIMER MENSAJE (no hay room)
    if (this.activeUser) {
      this.messageService
        .sendFirstMessage({
          content,
          recipient_id: this.activeUser.id,
        })
        .subscribe(() => {
          this.messageText = '';
          this.userStore.clearUser();

          this.roomsService.getLastRoom().subscribe((room) => {
            if (!room) return;
            this.roomsStore.updateRoom(room);
            this.roomsStore.selectRoom(room);
          });
        });
      return;
    }

    // ROOM EXISTENTE
    this.socketService.send(content);
    this.messageText = '';
  }
}
