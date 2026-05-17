import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ParkingService } from '../../../parking/services/parking.service';
import { ReservationService } from '../../../reservations/services/reservation.service';
import { AuthenticationService } from '../../../iam/services/authentication.service';
import { ParkingLotEntity } from '../../../parking/model/parking-lot.entity';
import { CreateReservationRequest } from '../../../reservations/model/create-reservation.request';

@Component({
  selector: 'app-reservation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './reservation-dialog.component.html',
  styleUrl: './reservation-dialog.component.css',
})
export class ReservationDialogComponent implements OnInit {
  private parkingService = inject(ParkingService);
  private reservationService = inject(ReservationService);
  private authService = inject(AuthenticationService);
  private dialogRef = inject(MatDialogRef<ReservationDialogComponent>);

  parkings = signal<ParkingLotEntity[]>([]);
  selectedParking = signal<ParkingLotEntity | null>(null);
  selectedDate = signal<Date | null>(null);
  selectedHours = signal<number>(1);
  availableSpots = signal<number | null>(null);
  isLoadingParkings = signal(true);
  isLoadingSpots = signal(false);
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  today = new Date();
  minDate = new Date();
  maxDate = new Date();

  ngOnInit(): void {
    this.minDate = new Date();
    this.maxDate = new Date();
    this.loadParkings();
  }

  loadParkings(): void {
    this.isLoadingParkings.set(true);
    this.parkingService.getAll().subscribe({
      next: (data) => {
        this.parkings.set(data);
        this.isLoadingParkings.set(false);
      },
      error: () => {
        this.errorMessage.set('Error al cargar estacionamientos');
        this.isLoadingParkings.set(false);
      },
    });
  }

  onParkingSelected(parking: ParkingLotEntity): void {
    this.selectedParking.set(parking);
    this.availableSpots.set(null);
    this.loadAvailableSpots();
  }

  onDateSelected(date: Date | null): void {
    this.selectedDate.set(date);
    if (date && this.selectedParking()) {
      this.loadAvailableSpots();
    }
  }

  loadAvailableSpots(): void {
    if (!this.selectedParking() || !this.selectedDate()) {
      return;
    }

    this.isLoadingSpots.set(true);
    // Usa getOccupancyInfo para obtener spots disponibles en tiempo real
    this.parkingService.getOccupancyInfo(this.selectedParking()!.id).subscribe({
      next: (data: { availableSpots: number }) => {
        this.availableSpots.set(data.availableSpots);
        this.isLoadingSpots.set(false);
      },
      error: () => {
        this.errorMessage.set('Error al cargar espacios disponibles');
        this.isLoadingSpots.set(false);
      },
    });
  }

  canSubmit(): boolean {
    return (
      this.selectedParking() !== null &&
      this.selectedDate() !== null &&
      this.selectedHours() > 0 &&
      this.selectedHours() <= 2 &&
      (this.availableSpots() ?? 0) > 0
    );
  }

  submit(): void {
    if (!this.canSubmit()) {
      this.errorMessage.set('Por favor completa todos los campos correctamente');
      return;
    }

    this.isSubmitting.set(true);
    const userId = this.authService.getUserId();
    if (!userId) {
      this.errorMessage.set('No se pudo obtener la información del usuario');
      this.isSubmitting.set(false);
      return;
    }

    const dateStr = this.selectedDate()!.toISOString();
    const tariff = this.selectedParking()!.baseTariffPerHour;
    const request: CreateReservationRequest = {
      parkingId: this.selectedParking()!.id,
      reservedFromTime: dateStr,
      userId: userId,
    };

    this.reservationService.createReservation(request).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        this.dialogRef.close(response);
      },
      error: (error) => {
        this.errorMessage.set('Error al crear la reservación');
        this.isSubmitting.set(false);
      },
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  compareParking(p1: ParkingLotEntity | null, p2: ParkingLotEntity | null): boolean {
    return p1 && p2 ? p1.id === p2.id : p1 === p2;
  }
}
