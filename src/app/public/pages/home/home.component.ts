import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ToolbarComponent } from '../../components/toolbar/toolbar.component';
import { ReservationService } from '../../../reservations/services/reservation.service';
import { ReservationEntity } from '../../../reservations/model/reservation.entity';
import { CreateReservationRequest } from '../../../reservations/model/create-reservation.request';
import { ParkingService } from '../../../parking/services/parking.service';
import { ParkingLotEntity } from '../../../parking/model/parking-lot.entity';
import { AuthenticationService } from '../../../iam/services/authentication.service';
import { CompanionService } from '../../../shared/services/companion.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    ToolbarComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit, OnDestroy {
  private reservationService = inject(ReservationService);
  private parkingService = inject(ParkingService);
  private authService = inject(AuthenticationService);
  private companionService = inject(CompanionService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private timerInterval: any;

  // Data
  reservations = signal<ReservationEntity[]>([]);
  parkingLots = signal<ParkingLotEntity[]>([]);
  isLoading = signal(true);

  // Wizard
  showWizard = signal(false);
  wizardStep = signal<1 | 2 | 3>(1);
  selectedParking = signal<ParkingLotEntity | null>(null);
  newReservation = signal<ReservationEntity | null>(null);
  isSubmitting = signal(false);
  timeForm!: FormGroup;

  // Companion
  showCompanion = signal(false);
  showCamera = signal(false);
  companionPhoto: File | null = null;
  companionPreview = signal<string | null>(null);
  isUploading = signal(false);
  uploadedCompanions = signal<any[]>([]);
  private cameraStream: MediaStream | null = null;

  // Countdowns
  countdowns = signal<Record<string, string>>({});

  get todayStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  get todayFormatted(): string {
    return new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  get reservationFeeDisplay(): string {
    const fee = this.selectedParking()?.reservationFee;
    return fee != null ? fee.toFixed(2) : '0.00';
  }

  get tariffPerHourDisplay(): string {
    const tariff = this.selectedParking()?.baseTariffPerHour;
    return tariff != null ? tariff.toFixed(2) : '0.00';
  }

  get minTime(): string {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 15);
    return d.toTimeString().slice(0, 5);
  }

  ngOnInit(): void {
    this.timeForm = this.fb.group({
      startTime: ['', Validators.required],
    });
    this.loadData();
    this.startCountdown();
  }

  ngOnDestroy(): void {
    clearInterval(this.timerInterval);
  }

  loadData(): void {
    this.isLoading.set(true);
    this.parkingService.getAllActive().subscribe({
      next: (lots) => this.parkingLots.set(lots),
      error: () => {},
    });
    
    this.companionService.getCompanions().subscribe({
      next: (comp) => this.uploadedCompanions.set(comp),
      error: () => {}
    });

    const userId = this.authService.getUserId();
    if (userId) {
      this.reservationService.getByUserId(userId).subscribe({
        next: (data) => { this.reservations.set(data); this.isLoading.set(false); },
        error: () => this.isLoading.set(false),
      });
    } else {
      this.isLoading.set(false);
    }
  }

  private startCountdown(): void {
    const update = () => {
      const now = Date.now();
      const cd: Record<string, string> = {};
      for (const r of this.reservations()) {
        if (r.status !== 'PENDING') continue;
        const diff = new Date(r.accessCodeExpiresAt).getTime() - now;
        if (diff <= 0) {
          cd[r.id] = 'Expirada';
        } else {
          const m = Math.floor(diff / 60000);
          const s = Math.floor((diff % 60000) / 1000);
          cd[r.id] = m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m ${s}s`;
        }
      }
      this.countdowns.set(cd);
    };
    update();
    this.timerInterval = setInterval(update, 1000);
  }

  // === Wizard ===
  openWizard(): void {
    this.showWizard.set(true);
    this.showCompanion.set(false);
    this.wizardStep.set(1);
    this.selectedParking.set(null);
    this.newReservation.set(null);
    this.timeForm.reset();
  }

  closeWizard(): void {
    this.showWizard.set(false);
    if (this.wizardStep() === 3) this.loadData();
  }

  selectParking(lot: ParkingLotEntity): void {
    this.selectedParking.set(lot);
    this.wizardStep.set(2);
  }

  submitReservation(): void {
    if (this.timeForm.invalid || !this.selectedParking()) return;
    const userId = this.authService.getUserId();
    if (!userId) return;

    const { startTime } = this.timeForm.value;
    const d = new Date();
    const [h, m] = startTime.split(':').map(Number);
    d.setHours(h, m, 0, 0);

    const tariff = this.selectedParking()!.baseTariffPerHour;
    const request: CreateReservationRequest = {
      parkingId: this.selectedParking()!.id,
      userId,
      reservedFromTime: d.toISOString(),
    };

    this.isSubmitting.set(true);
    this.reservationService.createReservation(request).subscribe({
      next: (created) => {
        this.newReservation.set(created);
        this.isSubmitting.set(false);
        this.wizardStep.set(3);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.snackBar.open('Error al crear la reservación', 'OK', { duration: 4000 });
      },
    });
  }

  // === Companion ===
  openCompanion(): void {
    if (this.uploadedCompanions().length >= 3) {
      this.snackBar.open('Has alcanzado el límite máximo de 3 acompañantes.', 'OK', { duration: 4000 });
      return;
    }
    this.showCompanion.set(true);
    this.showWizard.set(false);
    this.companionPhoto = null;
    this.companionPreview.set(null);
    this.showCamera.set(false);
  }

  closeCompanion(): void {
    this.stopCamera();
    this.showCompanion.set(false);
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      this.companionPhoto = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => this.companionPreview.set(e.target?.result as string);
      reader.readAsDataURL(this.companionPhoto);
    }
  }

  async openCamera(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      this.cameraStream = stream;
      this.showCamera.set(true);
      // Wait for video element to render in the DOM
      setTimeout(() => {
        const video = document.getElementById('camera-video') as HTMLVideoElement;
        if (video) { video.srcObject = stream; }
      }, 80);
    } catch {
      this.snackBar.open('No se pudo acceder a la cámara del dispositivo', 'OK', { duration: 4000 });
    }
  }

  capturePhoto(): void {
    const video = document.getElementById('camera-video') as HTMLVideoElement;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        this.companionPhoto = new File([blob], 'acompanante.jpg', { type: 'image/jpeg' });
        this.companionPreview.set(canvas.toDataURL('image/jpeg', 0.92));
        this.stopCamera();
      }
    }, 'image/jpeg', 0.92);
  }

  stopCamera(): void {
    this.cameraStream?.getTracks().forEach(t => t.stop());
    this.cameraStream = null;
    this.showCamera.set(false);
  }

  uploadCompanion(): void {
    if (!this.companionPhoto) return;
    const userId = this.authService.getUserId();
    if (!userId) return;

    this.isUploading.set(true);
    this.companionService.register(userId, this.companionPhoto).subscribe({
      next: () => {
        this.isUploading.set(false);
        this.showCompanion.set(false);
        this.snackBar.open('Acompañante registrado correctamente', 'OK', { duration: 3000 });
        this.loadData(); // refresh list
      },
      error: (err) => {
        this.isUploading.set(false);
        if (err.status === 400) {
            this.snackBar.open('No se puede registrar. Máximo 3 acompañantes permitidos o datos inválidos.', 'OK', { duration: 5000 });
        } else {
            this.snackBar.open('Error al registrar acompañante', 'OK', { duration: 4000 });
        }
      },
    });
  }

  deleteCompanion(id: string): void {
    if (!confirm('¿Estás seguro de eliminar este acompañante?')) return;
    this.companionService.deleteCompanion(id).subscribe({
      next: () => {
        this.uploadedCompanions.update(list => list.filter(c => c.id !== id));
        this.snackBar.open('Acompañante eliminado', 'OK', { duration: 3000 });
      },
      error: () => this.snackBar.open('Error al eliminar', 'OK', { duration: 4000 })
    });
  }

  // === Cancel ===
  cancelReservation(id: string): void {
    this.reservationService.cancelReservation(id, 'Cancelada por el usuario').subscribe({
      next: () => {
        this.reservations.update(list => list.filter(r => r.id !== id));
        this.snackBar.open('Reservación cancelada', 'OK', { duration: 3000 });
      },
      error: () => this.snackBar.open('No se pudo cancelar la reservación', 'OK', { duration: 4000 }),
    });
  }

  // === Utils ===
  getParkingName(parkingId: string): string {
    return this.parkingLots().find(p => p.id === parkingId)?.parkingName ?? parkingId;
  }

  getArrivalTime(reservedFromTime: string): string {
    const d = new Date(reservedFromTime);
    d.setMinutes(d.getMinutes() - 15);
    return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }

  isExpired(reservation: { status: string; accessCodeExpiresAt: string }): boolean {
    return reservation.status === 'EXPIRED' || reservation.status === 'CANCELLED' ||
      new Date(reservation.accessCodeExpiresAt) < new Date();
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'Pendiente', ACTIVE: 'Activa',
      EXPIRED: 'Expirada', CANCELLED: 'Cancelada',
    };
    return map[status] ?? status;
  }
}
