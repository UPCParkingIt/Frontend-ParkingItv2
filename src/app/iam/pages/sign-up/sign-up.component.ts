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
import { SignUpRequest } from '../../model/sign-up.request';
import { BaseFormComponent } from '../../../shared/components/base-form.component';

@Component({
  selector: 'app-sign-up',
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
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css',
})
export class SignUpComponent extends BaseFormComponent {
  private authService = inject(AuthenticationService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  signUpForm: FormGroup = this.buildForm();
  isLoading = signal(false);
  hidePassword = signal(true);

  protected buildForm(): FormGroup {
    return this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{7,15}$/)]],
      dniNumber: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  togglePasswordVisibility(): void {
    this.hidePassword.update(v => !v);
  }

  onSubmit(): void {
    if (this.signUpForm.invalid) {
      this.signUpForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const request: SignUpRequest = this.signUpForm.value;

    this.authService.signUp(request).subscribe({
      next: () => {
        this.snackBar.open('Cuenta creada exitosamente. Inicia sesión.', 'OK', {
          duration: 4000,
        });
        this.router.navigate(['/sign-in']);
      },
      error: (error) => {
        this.isLoading.set(false);
        const message = error.status === 409
          ? 'El correo electrónico ya está registrado'
          : 'Error al crear la cuenta. Intente nuevamente.';
        this.snackBar.open(message, 'Cerrar', {
          duration: 4000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  getFieldError(field: string): string {
    return this.getErrorMessage(this.signUpForm, field);
  }
}
