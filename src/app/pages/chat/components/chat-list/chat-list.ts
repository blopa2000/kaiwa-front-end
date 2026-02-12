import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RoomsStore } from '../../../../core/store/rooms';
import { RoomsSocketService } from '../../../../core/services/rooms-socket';
import { UserStore } from '../../../../core/store/user';
import { TimeAgoPipe } from '../../../../shared/pipes/time-ago-pipe';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [TimeAgoPipe],
  templateUrl: './chat-list.html',
  styleUrl: 'chat-list.css',
})
export class ChatList implements OnInit, OnDestroy {
  private roomsStore = inject(RoomsStore);
  private roomsSocket = inject(RoomsSocketService);
  private userStore = inject(UserStore);

  ngOnInit() {
    const token = localStorage.getItem('access');
    if (token) {
      this.roomsSocket.connect(token);
    }
  }

  ngOnDestroy() {
    this.roomsSocket.disconnect();
  }

  select(room: any) {
    this.roomsStore.selectRoom(room);
  }

  get rooms() {
    return this.roomsStore.sortedRooms();
  }

  get currentUserId() {
    return this.userStore.currentUser()?.id;
  }
}
