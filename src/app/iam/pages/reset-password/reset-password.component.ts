import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent {
  private auth = inject(AuthenticationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  /** Token enviado como query param: /reset-password?token=... */
  private token = this.route.snapshot.queryParamMap.get('token') ?? '';

  form = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  }, { validators: this.passwordsMatch });

  isSubmitting = signal(false);
  showNew = signal(false);
  showConfirm = signal(false);

  private passwordsMatch(group: any) {
    const { newPassword, confirmPassword } = group.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.isSubmitting.set(true);
    this.auth.resetPassword({
      token: this.token,
      newPassword: this.form.value.newPassword!,
      confirmPassword: this.form.value.confirmPassword!,
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.snackBar.open('Contraseña actualizada correctamente. Inicia sesión.', 'OK', { duration: 4000 });
        this.router.navigate(['/sign-in']);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.snackBar.open('El enlace de recuperación es inválido o ha expirado.', 'OK', { duration: 5000 });
      },
    });
  }
}
