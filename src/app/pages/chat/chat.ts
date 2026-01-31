import { Component, inject } from '@angular/core';
import { Sidebar } from './layout/sidebar/sidebar';
import { Conversation } from './layout/conversation/conversation';

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

  messageText = '';
}
