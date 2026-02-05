// core/services/presence-socket.service.ts
import { Injectable, NgZone } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PresenceSocketService {
  private ws?: WebSocket;
  private callbacks: ((data: any) => void)[] = [];

  constructor(private zone: NgZone) {}

  connect(token: string) {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
    )
      return;

    const url = `${environment.socketUrl}/presence/?token=${token}`;
    this.ws = new WebSocket(url);

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.zone.run(() => {
        if (data.type === 'presence_snapshot') {
          data.users.forEach((u: any) => {
            this.callbacks.forEach((cb) => cb({ user_id: u.user_id, status: u.status }));
          });
          return;
        }

        if (data.type === 'presence_update' || data.type === 'status_response') {
          this.callbacks.forEach((cb) =>
            cb({
              user_id: data.user_id,
              status: data.status,
            }),
          );
        }
      });
    };

    this.ws.onclose = () => {
      this.ws = undefined;
    };
  }

  isConnected(): boolean {
    return !!this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  onPresence(cb: (data: { user_id: number; status: 'online' | 'offline' }) => void) {
    this.callbacks.push(cb);
  }

  sendTyping() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'typing' }));
  }

  sendOnline() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'ping' }));
  }

  disconnect() {
    if (this.ws) {
      //cerrar solo si está abierto o en proceso de conexión
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }

      // limpiar referencia
      this.ws = undefined;

      //limpiar callbacks
      this.callbacks = [];
    }
  }
}
