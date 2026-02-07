import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ConversationSocketService {
  private socket: WebSocket | null = null;
  private onMessageCbs: ((msg: any) => void)[] = [];
  private onReadCbs: ((payload: any) => void)[] = [];

  connect(roomId: number) {
    const token = localStorage.getItem('access');
    if (!token) return;

    this.disconnect();

    this.socket = new WebSocket(`${environment.socketUrl}/chat/${roomId}/?token=${token}`);

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'message') this.onMessageCbs.forEach((cb) => cb(data));
      if (data.type === 'read') this.onReadCbs.forEach((cb) => cb(data));
    };
  }

  markAsRead(messageIds: number[]) {
    if (!this.socket || !messageIds.length) return;

    const send = () => {
      this.socket!.send(JSON.stringify({ type: 'read', message_ids: messageIds }));
    };

    if (this.socket.readyState === WebSocket.OPEN) send();
    else this.socket.addEventListener('open', send, { once: true });
  }

  send(content: string) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify({ type: 'message', content }));
  }

  onMessage(cb: (msg: any) => void) {
    this.onMessageCbs.push(cb);
  }

  onRead(cb: (payload: any) => void) {
    this.onReadCbs.push(cb);
  }

  disconnect() {
    if (!this.socket) return;
    if (
      this.socket.readyState === WebSocket.OPEN ||
      this.socket.readyState === WebSocket.CONNECTING
    ) {
      this.socket.close();
    }
    this.socket = null;
    this.onMessageCbs = [];
    this.onReadCbs = [];
  }
}
