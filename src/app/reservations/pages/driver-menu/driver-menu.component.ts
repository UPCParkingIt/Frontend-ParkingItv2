import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DriverToolbarComponent } from '../../../recognition/components/driver-toolbar/driver-toolbar.component';
import { ReservationService } from '../../services/reservation.service';
import { RecognitionProcessService } from '../../../recognition/services/recognition-process.service';
import { CommonModule } from '@angular/common';
import { WebSocketService } from '../../../shared/services/websocket.service';
import { environment } from '../../../../environments/environment';
import { AppConfigService } from '../../../core/services/app-config/app-config.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-driver-menu',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    CommonModule,
    DriverToolbarComponent,
  ],
  templateUrl: './driver-menu.component.html',
  styleUrl: './driver-menu.component.css',
})
export class DriverMenuComponent {
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private reservationService = inject(ReservationService);
  private recognitionService = inject(RecognitionProcessService);
  private fb = inject(FormBuilder);
  private wsService = inject(WebSocketService);

  accessCodeForm: FormGroup = this.fb.group({
    accessCode: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(9)]],
  });

  isLoading = signal(false);
  private wsSubscription?: Subscription;
  
  private appConfigService = inject(AppConfigService);
  private get PARKING_ID() { return this.appConfigService.getParkingId(); }

  ngOnDestroy() {
    if (this.wsSubscription) this.wsSubscription.unsubscribe();
  }

  onSubmitCode(): void {
    if (this.accessCodeForm.invalid) {
      this.accessCodeForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const code = this.accessCodeForm.get('accessCode')!.value as string;

    // POST /reservations/claim — activa la reserva en el ingreso del parking
    this.reservationService.claimReservation({ code }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/thanks']);
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err.status === 409) {
          this.snackBar.open(
            'El período de gracia ha expirado. La reserva fue cancelada automáticamente.',
            'Cerrar',
            { duration: 6000, panelClass: ['error-snackbar'] }
          );
        } else {
          this.snackBar.open(
            'Código inválido o ya utilizado. Verifica e intenta nuevamente.',
            'Cerrar',
            { duration: 4000, panelClass: ['error-snackbar'] }
          );
        }
      },
    });
  }

  onManualEntry(): void {
    this.isLoading.set(true);
    this.recognitionService.quickActivate('ENTRY').subscribe({
      next: () => {
        this.pollLatestMatch();
      },
      error: () => {
        this.isLoading.set(false);
        this.snackBar.open('Error al activar cámara', 'Cerrar', { duration: 3000 });
      }
    });
  }

  private pollLatestMatch(): void {
    const topic = `/topic/parking/${this.PARKING_ID}/matches`;
    this.wsSubscription = this.wsService.getStompClient().watch(topic).subscribe((message) => {
      const res = JSON.parse(message.body);
      if (res && res.mode === 'ENTRY') {
        if (this.wsSubscription) {
          this.wsSubscription.unsubscribe();
          this.wsSubscription = undefined;
        }
        this.isLoading.set(false);
        this.router.navigate(['/thanks']);
      }
    });

    // Stop waiting after 30 seconds if no match
    setTimeout(() => {
      if (this.isLoading()) {
        if (this.wsSubscription) {
          this.wsSubscription.unsubscribe();
          this.wsSubscription = undefined;
        }
        this.isLoading.set(false);
        this.snackBar.open('Tiempo de espera agotado. Intente nuevamente.', 'Cerrar', { duration: 4000 });
      }
    }, 30000);
  }
}
