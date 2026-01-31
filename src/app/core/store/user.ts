import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UserStore {
  // Usuario que encontraste en la búsqueda (nuevo chat)
  private _selectedUser = signal<any | null>(null);
  selectedUser = this._selectedUser.asReadonly();

  // Usuario principal (logueado)
  private _currentUser = signal<any | null>(null);
  currentUser = this._currentUser.asReadonly();

  setUser(user: any) {
    this._selectedUser.set(user);
  }

  clearUser() {
    this._selectedUser.set(null);
  }

  setCurrentUser(user: any) {
    this._currentUser.set(user);
  }
}
