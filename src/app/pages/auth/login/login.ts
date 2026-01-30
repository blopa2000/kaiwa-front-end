import { Component, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth';
import { finalize } from 'rxjs/operators';

@Component({
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule, CommonModule],
  templateUrl: './login.html',
})
export class Login {
  form!: FormGroup;
  loading = signal(false);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });

    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/chat']);
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService
      .login(this.form.value)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          localStorage.setItem('access', res.access);
          localStorage.setItem('refresh', res.refresh);
          this.router.navigate(['/chat']);
        },
        error: () => {
          this.errorMessage.set('Correo o contraseña incorrectos');
        },
      });
  }
}
