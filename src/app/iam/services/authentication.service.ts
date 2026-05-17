import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SignInRequest } from '../model/sign-in.request';
import { SignInResponse } from '../model/sign-in.response';
import { SignUpRequest } from '../model/sign-up.request';
import { SignUpResponse } from '../model/sign-up.response';
import { ForgotPasswordRequest } from '../model/forgot-password.request';
import { ResetPasswordRequest } from '../model/reset-password.request';
import { PasswordRecoveryResponse } from '../model/password-recovery.response';
import { UploadCompanionRequest } from '../model/upload-companion.request';

const TOKEN_KEY = 'parking_it_token';
const USER_ID_KEY = 'parking_it_user_id';
const USER_EMAIL_KEY = 'parking_it_user_email';
const USER_ROLE_KEY = 'parking_it_user_role';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private http: HttpClient = inject(HttpClient);
  private router: Router = inject(Router);
  private basePath: string = `${environment.baseUrl}/authentication`;

  signUp(signUpRequest: SignUpRequest): Observable<SignUpResponse> {
    return this.http.post<SignUpResponse>(`${this.basePath}/sign-up`, signUpRequest);
  }

  signIn(signInRequest: SignInRequest): Observable<SignInResponse> {
    return this.http.post<SignInResponse>(`${this.basePath}/sign-in`, signInRequest).pipe(
      tap((response: SignInResponse) => {
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_ID_KEY, response.id);
        localStorage.setItem(USER_EMAIL_KEY, response.email);
        // Persist the primary role (first item in the array)
        const primaryRole = response.roles?.[0] ?? '';
        localStorage.setItem(USER_ROLE_KEY, primaryRole);
      })
    );
  }

  signOut(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USER_EMAIL_KEY);
    localStorage.removeItem(USER_ROLE_KEY);
    this.router.navigate(['/sign-in']);
  }

  isSignedIn(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getUserId(): string | null {
    return localStorage.getItem(USER_ID_KEY);
  }

  getUserEmail(): string | null {
    return localStorage.getItem(USER_EMAIL_KEY);
  }

  getUserRole(): string | null {
    return localStorage.getItem(USER_ROLE_KEY);
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'ADMIN_ROLE';
  }

  isUser(): boolean {
    return this.getUserRole() === 'USER_ROLE';
  }

  /**
   * POST /authentication/forgot-password
   * Envía un enlace de recuperación al email registrado del usuario.
   */
  forgotPassword(request: ForgotPasswordRequest): Observable<PasswordRecoveryResponse> {
    return this.http.post<PasswordRecoveryResponse>(`${this.basePath}/forgot-password`, request);
  }

  /**
   * POST /authentication/reset-password
   * Completa el proceso de recuperación usando el token enviado por email.
   */
  resetPassword(request: ResetPasswordRequest): Observable<PasswordRecoveryResponse> {
    return this.http.post<PasswordRecoveryResponse>(`${this.basePath}/reset-password`, request);
  }

  /**
   * POST /authentication/companions
   * Agrega un acompañante con datos de reconocimiento facial al usuario autenticado.
   * Máximo 5 acompañantes por usuario.
   */
  addCompanion(request: UploadCompanionRequest): Observable<string> {
    return this.http.post<string>(`${this.basePath}/companions`, request);
  }

  /**
   * DELETE /authentication/companions/{companionId}
   * Elimina un acompañante y su información facial del sistema.
   */
  removeCompanion(companionId: string): Observable<string> {
    return this.http.delete<string>(`${this.basePath}/companions/${companionId}`);
  }
}
