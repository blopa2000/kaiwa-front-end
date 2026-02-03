import { Injectable, signal, computed, inject } from '@angular/core';
import { UserStore } from './user';

@Injectable({ providedIn: 'root' })
export class RoomsStore {
  private _rooms = signal<any[]>([]);
  private userStore = inject(UserStore);
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
    this._rooms.update((rooms) => {
      const index = rooms.findIndex((r) => r.id === roomId);
      if (index === -1) return rooms;

      const updatedRoom = {
        ...rooms[index],
        last_message: message,
        updated_at: message.created_at,
      };

      const newRooms = [...rooms];
      newRooms.splice(index, 1); // quitar del lugar actual
      newRooms.unshift(updatedRoom); // subir al top

      return newRooms;
    });

    //sincronizar activeRoom si es la misma
    const active = this._activeRoom();
    if (active && active.id === roomId) {
      this._activeRoom.set({
        ...active,
        last_message: message,
        updated_at: message.created_at,
      });
    }
  }

  selectRoom(room: any) {
    this._activeRoom.set(room);
    //Al seleccionar un room, el usuario buscado deja de existir
    this.userStore.clearUser();
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
