import { Injectable, NgZone } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ConversationSocketService {
  private socket: WebSocket | null = null;
  private onMessageCb?: (message: any) => void;

  constructor(private ngZone: NgZone) {}

  connect(roomId: number) {
    const token = localStorage.getItem('access');
    if (!token) return;

    this.disconnect();

    this.socket = new WebSocket(`${environment.socketUrl}/chat/${roomId}/?token=${token}`);

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type !== 'message') return;

      this.ngZone.run(() => {
        this.onMessageCb?.(data);
      });
    };
  }

  send(content: string) {
    if (!this.socket) return;

    this.socket.send(
      JSON.stringify({
        type: 'message',
        content,
      }),
    );
  }

  onMessage(cb: (message: any) => void) {
    this.onMessageCb = cb;
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
  }
}
