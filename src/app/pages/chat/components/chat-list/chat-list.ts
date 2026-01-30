import { Component, EventEmitter, Output, inject } from '@angular/core';
import { ChatStore } from '../../../../core/services/chat-store';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  templateUrl: './chat-list.html',
})
export class ChatList {
  chatStore = inject(ChatStore);

  @Output() chatSelected = new EventEmitter<any>();

  select(chat: any) {
    this.chatStore.selectChat(chat);
    this.chatSelected.emit(chat);
  }
}
