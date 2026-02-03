import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RoomsService {
  private http = inject(HttpClient);

  // Obtener todas las rooms del usuario
  getRooms() {
    return this.http.get<any[]>(`${environment.apiUrl}/rooms/`);
  }

  // Obtener la última room del usuario
  getLastRoom() {
    return this.http.get<any>(`${environment.apiUrl}/rooms/last/`);
  }

  // Eliminar una room (opcional)
  deleteRoom(roomId: number) {
    return this.http.delete(`${environment.apiUrl}/rooms/${roomId}/delete/`);
  }

  findRoomWithUser(userId: number) {
    return this.http.get<any>(`${environment.apiUrl}/rooms/find/`, {
      params: { user_id: userId },
    });
  }
}
