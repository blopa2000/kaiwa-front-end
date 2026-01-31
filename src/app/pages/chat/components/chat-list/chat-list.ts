import { Component, inject, effect } from '@angular/core';
import { RoomsStore } from '../../../../core/store/rooms';
import { RoomsSocketService } from '../../../../core/services/rooms-socket';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  templateUrl: './chat-list.html',
})
export class ChatList {
  private roomsStore = inject(RoomsStore);
  private roomsSocket = inject(RoomsSocketService);

  constructor() {
    const token = localStorage.getItem('access');
    if (token) this.roomsSocket.connect(token);

    effect(() => {
      const _ = this.roomsStore.sortedRooms();
    });
  }

  select(room: any) {
    this.roomsStore.selectRoom(room);
  }

  get rooms() {
    return this.roomsStore.sortedRooms();
  }
}
