import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ChatStore {
  chats = signal<any[]>([]);
  activeChat = signal<any | null>(null);

  selectChat(chat: any) {
    this.activeChat.set(chat);
  }

  addChat(chat: any) {
    const exists = this.chats().some((c) => c.id === chat.id);
    if (!exists) {
      this.chats.set([chat, ...this.chats()]);
    }
    this.activeChat.set(chat);
  }
}
