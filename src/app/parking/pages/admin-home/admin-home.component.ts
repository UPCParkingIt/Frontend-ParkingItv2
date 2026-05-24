import { Component, inject, signal, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { AuthenticationService } from '../../../iam/services/authentication.service';
import { ParkingService } from '../../services/parking.service';
import { AlertService } from '../../services/alert.service';
import { PromotionService } from '../../services/promotion.service';
import { ReservationService } from '../../../reservations/services/reservation.service';
import { LogService } from '../../../logs/services/log.service';
import { PaymentService } from '../../../payment/services/payment.service';
import { WebSocketService } from '../../../shared/services/websocket.service';
import { ParkingLotEntity } from '../../model/parking-lot.entity';
import { PaymentEntity } from '../../../payment/model/payment.entity';
import { OccupancyInfoEntity } from '../../model/occupancy-info.entity';
import { OccupancyStatsEntity } from '../../model/occupancy-stats.entity';
import { AlertEntity } from '../../model/alert.entity';
import { AlertLogEntity } from '../../../logs/model/alert-log.entity';
import { LogEntity } from '../../../logs/model/log.entity';
import { PromotionEntity } from '../../model/promotion.entity';
import { CreatePromotionRequest } from '../../model/create-promotion.request';
import { UpdateParkingRequest } from '../../model/update-parking.request';
import { ReservationEntity } from '../../../reservations/model/reservation.entity';

export type AdminSection =
  | 'dashboard'
  | 'parking-info'
  | 'tariffs'
  | 'spaces'
  | 'unauthorized-exits'
  | 'access-logs'
  | 'reports'
  | 'promotions'
  | 'incidents'
  | 'pending-payments'
  | 'schedules';

export interface NavItem {
  id: AdminSection;
  label: string;
  icon: string;
  badge?: number;
}

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatChipsModule,
    MatBadgeModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatDividerModule,
  ],
  templateUrl: './admin-home.component.html',
  styleUrl: './admin-home.component.css',
})
export class AdminHomeComponent implements OnInit, OnDestroy {
  private authService = inject(AuthenticationService);
  private parkingService = inject(ParkingService);
  private alertService = inject(AlertService);
  private promotionService = inject(PromotionService);
  private reservationService = inject(ReservationService);
  private logService = inject(LogService);
  private paymentService = inject(PaymentService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private toastr = inject(ToastrService);
  private wsService = inject(WebSocketService);

  // ── State ──────────────────────────────────────────────────
  activeSection = signal<AdminSection>('dashboard');
  parking = signal<ParkingLotEntity | null>(null);
  occupancy = signal<OccupancyInfoEntity | null>(null);
  stats = signal<OccupancyStatsEntity | null>(null);
  alerts = signal<AlertEntity[]>([]);
  facialAlerts = signal<AlertLogEntity[]>([]);
  accessLogs = signal<LogEntity[]>([]);
  promotions = signal<PromotionEntity[]>([]);
  reservations = signal<ReservationEntity[]>([]);
  pendingPayments = signal<PaymentEntity[]>([]);

  isLoading = signal(true);
  isSaving = signal(false);
  isLoadingSection = signal(false);
  isUploadingQr = signal(false);
  sidebarCollapsed = signal(false);
  
  private matchSub?: Subscription;
  private paymentSub?: Subscription;

  // ── Forms ──────────────────────────────────────────────────
  parkingForm!: FormGroup;
  tariffForm!: FormGroup;
  promotionForm!: FormGroup;

  // ── Schedules: businessDays = "1111100" (7 bits L-M-M-J-V-S-D) ──────
  readonly DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  schedules = signal<{ day: string; index: number; enabled: boolean }[]>([]);
  scheduleForm!: FormGroup;

  // ── Nav ────────────────────────────────────────────────────
  navItems: NavItem[] = [
    { id: 'dashboard',           label: 'Dashboard',               icon: 'dashboard' },
    { id: 'parking-info',        label: 'Mi Estacionamiento',       icon: 'local_parking' },
    { id: 'tariffs',             label: 'Tarifas',                  icon: 'payments' },
    { id: 'spaces',              label: 'Espacios',                 icon: 'grid_view' },
    { id: 'unauthorized-exits',  label: 'Alertas de Seguridad',    icon: 'security' },
    { id: 'pending-payments',    label: 'Aprobación de Pagos',      icon: 'price_check' },
    { id: 'access-logs',         label: 'Historial de Accesos',     icon: 'history' },
    { id: 'reports',             label: 'Reportes',                 icon: 'bar_chart' },
    { id: 'promotions',          label: 'Promociones',              icon: 'local_offer' },
    { id: 'incidents',           label: 'Reservas del Parking',     icon: 'event' },
    { id: 'schedules',           label: 'Horarios',                 icon: 'schedule' },
  ];

  // ── Computed ───────────────────────────────────────────────
  get occupancyRate(): number {
    return Math.round(this.occupancy()?.occupancyPercentage ?? 0);
  }
  get availableSpots(): number {
    return this.occupancy()?.availableSpots ?? this.parking()?.availableSpots ?? 0;
  }
  get occupiedSpots(): number {
    const total = this.parking()?.totalSpots ?? 0;
    return total - this.availableSpots;
  }
  get pendingAlertsCount(): number {
    return this.alerts().filter(a => a.status === 'PENDING').length;
  }
  get activePromotionsCount(): number {
    return this.promotions().filter(p => p.isActive).length;
  }

  // ── Lifecycle ──────────────────────────────────────────────
  ngOnInit(): void {
    this.buildForms();
    this.loadParkingData();
  }

  ngOnDestroy(): void {
    this.matchSub?.unsubscribe();
    this.paymentSub?.unsubscribe();
  }

  private buildForms(): void {
    this.parkingForm = this.fb.group({
      parkingName: ['', [Validators.required, Validators.minLength(3)]],
      address:     ['', Validators.required],
      totalSpots:  [0,  [Validators.required, Validators.min(1)]],
    });
    this.tariffForm = this.fb.group({
      baseTariffPerHour: [0, [Validators.required, Validators.min(0)]],
      reservationFee:    [0, [Validators.required, Validators.min(0)]],
    });
    this.promotionForm = this.fb.group({
      title:           ['', Validators.required],
      description:     [''],
      discountPercent: [10, [Validators.required, Validators.min(1), Validators.max(100)]],
      validFrom:       ['', Validators.required],
      validTo:         ['', Validators.required],
    });
    this.scheduleForm = this.fb.group({
      openTime:  ['07:00', Validators.required],
      closeTime: ['22:00', Validators.required],
    });
  }

  // ── Load core data ─────────────────────────────────────────
  private loadParkingData(): void {
    const adminUserId = this.authService.getUserId();
    if (!adminUserId) { this.isLoading.set(false); return; }

    this.parkingService.getByAdminUserId(adminUserId).subscribe({
      next: (data) => {
        this.parking.set(data);
        this.patchForms(data);
        this.buildSchedules(data);
        this.isLoading.set(false);
        this.loadOccupancy(data.id);
        this.loadStats(data.id);
        this.loadAlerts(data.id);
        this.loadFacialAlerts(data.id);
        this.loadPromotions(data.id);
        this.loadReservations(data.id);
        this.loadAccessLogs(data.id);
        this.loadPendingPayments();

        // WebSocket Subscriptions
        this.matchSub = this.wsService.getStompClient().watch(`/topic/parking/${data.id}/matches`).subscribe((message: any) => {
          if (message.body) {
            const msg = JSON.parse(message.body);
            this.loadOccupancy(data.id);
            this.loadStats(data.id);
            this.loadAccessLogs(data.id);
            
            if (msg.isMatched === false || msg.isMatched === 'false') {
              this.loadAlerts(data.id);
              this.loadFacialAlerts(data.id);
              this.toastr.error('¡Alerta de Intruso!', 'Seguridad');
            } else if (msg.isMatched === true || msg.isMatched === 'true') {
              this.toastr.success(`Vehículo autorizado`, 'Estacionamiento');
            }
          }
        });

        this.paymentSub = this.wsService.getStompClient().watch(`/topic/admin/payments`).subscribe((message: any) => {
          if (message.body) {
            const msg = JSON.parse(message.body);
            if (msg.action === 'NEW_PAYMENT_PENDING') {
              this.loadPendingPayments();
              const toast = this.toastr.info('Nuevo pago pendiente de aprobación', 'Pagos', {
                tapToDismiss: true
              });
              toast.onTap.subscribe(() => {
                this.navigateTo('pending-payments');
              });
            }
          }
        });
      },
      error: () => {
        this.isLoading.set(false);
        this.snackBar.open('No se pudo cargar el estacionamiento', 'OK', { duration: 4000 });
      },
    });
  }

  private loadOccupancy(id: string): void {
    this.parkingService.getOccupancyInfo(id).subscribe({
      next: (o) => {
        this.occupancy.set(o);
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  private loadStats(id: string): void {
    this.parkingService.getStats(id).subscribe({
      next: (s) => {
        this.stats.set(s);
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  private loadAlerts(parkingId: string): void {
    this.alertService.getByParkingId(parkingId).subscribe({
      next: (a) => {
        this.alerts.set(a);
        // Update nav badge with pending count
        const idx = this.navItems.findIndex(n => n.id === 'unauthorized-exits');
        if (idx >= 0) this.navItems[idx].badge = a.filter(x => x.status === 'PENDING').length;
      },
      error: () => {},
    });
  }

  private loadFacialAlerts(parkingId: string): void {
    this.logService.getAlertsByParkingId(parkingId).subscribe({
      next: (alerts) => {
        this.facialAlerts.set(alerts);
        // Add facial alert count to the unified security alerts badge
        const idx = this.navItems.findIndex(n => n.id === 'unauthorized-exits');
        if (idx >= 0) {
          const generalPending = this.alerts().filter(x => x.status === 'PENDING').length;
          this.navItems[idx].badge = generalPending + alerts.length;
        }
      },
      error: () => {},
    });
  }

  private loadPromotions(parkingId: string): void {
    this.promotionService.getByParkingId(parkingId).subscribe({
      next: (p) => this.promotions.set(p),
      error: () => {},
    });
  }

  private loadReservations(parkingId: string): void {
    this.reservationService.getByParkingId(parkingId).subscribe({
      next: (r) => this.reservations.set(r),
      error: () => {},
    });
  }

  private loadAccessLogs(parkingId: string): void {
    this.logService.getByParkingId(parkingId).subscribe({
      next: (logs) => {
        this.accessLogs.set(logs);
      },
      error: () => {},
    });
  }

  private loadPendingPayments(): void {
    this.paymentService.getPendingPayments().subscribe({
      next: (payments) => {
        this.pendingPayments.set(payments);
        const idx = this.navItems.findIndex(n => n.id === 'pending-payments');
        if (idx >= 0) {
          this.navItems[idx].badge = payments.length;
        }
      },
      error: () => {},
    });
  }

  approvePayment(paymentId: string): void {
    const adminUserId = this.authService.getUserId();
    if (!adminUserId) return;
    this.paymentService.approvePayment(paymentId, adminUserId, 'Aprobado por el admin').subscribe({
      next: () => {
        this.snackBar.open('Pago aprobado exitosamente', 'OK', { duration: 3000 });
        this.loadPendingPayments();
      },
      error: () => this.snackBar.open('Error al aprobar el pago', 'OK', { duration: 3000 }),
    });
  }

  rejectPayment(paymentId: string): void {
    const adminUserId = this.authService.getUserId();
    if (!adminUserId) return;
    this.paymentService.rejectPayment(paymentId, adminUserId, 'Rechazado por el admin').subscribe({
      next: () => {
        this.snackBar.open('Pago rechazado', 'OK', { duration: 3000 });
        this.loadPendingPayments();
      },
      error: () => this.snackBar.open('Error al rechazar el pago', 'OK', { duration: 3000 }),
    });
  }

  private patchForms(p: ParkingLotEntity): void {
    this.parkingForm.patchValue({ parkingName: p.parkingName, address: p.address, totalSpots: p.totalSpots });
    this.tariffForm.patchValue({ baseTariffPerHour: p.baseTariffPerHour, reservationFee: p.reservationFee });
  }

  private buildSchedules(p: ParkingLotEntity): void {
    const bits = (p.businessDays ?? '0000000').padEnd(7, '0');
    this.schedules.set(
      this.DAY_NAMES.map((day, i) => ({ day, index: i, enabled: bits[i] === '1' }))
    );
    const open  = p.openTime  ? p.openTime.substring(0, 5)  : '07:00';
    const close = p.closeTime ? p.closeTime.substring(0, 5) : '22:00';
    this.scheduleForm.patchValue({ openTime: open, closeTime: close });
  }

  // ── Navigation ─────────────────────────────────────────────
  navigateTo(section: AdminSection): void {
    this.activeSection.set(section);
  }
  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  // ── Parking Info ───────────────────────────────────────────
  saveParkingInfo(): void {
    if (this.parkingForm.invalid || !this.parking()) return;
    this.isSaving.set(true);
    const payload: UpdateParkingRequest = this.parkingForm.value;
    this.parkingService.patchParking(this.parking()!.id, payload).subscribe({
      next: (updated) => {
        this.parking.set(updated);
        this.isSaving.set(false);
        this.snackBar.open('Estacionamiento actualizado', 'OK', { duration: 3000 });
      },
      error: () => { this.isSaving.set(false); this.snackBar.open('Error al actualizar', 'OK', { duration: 3000 }); },
    });
  }

  // ── Tariffs ─────────────────────────────────────────────────
  saveTariff(): void {
    if (this.tariffForm.invalid || !this.parking()) return;
    this.isSaving.set(true);
    const { baseTariffPerHour, reservationFee } = this.tariffForm.value;
    const payload: UpdateParkingRequest = {
      newTariff: baseTariffPerHour,
      newReservationFee: reservationFee,
    };
    this.parkingService.patchParking(this.parking()!.id, payload).subscribe({
      next: (updated) => {
        this.parking.set(updated);
        this.isSaving.set(false);
        this.snackBar.open('Tarifas actualizadas', 'OK', { duration: 3000 });
      },
      error: () => { this.isSaving.set(false); this.snackBar.open('Error al actualizar tarifas', 'OK', { duration: 3000 }); },
    });
  }

  // ── Yape QR Upload ──────────────────────────────────────────
  onQrFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.parking()) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.snackBar.open('Solo se permiten imágenes PNG, JPG o WebP', 'OK', { duration: 4000 });
      return;
    }

    this.isUploadingQr.set(true);
    this.parkingService.uploadYapeQr(this.parking()!.id, file).subscribe({
      next: (updated) => {
        this.parking.set(updated);
        this.isUploadingQr.set(false);
        this.snackBar.open('QR de Yape actualizado exitosamente', 'OK', { duration: 3000 });
        // Reset input so the same file can be re-selected if needed
        input.value = '';
      },
      error: () => {
        this.isUploadingQr.set(false);
        this.snackBar.open('Error al subir el QR. Intente nuevamente.', 'OK', { duration: 4000 });
      },
    });
  }

  // ── Alerts ──────────────────────────────────────────────────
  resolveAlert(alertId: string): void {
    this.alertService.resolveAlert(alertId, 'Resuelto por el administrador').subscribe({
      next: () => {
        this.alerts.update(list => list.map(a => a.id === alertId ? { ...a, status: 'RESOLVED' } : a));
        this.snackBar.open('Alerta marcada como resuelta', 'OK', { duration: 2500 });
      },
      error: () => this.snackBar.open('Error al resolver la alerta', 'OK', { duration: 3000 }),
    });
  }

  markFalseAlarm(alertId: string): void {
    this.alertService.markAsFalseAlarm(alertId, 'Falsa alarma').subscribe({
      next: () => {
        this.alerts.update(list => list.map(a => a.id === alertId ? { ...a, status: 'FALSE_ALARM' } : a));
        this.snackBar.open('Alerta marcada como falsa alarma', 'OK', { duration: 2500 });
      },
      error: () => this.snackBar.open('Error', 'OK', { duration: 3000 }),
    });
  }

  severityLabel(s: string): string {
    const m: Record<string, string> = { HIGH: 'Alta', MEDIUM: 'Media', LOW: 'Baja' };
    return m[s] ?? s;
  }

  alertStatusLabel(s: string): string {
    const m: Record<string, string> = {
      PENDING: 'Pendiente', REVIEWED: 'Revisada', RESOLVED: 'Resuelta', FALSE_ALARM: 'Falsa Alarma',
    };
    return m[s] ?? s;
  }

  // ── Promotions ──────────────────────────────────────────────
  addPromotion(): void {
    if (this.promotionForm.invalid || !this.parking()) return;
    const v = this.promotionForm.value;
    const payload: CreatePromotionRequest = {
      parkingId:       this.parking()!.id,
      title:           v.title,
      description:     v.description ?? '',
      discountPercent: v.discountPercent,
      validFrom:       v.validFrom,
      validTo:         v.validTo,
    };
    this.promotionService.createPromotion(payload).subscribe({
      next: (p) => {
        this.promotions.update(list => [p, ...list]);
        this.promotionForm.reset({ discountPercent: 10 });
        this.snackBar.open('Promoción creada', 'OK', { duration: 2500 });
      },
      error: () => this.snackBar.open('Error al crear la promoción', 'OK', { duration: 3000 }),
    });
  }

  removePromotion(promoId: string): void {
    this.promotionService.deactivatePromotion(promoId).subscribe({
      next: () => {
        this.promotions.update(list => list.filter(p => p.id !== promoId));
        this.snackBar.open('Promoción eliminada', 'OK', { duration: 2500 });
      },
      error: () => this.snackBar.open('Error al eliminar la promoción', 'OK', { duration: 3000 }),
    });
  }

  togglePromotion(promo: PromotionEntity): void {
    const action$ = promo.isActive
      ? this.promotionService.deactivatePromotion(promo.id)
      : this.promotionService.activatePromotion(promo.id);

    action$.subscribe({
      next: () => {
        // Actualiza el estado localmente sin recargar
        this.promotions.update(list =>
          list.map(p => p.id === promo.id ? { ...p, isActive: !p.isActive } : p)
        );
        const msg = promo.isActive ? 'Promoción desactivada' : 'Promoción activada';
        this.snackBar.open(msg, 'OK', { duration: 2500 });
      },
      error: () => this.snackBar.open('Error al cambiar estado de la promoción', 'OK', { duration: 3000 }),
    });
  }

  // ── Schedules ────────────────────────────────────────────
  toggleScheduleDay(index: number): void {
    this.schedules.update(list =>
      list.map(d => d.index === index ? { ...d, enabled: !d.enabled } : d)
    );
  }

  saveSchedules(): void {
    if (!this.parking() || this.scheduleForm.invalid) return;
    // Serializar array a string binario "1111100"
    const bits = this.schedules().map(d => d.enabled ? '1' : '0').join('');
    const { openTime, closeTime } = this.scheduleForm.value;
    const payload: UpdateParkingRequest = {
      businessDays: bits,
      openTime,
      closeTime,
    };
    this.isSaving.set(true);
    this.parkingService.patchParking(this.parking()!.id, payload).subscribe({
      next: (updated) => {
        this.parking.set(updated);
        this.buildSchedules(updated);
        this.isSaving.set(false);
        this.snackBar.open('Horarios guardados', 'OK', { duration: 2500 });
      },
      error: () => { this.isSaving.set(false); this.snackBar.open('Error al guardar horarios', 'OK', { duration: 3000 }); },
    });
  }

  // ── Reservation status helpers ─────────────────────────────
  reservationStatusLabel(s: string): string {
    const m: Record<string, string> = { PENDING: 'Pendiente', ACTIVE: 'Activa', EXPIRED: 'Expirada', CANCELLED: 'Cancelada' };
    return m[s] ?? s;
  }

  // ── Utils ────────────────────────────────────────────────────
  get userEmail(): string | null {
    return this.authService.getUserEmail();
  }

  /** Genera [1, 2, …, totalSpots] para el mapa visual de espacios */
  spacesArray(): number[] {
    const total = this.parking()?.totalSpots ?? 0;
    return Array.from({ length: total }, (_, i) => i + 1);
  }
}
