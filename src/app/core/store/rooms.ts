import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RoomsStore {
  private _rooms = signal<any[]>([]);
  rooms = this._rooms.asReadonly();

  private _activeRoom = signal<any | null>(null);
  activeRoom = this._activeRoom.asReadonly();

  setRooms(rooms: any[]) {
    this._rooms.set(rooms);
  }

  updateRoom(room: any) {
    const rooms = [...this._rooms()];
    const index = rooms.findIndex((r) => r.id === room.id);
    if (index > -1) {
      rooms[index] = room;
    } else {
      rooms.push(room);
    }
    this._rooms.set(rooms);
  }

  updateRoomLastMessage(roomId: number, message: any) {
    this._rooms.update((rooms) =>
      rooms.map((r) => (r.id === roomId ? { ...r, last_message: message } : r)),
    );
  }

  selectRoom(room: any) {
    this._activeRoom.set(room);
  }

  removeRoom(roomId: number) {
    this._rooms.set(this._rooms().filter((r) => r.id !== roomId));
  }

  sortedRooms = computed(() =>
    [...this._rooms()].sort((a, b) => {
      const aTime = a.last_message?.created_at ? new Date(a.last_message.created_at).getTime() : 0;
      const bTime = b.last_message?.created_at ? new Date(b.last_message.created_at).getTime() : 0;
      return bTime - aTime;
    }),
  );
}
