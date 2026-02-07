import { Component, inject, signal } from '@angular/core';
import { UserService } from '../../../../core/services/user';
import { UserStore } from '../../../../core/store/user';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RoomsService } from '../../../../core/services/rooms';
import { RoomsStore } from '../../../../core/store/rooms';
import { UserMenuComponent } from '../user-menu/user-menu';

@Component({
  selector: 'app-user-search',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, UserMenuComponent],
  templateUrl: './user-search.html',
})
export class UserSearch {
  private userService = inject(UserService);
  private roomsService = inject(RoomsService);
  private userStore = inject(UserStore);
  private roomsStore = inject(RoomsStore);

  searchControl = new FormControl('');
  results = signal<any[]>([]);
  loading = signal(false);

  constructor() {
    this.searchControl.valueChanges
      ?.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((value) => {
          if (!value || value.length < 2) {
            this.results.set([]);
            return [];
          }
          this.loading.set(true);
          return this.userService.searchUsers(value);
        }),
      )
      .subscribe({
        next: (users: any) => {
          this.results.set(users || []);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.results.set([]);
        },
      });
  }

  selectUser(user: any) {
    this.loading.set(true);

    this.roomsService.findRoomWithUser(user.id).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.results.set([]);
        this.searchControl.setValue('');

        if (res.exists) {
          //Ya existe chat → buscar room en el store
          const room = this.roomsStore.rooms().find((r) => r.id === res.room_id);

          if (room) {
            this.userStore.clearUser();
            this.roomsStore.selectRoom(room);
          }
        } else {
          // 🟡 Chat nuevo
          this.userStore.setUser(user);
        }
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  get queryLength(): number {
    return this.searchControl.value?.length ?? 0;
  }
}
