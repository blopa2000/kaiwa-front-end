import { Component, inject, signal, effect } from '@angular/core';
import { UserStore } from '../../../../core/store/user';
import { RoomsStore } from '../../../../core/store/rooms';
import { MessageService } from '../../../../core/services/message';
import { RoomsService } from '../../../../core/services/rooms';
import { ConversationSocketService } from '../../../../core/services/conversation-socket';
import { PresenceSocketService } from '../../../../core/services/presence-socket';

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
  presenceSocket = inject(PresenceSocketService);

  messageText = '';
  messages = signal<any[]>([]);
  typingTimeout?: any;
  private lastChatId: number | null = null;
  private lastChatType: 'room' | 'user' | null = null;

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
    // CALLBACK global para mensajes leídos
    this.socketService.onRead((payload) => {
      const { message_ids } = payload;
      this.messages.update((msgs) =>
        msgs.map((m) =>
          message_ids.includes(m.id) ? { ...m, read_at: new Date().toISOString() } : m,
        ),
      );
    });

    // CALLBACK global para mensajes directos
    this.socketService.onMessage((msg) => {
      if (this.activeUser && msg.sender_id === this.activeUser.id) {
        this.messages.update((msgs) => {
          if (msgs.some((m) => m.id === msg.id)) return msgs;
          return [msg, ...msgs];
        });

        if (msg.sender_id !== this.currentUserId && !msg.read_at) {
          this.socketService.markAsRead([msg.id]);
        }
      }
    });

    // Effect principal: cambiar de chat / room
    effect(() => {
      const room = this.activeRoom;
      const user = this.activeUser;

      const currentChatId = room?.id ?? user?.id ?? null;
      const currentChatType = room ? 'room' : user ? 'user' : null;

      const chatChanged =
        currentChatId !== this.lastChatId || currentChatType !== this.lastChatType;

      if (!chatChanged && !user) return;

      // reset visual
      this.messages.set([]);
      this.messageText = '';
      this.socketService.disconnect();
      this.presenceSocket.disconnect();

      this.lastChatId = currentChatId;
      this.lastChatType = currentChatType;

      if (user) return; // chat directo, no socket

      if (room) {
        const roomId = room.id;
        this.socketService.connect(roomId);

        // 1️⃣ Marcar los mensajes existentes como leídos al entrar a la room
        setTimeout(() => {
          const unreadIds = this.messages()
            .filter((m) => !m.read_at && m.sender_id !== this.currentUserId)
            .map((m) => m.id);

          if (unreadIds.length) {
            this.socketService.markAsRead(unreadIds);
          }
        }, 100);

        // 2️⃣ Escuchar nuevos mensajes
        this.socketService.onMessage((msg) => {
          if (this.activeRoom?.id !== roomId) return;

          this.messages.update((msgs) => {
            if (msgs.some((m) => m.id === msg.id)) return msgs;

            // marcar como leído si no es nuestro
            if (msg.sender_id !== this.currentUserId && !msg.read_at) {
              this.socketService.markAsRead([msg.id]);
            }

            return [msg, ...msgs];
          });
        });

        // 3️⃣ Escuchar eventos de read
        this.socketService.onRead((payload) => {
          const { message_ids } = payload;
          this.messages.update((msgs) =>
            msgs.map((m) =>
              message_ids.includes(m.id) ? { ...m, read_at: new Date().toISOString() } : m,
            ),
          );
        });
      }
    });
  }

  onInputChange() {
    this.presenceSocket.sendTyping();
    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.presenceSocket.sendOnline();
    }, 1000);
  }

  sendMessage() {
    const content = this.messageText.trim();
    if (!content || !this.chat) return;

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

    // ROOM existente
    this.socketService.send(content);
    this.messageText = '';
  }
}
