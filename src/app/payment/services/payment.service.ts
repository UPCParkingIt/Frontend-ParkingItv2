import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaymentEntity } from '../model/payment.entity';
import { InitiatePaymentRequest } from '../model/initiate-payment.request';
import { InitiateExitPaymentRequest } from '../model/initiate-exit-payment.request';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  private basePath = `${environment.baseUrl}/payments`;

  /**
   * POST /payments
   * Crea e inicia un pago para una reserva.
   */
  initiatePayment(payload: InitiatePaymentRequest): Observable<PaymentEntity> {
    return this.http.post<PaymentEntity>(this.basePath, payload);
  }

  /**
   * POST /payments/exit
   * Crea e inicia un pago para una salida de invitado.
   */
  initiateExitPayment(payload: InitiateExitPaymentRequest): Observable<PaymentEntity> {
    return this.http.post<PaymentEntity>(`${this.basePath}/exit`, payload);
  }

  /**
   * GET /payments/pending-review
   * Retorna los pagos que están esperando aprobación del admin.
   */
  getPendingPayments(): Observable<PaymentEntity[]> {
    return this.http.get<PaymentEntity[]>(`${this.basePath}/pending-review`);
  }

  /**
   * GET /payments/{id}
   * Retorna los detalles de un pago por su UUID.
   */
  getById(id: string): Observable<PaymentEntity> {
    return this.http.get<PaymentEntity>(`${this.basePath}/${id}`);
  }

  /**
   * GET /payments/reservation/{reservationId}
   * Retorna todos los pagos asociados a una reserva.
   */
  getByReservationId(reservationId: string): Observable<PaymentEntity[]> {
    return this.http.get<PaymentEntity[]>(`${this.basePath}/reservation/${reservationId}`);
  }

  /**
   * GET /payments/available-methods
   * Lista los métodos de pago disponibles en Perú (YAPE, CASH).
   */
  getAvailableMethods(): Observable<string> {
    return this.http.get<string>(`${this.basePath}/available-methods`);
  }

  /**
   * POST /payments/{id}/mark-driver-paid
   * El conductor confirma que realizó el pago en su app Yape — queda pendiente de revisión del admin.
   */
  markDriverPaid(id: string): Observable<PaymentEntity> {
    return this.http.post<PaymentEntity>(`${this.basePath}/${id}/mark-driver-paid`, null);
  }

  /**
   * POST /payments/{id}/approve?adminId=&notes=
   * El admin aprueba el pago — el conductor puede salir.
   */
  approvePayment(id: string, adminId: string, notes: string): Observable<PaymentEntity> {
    const params = new HttpParams()
      .set('adminId', adminId)
      .set('notes', notes);
    return this.http.post<PaymentEntity>(`${this.basePath}/${id}/approve`, null, { params });
  }

  /**
   * POST /payments/{id}/reject?adminId=&reason=
   * El admin rechaza el pago — se genera una alerta.
   */
  rejectPayment(id: string, adminId: string, reason: string): Observable<PaymentEntity> {
    const params = new HttpParams()
      .set('adminId', adminId)
      .set('reason', reason);
    return this.http.post<PaymentEntity>(`${this.basePath}/${id}/reject`, null, { params });
  }
}
