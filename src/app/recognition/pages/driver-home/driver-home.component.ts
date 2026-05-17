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
import { signal, OnInit, OnDestroy } from '@angular/core';

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
  private matchPollingInterval: any;
  private readonly PARKING_ID = '5def3b0b-5d35-423e-9922-3889501ae311';

  ngOnInit() {
    this.checkOccupancy();
    this.pollingInterval = setInterval(() => this.checkOccupancy(), 10000);
    this.startPlatePolling();
  }

  ngOnDestroy() {
    if (this.matchPollingInterval) clearInterval(this.matchPollingInterval);
    if (this.platePollingInterval) clearInterval(this.platePollingInterval);
    if (this.pollingInterval) clearInterval(this.pollingInterval);
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
    
    // Solicitar al backend Edge (Python) que capture y guarde el rostro actual
    this.recognitionService.requestQuickCapture().subscribe({
      next: () => {
        console.log('Captura de rostro solicitada al Edge');
        this.pollForMatch();
      },
      error: (err) => {
        this.isCapturingFace.set(false);
        this.snackBar.open('Error solicitando captura', 'Cerrar', { duration: 3000 });
      }
    });
  }

  private pollForMatch(): void {
    this.matchPollingInterval = setInterval(() => {
      this.recognitionService.getLatestMatch().subscribe({
        next: (res) => {
          if (res && res.status !== 'WAITING') {
            clearInterval(this.matchPollingInterval);
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
            } else {
              this.welcomeMessage.set(`¡Bienvenido!`);
              setTimeout(() => {
                this.resetFlow();
              }, 3000);
            }
          }
        },
        error: () => {}
      });
    }, 2000);
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
