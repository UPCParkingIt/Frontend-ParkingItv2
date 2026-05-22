import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DriverToolbarComponent } from '../../../recognition/components/driver-toolbar/driver-toolbar.component';
import { PaymentService } from '../../services/payment.service';
import { PaymentEntity } from '../../model/payment.entity';
import { RecognitionProcessService } from '../../../recognition/services/recognition-process.service';
import { LogService } from '../../../logs/services/log.service';
import { ParkingService } from '../../../parking/services/parking.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AppConfigService } from '../../../core/services/app-config/app-config.service';

@Component({
  selector: 'app-driver-exit-menu',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    CurrencyPipe,
    DriverToolbarComponent,
  ],
  templateUrl: './driver-exit-menu.component.html',
  styleUrl: './driver-exit-menu.component.css',
})
export class DriverExitMenuComponent implements OnInit {
  private router = inject(Router);
  private paymentService = inject(PaymentService);
  private snackBar = inject(MatSnackBar);
  private http = inject(HttpClient);
  private logService = inject(LogService);
  private parkingService = inject(ParkingService);
  private appConfigService = inject(AppConfigService);

  payment = signal<PaymentEntity | null>(null);
  isLoading = signal(true);
  hasError = signal(false);
  isConfirming = signal(false);
  
  guestLicensePlate = signal<string | null>(null);
  calculatedAmount = signal<number>(0);
  isGuestFlow = signal<boolean>(false);

  /** reservationId pasado por navigation state desde el sistema de reconocimiento */
  private reservationId: string | null =
    (this.router.getCurrentNavigation()?.extras.state as any)?.reservationId ?? null;
    
  /** licensePlate pasado por navigation state para MVP Guest Flow */
  private plateFromState: string | null = 
    (this.router.getCurrentNavigation()?.extras.state as any)?.licensePlate ?? null;
    
  /** entryLogId pasado por navigation state para obtener la estadía exacta */
  private entryLogIdFromState: string | null = 
    (this.router.getCurrentNavigation()?.extras.state as any)?.entryLogId ?? null;

  guestLogId = signal<string | null>(null);

  ngOnInit(): void {
    if (this.plateFromState) {
      // GUEST FLOW (MVP)
      this.isGuestFlow.set(true);
      this.guestLicensePlate.set(this.plateFromState);
      const parkingId = this.appConfigService.getParkingId();
      
      this.parkingService.getById(parkingId).subscribe({
        next: (parking) => {
          const tariff = parking.baseTariffPerHour || 5.0;
          
          if (this.entryLogIdFromState) {
            this.guestLogId.set(this.entryLogIdFromState);
            this.logService.getById(this.entryLogIdFromState).subscribe({
              next: (log) => {
                let durationMinutes = log?.occupancyDurationMinutes ?? 0;
                if (durationMinutes === 0) {
                    // Si el log aún no tiene occupancyDurationMinutes calculado (porque es un Entry), calculamos la diferencia con la hora actual
                    const entryTime = log.entryTimestamp ? new Date(log.entryTimestamp).getTime() : Date.now();
                    durationMinutes = Math.floor((Date.now() - entryTime) / 60000);
                }
                if (durationMinutes === 0) durationMinutes = 1; // charge at least 1 min
                
                const durationHours = Math.max(1, Math.ceil(durationMinutes / 60)); // Round up to hours, minimum 1
                this.calculatedAmount.set(tariff * durationHours);
                this.isLoading.set(false);
              },
              error: () => {
                this.calculatedAmount.set(tariff); // fallback 1 hr
                this.isLoading.set(false);
              }
            });
          } else {
             // Fallback if entryLogId was not provided somehow
             this.calculatedAmount.set(tariff);
             this.isLoading.set(false);
          }
        },
        error: () => {
          this.calculatedAmount.set(5.0); // complete fallback
          this.isLoading.set(false);
        }
      });
      
      return;
    }

    if (!this.reservationId) {
      // Sin estado: buscar el pago más reciente de la reserva activa (fallback)
      this.isLoading.set(false);
      this.hasError.set(true);
      return;
    }

    // Opción A: ya existe un pago → recuperarlo
    this.paymentService.getByReservationId(this.reservationId).subscribe({
      next: (payments) => {
        if (payments.length > 0) {
          this.payment.set(payments[payments.length - 1]);
          this.isLoading.set(false);
        } else {
          // Opción B: no existe → crearlo automáticamente (CASH por defecto)
          this.paymentService.initiatePayment({
            reservationId: this.reservationId!,
            amount: 0,          // el backend calcula según duración real
            paymentMethod: 'CASH',
            description: 'Pago de estacionamiento',
          }).subscribe({
            next: (p) => { this.payment.set(p); this.isLoading.set(false); },
            error: () => { this.isLoading.set(false); this.hasError.set(true); },
          });
        }
      },
      error: () => { this.isLoading.set(false); this.hasError.set(true); },
    });
  }

  onProceedToPayment(method: string): void {
    if (this.isGuestFlow() && this.guestLogId()) {
      this.isConfirming.set(true);
      this.paymentService.initiateExitPayment({
         parkingLogId: this.guestLogId()!,
         amount: this.calculatedAmount(),
         paymentMethod: method,
         description: 'Guest exit payment'
      }).subscribe({
         next: (p) => {
             this.isConfirming.set(false);
             this.router.navigate(['/driver/exit/pay'], {
                 state: { paymentId: p.id, amount: p.amount, paymentMethod: method }
             });
         },
         error: () => {
             this.isConfirming.set(false);
             this.snackBar.open('Error al iniciar el pago', 'OK');
         }
      });
      return;
    }

    if (!this.payment()) return;
    this.router.navigate(['/driver/exit/pay'], {
      state: { paymentId: this.payment()!.id, amount: this.payment()!.amount, paymentMethod: method }
    });
  }
}
