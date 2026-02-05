import { Injectable, signal, computed, inject } from '@angular/core';
import { UserStore } from './user';

@Injectable({ providedIn: 'root' })
export class RoomsStore {
  private _rooms = signal<any[]>([]);
  private userStore = inject(UserStore);
  rooms = this._rooms.asReadonly();

  private _activeRoom = signal<any | null>(null);
  private offlineTimers: Map<number, any> = new Map();
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

  updateUserStatus(userId: number, status: 'online' | 'offline' | 'typing') {
    if (status === 'offline') {
      // Si ya hay un timer para este usuario, no hacemos nada
      if (this.offlineTimers.has(userId)) return;

      const timer = setTimeout(() => {
        this._setStatus(userId, 'offline');
        this.offlineTimers.delete(userId);
      }, 5000); // esperar 5 segundos antes de marcar offline

      this.offlineTimers.set(userId, timer);
    } else {
      // Status online o typing cancela cualquier timer
      if (this.offlineTimers.has(userId)) {
        clearTimeout(this.offlineTimers.get(userId));
        this.offlineTimers.delete(userId);
      }
      this._setStatus(userId, status);
    }
  }

  private _setStatus(userId: number, status: 'online' | 'offline' | 'typing') {
    this._rooms.update((rooms) =>
      rooms.map((room) => {
        const other = room.other_user;
        if (!other || other.id !== userId) return room;

        return {
          ...room,
          other_user: {
            ...other,
            status,
          },
        };
      }),
    );

    // sincronizar activeRoom si aplica
    const active = this._activeRoom();
    if (active?.other_user?.id === userId) {
      this._activeRoom.set({
        ...active,
        other_user: {
          ...active.other_user,
          status,
        },
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

  addRoom(room: any) {
    const exists = this.rooms().some((r) => r.id === room.id);
    if (exists) return;

    this._rooms.update((rooms) => [room, ...rooms]);
  }

  sortedRooms = computed(() =>
    [...this._rooms()].sort((a, b) => {
      const aTime = a.last_message?.created_at ? new Date(a.last_message.created_at).getTime() : 0;
      const bTime = b.last_message?.created_at ? new Date(b.last_message.created_at).getTime() : 0;
      return bTime - aTime;
    }),
  );
}
