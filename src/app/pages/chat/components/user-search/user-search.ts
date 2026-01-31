import { Component, inject, signal } from '@angular/core';
import { UserService } from '../../../../core/services/user';
import { UserStore } from '../../../../core/store/user';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-search',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './user-search.html',
})
export class UserSearch {
  private userService = inject(UserService);
  private userStore = inject(UserStore);

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
    this.userStore.setUser(user);
    this.results.set([]);
    this.searchControl.setValue('');
  }

  get queryLength(): number {
    return this.searchControl.value?.length ?? 0;
  }
}
