import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { UserService } from '../../../../core/services/user';
import { UserStore } from '../../../../core/store/user';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { OnChanges } from '@angular/core';

@Component({
  selector: 'app-profile-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './profile-modal.html',
})
export class ProfileModalComponent implements OnChanges {
  @Input() open = false;
  @Output() close = new EventEmitter<void>();

  private userService = inject(UserService);
  private userStore = inject(UserStore);
  private fb = inject(FormBuilder);

  selectedFile: File | null = null;
  previewUrl = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  saving = signal<boolean>(false);
  uploading = false;

  profileForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    first_name: ['', [Validators.required, Validators.minLength(3)]],
    last_name: ['', [Validators.required, Validators.minLength(3)]],
  });

  ngOnChanges() {
    const user = this.userCurrent();
    if (user) {
      this.profileForm.patchValue({
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
      });
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.selectedFile = file;

    const reader = new FileReader();

    reader.onload = () => {
      this.previewUrl.set(reader.result as string);
    };

    reader.readAsDataURL(file);
  }

  get userCurrent() {
    return this.userStore.currentUser;
  }

  uploadPhoto() {
    if (!this.selectedFile) return;
    this.uploading = true;
    const formData = new FormData();
    formData.append('photo', this.selectedFile);
    this.userService.uploadPhoto(formData).subscribe({
      next: () => {
        this.refreshUser();
        this.uploading = false;
      },
      error: () => {
        this.uploading = false;
      },
    });
  }

  updateProfile() {
    if (this.profileForm.invalid) return;

    this.errorMessage.set(null);
    this.saving.set(true);

    this.userService.updateProfile(this.profileForm.value).subscribe({
      next: () => {
        this.refreshUser();
        this.saving.set(false);
      },
      error: (err) => {
        this.saving.set(false);

        if (err.status === 400 && err.error?.username) {
          this.errorMessage.set('Ese username ya está en uso');
        } else {
          this.errorMessage.set('No se pudo actualizar el perfil');
        }
      },
    });
  }

  refreshUser() {
    this.userService.getCurrentUser().subscribe((user) => {
      this.userStore.setCurrentUser(user);
      this.close.emit();
    });
  }
}
