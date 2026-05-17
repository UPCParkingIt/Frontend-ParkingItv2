import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthenticationService } from '../../services/authentication.service';
import { SignInRequest } from '../../model/sign-in.request';
import { BaseFormComponent } from '../../../shared/components/base-form.component';

@Component({
  selector: 'app-sign-in',
  imports: [
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
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css',
})
export class SignInComponent extends BaseFormComponent {
  private authService = inject(AuthenticationService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  signInForm: FormGroup = this.buildForm();
  isLoading = signal(false);
  hidePassword = signal(true);

  protected buildForm(): FormGroup {
    return this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  togglePasswordVisibility(): void {
    this.hidePassword.update(v => !v);
  }

  onSubmit(): void {
    if (this.signInForm.invalid) {
      this.signInForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const request: SignInRequest = this.signInForm.value;

    this.authService.signIn(request).subscribe({
      next: () => {
        if (this.authService.isAdmin()) {
          this.router.navigate(['/admin/home']);
        } else {
          // USER_ROLE (or any unrecognized role) → regular home
          this.router.navigate(['/user/home']);
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        const message = error.status === 401
          ? 'Credenciales incorrectas'
          : 'Error al iniciar sesión. Intente nuevamente.';
        this.snackBar.open(message, 'Cerrar', {
          duration: 4000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  getFieldError(field: string): string {
    return this.getErrorMessage(this.signInForm, field);
  }
}
