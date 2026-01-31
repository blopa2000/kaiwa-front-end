import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UserStore {
  // Usuario que encontraste en la búsqueda y aún no tiene room
  private _selectedUser = signal<any | null>(null);
  selectedUser = this._selectedUser.asReadonly();

  setUser(user: any) {
    this._selectedUser.set(user);
  }

  clearUser() {
    this._selectedUser.set(null);
  }
}
