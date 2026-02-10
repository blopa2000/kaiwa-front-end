import { Component, inject, signal, effect, ElementRef, ViewChild } from '@angular/core';
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
  loadingOlder = false;
  hasMore = true;
  private lastChatId: number | null = null;
  private lastChatType: 'room' | 'user' | null = null;

  @ViewChild('messagesContainer', { static: false })
  container!: ElementRef;

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

  private scrollToBottom() {
    setTimeout(() => {
      if (!this.container) return;
      const el = this.container.nativeElement;
      el.scrollTop = el.scrollHeight;
    }, 50);
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
      this.hasMore = true;

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

            return [...msgs, msg];
          });
          this.scrollToBottom();
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

        // conectar presence
        const token = localStorage.getItem('access');
        if (token && !this.presenceSocket.isConnected()) {
          this.presenceSocket.connect(token);
          this.presenceSocket.onPresence(({ user_id, status }) => {
            this.roomsStore.updateUserStatus(user_id, status);
          });
        }

        setTimeout(() => {
          const unreadIds = this.messages()
            .filter((m) => !m.read_at && m.sender_id !== this.currentUserId)
            .map((m) => m.id);

          if (unreadIds.length) {
            this.socketService.markAsRead(unreadIds);
          }
        }, 100);

        // bajar scroll inicial
        setTimeout(() => this.scrollToBottom(), 100);
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

  onScroll(event: any) {
    const element = event.target;

    // console.log(element.scrollTop);
    // console.log(this.loadingOlder);
    // console.log(this.hasMore);

    if (element.scrollTop <= 10 && !this.loadingOlder && this.hasMore) {
      this.loadOlderMessages(() => {
        // mover un poco el scroll hacia abajo
        element.scrollTop = 50;
      });
    }
  }

  loadOlderMessages(callback?: () => void) {
    if (!this.activeRoom || this.loadingOlder) return;

    const msgs = this.messages();
    if (!msgs.length) return;

    const oldestId = msgs[0].id;

    this.loadingOlder = true;

    this.messageService.getOlderMessages(this.activeRoom.id, oldestId).subscribe((res) => {
      this.messages.update((current) => {
        const existingIds = new Set(current.map((m) => m.id));
        const newMsgs = res.results.filter((m: any) => !existingIds.has(m.id));
        return [...newMsgs, ...current];
      });

      this.hasMore = res.results.length > 0;

      this.loadingOlder = false;

      callback?.();
    });
  }
}
