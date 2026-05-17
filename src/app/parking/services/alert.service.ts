import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AlertEntity } from '../model/alert.entity';
import { CreateAlertRequest } from '../model/create-alert.request';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private http = inject(HttpClient);
  private basePath = `${environment.baseUrl}/parking/alerts`;

  /**
   * GET /parking/alerts/{parkingId}
   * Retorna todas las alertas de seguridad de un estacionamiento.
   */
  getByParkingId(parkingId: string): Observable<AlertEntity[]> {
    return this.http.get<AlertEntity[]>(`${this.basePath}/${parkingId}`);
  }

  /**
   * GET /parking/alerts/{parkingId}/status?status=
   * Retorna alertas filtradas por estado (PENDING, REVIEWED, RESOLVED, FALSE_ALARM).
   */
  getByParkingIdAndStatus(parkingId: string, status: string): Observable<AlertEntity[]> {
    const params = new HttpParams().set('status', status);
    return this.http.get<AlertEntity[]>(`${this.basePath}/${parkingId}/status`, { params });
  }

  /**
   * POST /parking/alerts
   * Crea una nueva alerta de seguridad para un estacionamiento.
   */
  createAlert(payload: CreateAlertRequest): Observable<AlertEntity> {
    return this.http.post<AlertEntity>(this.basePath, payload);
  }

  /**
   * PUT /parking/alerts/{alertId}/review?notes=
   * Marca una alerta como revisada por el administrador y agrega notas.
   */
  reviewAlert(alertId: string, notes: string): Observable<any> {
    const params = new HttpParams().set('notes', notes);
    return this.http.put<any>(`${this.basePath}/${alertId}/review`, null, { params });
  }

  /**
   * PUT /parking/alerts/{alertId}/resolve?notes=
   * Marca una alerta como resuelta y cierra la investigación del incidente.
   */
  resolveAlert(alertId: string, notes: string): Observable<any> {
    const params = new HttpParams().set('notes', notes);
    return this.http.put<any>(`${this.basePath}/${alertId}/resolve`, null, { params });
  }

  /**
   * PUT /parking/alerts/{alertId}/markAsFalseAlarm?notes=
   * Marca una alerta como falsa alarma (falso positivo).
   */
  markAsFalseAlarm(alertId: string, notes: string): Observable<any> {
    const params = new HttpParams().set('notes', notes);
    return this.http.put<any>(`${this.basePath}/${alertId}/markAsFalseAlarm`, null, { params });
  }
}
