import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LogEntity } from '../model/log.entity';
import { AlertLogEntity } from '../model/alert-log.entity';
import { CreateEntryLogRequest } from '../model/create-entry-log.request';
import { CreateExitLogRequest } from '../model/create-exit-log.request';

@Injectable({ providedIn: 'root' })
export class LogService {
  private http = inject(HttpClient);
  private basePath = `${environment.baseUrl}/logs`;

  /**
   * POST /logs/entry
   * Registra la entrada de un vehículo con placa y embedding facial.
   * Ocupa un espacio en el estacionamiento y crea el log de entrada.
   */
  recordEntry(payload: CreateEntryLogRequest): Observable<LogEntity> {
    return this.http.post<LogEntity>(`${this.basePath}/entry`, payload);
  }

  /**
   * POST /logs/exit
   * Registra la salida de un vehículo con verificación facial contra los datos de entrada.
   * Genera alertas de seguridad si hay mismatch facial. Libera el espacio de parking.
   */
  recordExit(payload: CreateExitLogRequest): Observable<LogEntity> {
    return this.http.post<LogEntity>(`${this.basePath}/exit`, payload);
  }

  /**
   * GET /logs/{id}
   * Retorna un log de parking completo (entrada, salida, estado de verificación y alertas).
   */
  getById(id: string): Observable<LogEntity> {
    return this.http.get<LogEntity>(`${this.basePath}/${id}`);
  }

  /**
   * GET /logs/parking/{parkingId}
   * Retorna todos los logs de entrada/salida de un estacionamiento, ordenados por más reciente.
   */
  getByParkingId(parkingId: string): Observable<LogEntity[]> {
    return this.http.get<LogEntity[]>(`${this.basePath}/parking/${parkingId}`);
  }

  /**
   * GET /logs/parking/{parkingId}/alerts
   * Retorna todas las alertas generadas por fallos de verificación facial (mismatch en salida).
   */
  getAlertsByParkingId(parkingId: string): Observable<AlertLogEntity[]> {
    return this.http.get<AlertLogEntity[]>(`${this.basePath}/parking/${parkingId}/alerts`);
  }
}
