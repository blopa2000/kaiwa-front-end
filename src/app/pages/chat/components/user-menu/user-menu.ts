import { Component, signal, inject } from '@angular/core';
import { UserStore } from '../../../../core/store/user';
import { ProfileModalComponent } from '../profile-modal/profile-modal';
import { TokenService } from '../../../../core/services/token';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [ProfileModalComponent],
  templateUrl: './user-menu.html',
})
export class UserMenuComponent {
  userStore = inject(UserStore);
  tokenService = inject(TokenService);

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
    this.tokenService.removeToken();
    location.reload();
  }
}
