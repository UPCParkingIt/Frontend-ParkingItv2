import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DriverToolbarComponent } from '../../../recognition/components/driver-toolbar/driver-toolbar.component';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-driver-exit-pay',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    DriverToolbarComponent,
  ],
  templateUrl: './driver-exit-pay.component.html',
  styleUrl: './driver-exit-pay.component.css',
})
export class DriverExitPayComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private paymentService = inject(PaymentService);
  private snackBar = inject(MatSnackBar);

  isConfirming = signal(false);
  isAwaitingAdmin = signal(false);
  hasFailed = signal(false);
  failureReason = signal<string | null>(null);

  /** Recibe paymentId y amount del navigation state enviado por driver-exit-menu */
  private state = (this.router.getCurrentNavigation()?.extras.state as any) ?? {};
  paymentId: string | null = this.state.paymentId ?? null;
  amount: number = this.state.amount ?? 0;
  paymentMethod: string = this.state.paymentMethod ?? 'YAPE';

  private pollingInterval: any;

  ngOnInit(): void {
    if (!this.paymentId) {
      this.router.navigate(['/driver/home']);
    }
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  /**
   * POST /payments/{id}/mark-driver-paid
   * El conductor confirma que realizó el pago (Yape/Efectivo) — queda pendiente de aprobación del admin.
   */
  onPaymentComplete(): void {
    if (!this.paymentId) return;

    this.isConfirming.set(true);
    this.paymentService.markDriverPaid(this.paymentId).subscribe({
      next: () => {
        this.isConfirming.set(false);
        this.isAwaitingAdmin.set(true);
        this.hasFailed.set(false);
        this.startPolling();
      },
      error: () => {
        this.isConfirming.set(false);
        this.snackBar.open('Error al confirmar el pago. Intente nuevamente.', 'Cerrar', {
          duration: 4000, panelClass: ['error-snackbar'],
        });
      },
    });
  }

  retryPayment(): void {
    this.hasFailed.set(false);
    this.isAwaitingAdmin.set(false);
    this.failureReason.set(null);
  }

  private startPolling(): void {
    this.pollingInterval = setInterval(() => {
      this.paymentService.getById(this.paymentId!).subscribe({
        next: (payment) => {
          if (payment.paymentStage === 'APPROVED_BY_ADMIN' || payment.status === 'COMPLETED') {
            this.stopPolling();
            this.router.navigate(['/thanks']);
          } else if (payment.paymentStage === 'REJECTED_BY_ADMIN' || payment.status === 'FAILED') {
            this.stopPolling();
            this.isAwaitingAdmin.set(false);
            this.hasFailed.set(true);
            this.failureReason.set(payment.failureReason ?? 'El administrador rechazó el pago.');
          }
        }
      });
    }, 3000); // Poll every 3 seconds
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
}
