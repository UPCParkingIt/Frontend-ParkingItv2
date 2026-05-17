import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReservationEntity } from '../model/reservation.entity';
import { CreateReservationRequest } from '../model/create-reservation.request';
import { ClaimReservationRequest } from '../model/claim-reservation.request';
import { BaseService } from '../../shared/services/base.service';

@Injectable({ providedIn: 'root' })
export class ReservationService extends BaseService<ReservationEntity> {
  protected resourceEndpoint(): string {
    return 'reservations';
  }

  /**
   * POST /reservations
   * Crea una nueva reserva de parking para hoy y envía el código de acceso por email.
   */
  createReservation(request: CreateReservationRequest): Observable<ReservationEntity> {
    return this.http.post<ReservationEntity>(this.resourcePath(), request);
  }

  /**
   * GET /reservations/{id}
   * Retorna una reserva específica por su UUID.
   */
  getReservationById(id: string): Observable<ReservationEntity> {
    return this.getById(id);
  }

  /**
   * GET /reservations/user/{userId}
   * Retorna todas las reservas de un usuario.
   */
  getByUserId(userId: string): Observable<ReservationEntity[]> {
    return this.http.get<ReservationEntity[]>(`${this.resourcePath()}/user/${userId}`);
  }

  /**
   * GET /reservations/parking/{parkingId}
   * Retorna todas las reservas de un estacionamiento.
   */
  getByParkingId(parkingId: string): Observable<ReservationEntity[]> {
    return this.http.get<ReservationEntity[]>(`${this.resourcePath()}/parking/${parkingId}`);
  }

  /**
   * POST /reservations/claim
   * El operador ingresa el código que presenta el usuario.
   * Si es válido y está dentro de los 15 min de gracia, la reserva se activa.
   */
  claimReservation(request: ClaimReservationRequest): Observable<ReservationEntity> {
    return this.http.post<ReservationEntity>(`${this.resourcePath()}/claim`, request);
  }

  /**
   * DELETE /reservations/{id}?reason=
   * Cancela una reserva. El parámetro reason es opcional (default: 'Cancelled by user').
   */
  cancelReservation(id: string, reason?: string): Observable<void> {
    const params = reason ? new HttpParams().set('reason', reason) : undefined;
    return this.http.delete<void>(`${this.resourcePath()}/${id}`, { params });
  }
}

