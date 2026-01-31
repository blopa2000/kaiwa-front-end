import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ConversationSocketService {
  private ws!: WebSocket;
  private messageCallback?: (msg: any) => void;

  connectWithUser(userId: number) {
    const token = localStorage.getItem('token');
    this.ws = new WebSocket(`ws://.../ws/conversation/user/${userId}/?token=${token}`);
    this.setupListeners();
  }

  connectWithRoom(roomId: number) {
    const token = localStorage.getItem('token');
    this.ws = new WebSocket(`ws://.../ws/conversation/room/${roomId}/?token=${token}`);
    this.setupListeners();
  }

  private setupListeners() {
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'message' && this.messageCallback) {
        this.messageCallback(data.message);
      }
    };
  }

  onMessage(cb: (msg: any) => void) {
    this.messageCallback = cb;
  }

  sendMessage(content: string) {
    this.ws.send(JSON.stringify({ content }));
  }

  disconnect() {
    if (this.ws) this.ws.close();
  }
}
