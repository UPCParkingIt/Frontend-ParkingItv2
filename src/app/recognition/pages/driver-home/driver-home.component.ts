import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DriverToolbarComponent } from '../../components/driver-toolbar/driver-toolbar.component';
import { RecognitionProcessService } from '../../services/recognition-process.service';
import { ParkingService } from '../../../parking/services/parking.service';
import { ReservationService } from '../../../reservations/services/reservation.service';
import { WebSocketService } from '../../../shared/services/websocket.service';
import { signal, OnInit, OnDestroy } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-driver-home',
  imports: [
    ReactiveFormsModule,
    MatButtonModule, 
    MatIconModule, 
    MatCardModule, 
    MatSnackBarModule, 
    MatProgressSpinnerModule, 
    MatFormFieldModule,
    MatInputModule,
    CommonModule, 
    DriverToolbarComponent
  ],
  templateUrl: './driver-home.component.html',
  styleUrl: './driver-home.component.css',
})
export class DriverHomeComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private recognitionService = inject(RecognitionProcessService);
  private parkingService = inject(ParkingService);
  private reservationService = inject(ReservationService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private wsService = inject(WebSocketService);

  isLoading = signal(false);
  isFull = signal(false);
  isIntruder = signal(false);
  intruderPlate = signal('');

  welcomeMessage = signal<string | null>(null);
  detectedPlate = signal<string | null>(null);
  isExitFlow = signal<boolean>(false);
  isCapturingFace = signal(false);

  accessCodeForm: FormGroup = this.fb.group({
    accessCode: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(9)]],
  });

  private pollingInterval: any;
  private platePollingInterval: any;
  private matchPollingInterval: any;   // polls edge /latest-match after face capture
  private wsSubscription?: Subscription;
  
  private PARKING_ID = environment.parkingId;

  ngOnInit() {
    this.checkOccupancy();
    this.pollingInterval = setInterval(() => this.checkOccupancy(), 10000);
    this.startPlatePolling();
    this.setupWebSocket();
  }

  ngOnDestroy() {
    if (this.wsSubscription) this.wsSubscription.unsubscribe();
    if (this.platePollingInterval) clearInterval(this.platePollingInterval);
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    if (this.matchPollingInterval) clearInterval(this.matchPollingInterval);
  }

  private checkOccupancy() {
    this.parkingService.getOccupancyInfo(this.PARKING_ID).subscribe({
      next: (info) => {
        this.isFull.set(info.status === 'FULL' || info.availableSpots === 0);
      },
      error: () => console.error('Failed to get occupancy info')
    });
  }

  private startPlatePolling(): void {
    // Activar el modo AUTO para que python envíe datos
    this.recognitionService.quickActivate('AUTO').subscribe({
      next: () => console.log('Continuous recognition activated'),
      error: () => console.error('Failed to activate continuous recognition')
    });

    this.platePollingInterval = setInterval(() => {
      if (this.detectedPlate() || this.isIntruder() || this.welcomeMessage()) return;

      this.recognitionService.getLatestPlate().subscribe({
        next: (res) => {
          if (res && res.status === 'DETECTED') {
            clearInterval(this.platePollingInterval);
            this.detectedPlate.set(res.licensePlate);
            this.isExitFlow.set(res.isExit === true);
          }
        },
        error: () => {}
      });
    }, 2000);
  }

  onStartFaceCapture(): void {
    if (this.isFull()) {
      this.snackBar.open('El estacionamiento está lleno.', 'Cerrar', { duration: 4000, panelClass: ['error-snackbar'] });
      return;
    }

    this.isCapturingFace.set(true);
    
    // Solicitar al Edge (Python) que capture el rostro actual.
    // quick-capture ya llama clearLastMatch() en el edge, así el poll no leerá resultados viejos.
    this.recognitionService.requestQuickCapture().subscribe({
      next: () => {
        console.log('[Driver] Captura solicitada. Iniciando poll del Edge cada 1s...');
        this.startMatchPolling();
      },
      error: () => {
        this.isCapturingFace.set(false);
        this.snackBar.open('Error solicitando captura', 'Cerrar', { duration: 3000 });
      }
    });
  }

  /** Poll the edge /latest-match every 1 second until we get a result (max 30 s) */
  private startMatchPolling(): void {
    if (this.matchPollingInterval) clearInterval(this.matchPollingInterval);
    let attempts = 0;
    const MAX_ATTEMPTS = 30;

    this.matchPollingInterval = setInterval(() => {
      if (!this.isCapturingFace()) {
        // WebSocket already resolved it — stop polling
        clearInterval(this.matchPollingInterval);
        return;
      }

      attempts++;
      if (attempts > MAX_ATTEMPTS) {
        clearInterval(this.matchPollingInterval);
        this.isCapturingFace.set(false);
        this.snackBar.open('Tiempo de espera agotado. Intente de nuevo.', 'Cerrar', {
          duration: 4000,
          panelClass: ['error-snackbar']
        });
        return;
      }

      this.recognitionService.getLatestMatch().subscribe({
        next: (res) => {
          // Match is available when response has a licensePlate (WAITING response never has it)
          if (res && (res.licensePlate || (res.status && res.status !== 'WAITING'))) {
            console.log('[Driver] Match recibido del Edge (poll):', res);
            clearInterval(this.matchPollingInterval);
            this.handleMatchResult(res);
          }
        },
        error: () => {} // ignore transient errors, keep polling
      });
    }, 1000);
  }

  private setupWebSocket(): void {
    const topic = `/topic/parking/${this.PARKING_ID}/matches`;
    this.wsSubscription = this.wsService.getStompClient().watch(topic).subscribe((message) => {
      const res = JSON.parse(message.body);
      console.log('[Driver] Mensaje WebSocket recibido:', res);
      if (this.isCapturingFace()) {
        if (this.matchPollingInterval) clearInterval(this.matchPollingInterval);
        this.handleMatchResult(res);
      }
    });
  }

  /** Shared handler for match results coming from either edge polling OR WebSocket */
  private handleMatchResult(res: any): void {
    this.isCapturingFace.set(false);

    if (res.isMatched === false) {
      this.intruderPlate.set(res.licensePlate);
      this.isIntruder.set(true);
      this.snackBar.open('❌ ACCESO DENEGADO: Rostro no coincide.', 'Cerrar', {
        duration: 8000,
        panelClass: ['error-snackbar']
      });
      setTimeout(() => {
        this.isIntruder.set(false);
        this.resetFlow();
      }, 8000);
      return;
    }

    if (res.mode === 'EXIT') {
      this.router.navigate(['/driver/exit/menu'], {
        state: { licensePlate: res.licensePlate, entryLogId: res.entryLogId }
      });
    } else if (res.mode === 'MANUAL_ENTRY') {
      // Ingreso manual sin placa detectada → navegar directamente al menú sin crear entry_log
      this.welcomeMessage.set(`¡Bienvenido!`);
      setTimeout(() => this.resetFlow(), 3000);
    } else {
      // ENTRY normal con placa detectada → el Edge ya sincronizó con el Cloud
      this.welcomeMessage.set(`¡Bienvenido!`);
      setTimeout(() => this.resetFlow(), 3000);
    }
  }

  onSubmitCode(): void {
    if (this.accessCodeForm.invalid) {
      this.accessCodeForm.markAllAsTouched();
      return;
    }

    this.isCapturingFace.set(true);
    const code = this.accessCodeForm.get('accessCode')!.value as string;

    // Activar reserva con el código
    this.reservationService.claimReservation({ code }).subscribe({
      next: () => {
        // Enviar placa al Edge para registrar como ActiveVehicle
        const plate = this.detectedPlate();
        if (plate) {
           this.recognitionService.registerManualEntry(plate).subscribe({
             error: () => console.error('Falló el registro manual en el Edge')
           });
        }
        
        // En lugar de capturar rostro (ya que puede ser reserva temporal), simplemente mostramos bienvenida
        this.isCapturingFace.set(false);
        this.welcomeMessage.set(`¡Bienvenido!`);
        setTimeout(() => {
          this.resetFlow();
        }, 3000);
      },
      error: (err) => {
        this.isCapturingFace.set(false);
        if (err.status === 409) {
          this.snackBar.open('El período de gracia ha expirado. La reserva fue cancelada automáticamente.', 'Cerrar', { duration: 6000, panelClass: ['error-snackbar'] });
        } else {
          this.snackBar.open('Código inválido o ya utilizado.', 'Cerrar', { duration: 4000, panelClass: ['error-snackbar'] });
        }
      },
    });
  }

  private resetFlow(): void {
    this.welcomeMessage.set(null);
    this.detectedPlate.set(null);
    this.isExitFlow.set(false);
    this.accessCodeForm.reset();
    this.startPlatePolling();
  }
}
