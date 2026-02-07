import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { RoomsStore } from '../store/rooms';

@Injectable({ providedIn: 'root' })
export class RoomsSocketService {
  private ws!: WebSocket;

  constructor(private roomsStore: RoomsStore) {}

  connect(token: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return; // ya está conectado
    }
    const url = `${environment.socketUrl}/rooms/?token=${token}`;
    this.ws = new WebSocket(url);

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'rooms_list') {
        this.roomsStore.setRooms(data.rooms);
      }

      if (data.type === 'room_update') {
        this.roomsStore.updateRoom(data.room);
      }

      if (data.type === 'new_message') {
        const { room_id, message } = data;
        this.roomsStore.updateRoomLastMessage(room_id, message);
      }

      if (data.type === 'room_created') {
        this.roomsStore.addRoom(data.room);
      }
    };
  }

  disconnect() {
    if (this.ws) this.ws.close();
  }
}
