import { Component, signal, inject } from '@angular/core';
import { UserStore } from '../../../../core/store/user';
import { ProfileModalComponent } from '../profile-modal/profile-modal';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [ProfileModalComponent],
  templateUrl: './user-menu.html',
})
export class UserMenuComponent {
  userStore = inject(UserStore);

  open = signal(false);
  modalOpen = signal(false);

  toggleMenu() {
    this.open.update((v) => !v);
  }

  openProfileModal() {
    this.modalOpen.set(true);
    this.open.set(false);
  }

  logout() {
    localStorage.removeItem('token');
    location.reload();
  }
}
