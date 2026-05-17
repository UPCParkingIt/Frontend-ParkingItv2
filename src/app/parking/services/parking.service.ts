import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ParkingLotEntity } from '../model/parking-lot.entity';
import { CreateParkingRequest } from '../model/create-parking.request';
import { UpdateParkingRequest } from '../model/update-parking.request';
import { OccupancyInfoEntity } from '../model/occupancy-info.entity';
import { OccupancyStatsEntity } from '../model/occupancy-stats.entity';
import { BaseService } from '../../shared/services/base.service';

@Injectable({ providedIn: 'root' })
export class ParkingService extends BaseService<ParkingLotEntity> {
  protected resourceEndpoint(): string {
    return 'parking-lots';
  }

  /**
   * GET /parking-lots
   * Retorna todos los estacionamientos (activos e inactivos).
   * Sobrescribe getAll() del BaseService que llama a /active por defecto.
   */
  override getAll(): Observable<ParkingLotEntity[]> {
    return this.http.get<ParkingLotEntity[]>(this.resourcePath());
  }

  /**
   * GET /parking-lots/active
   * Retorna solo los estacionamientos activos disponibles para reservas.
   */
  getAllActive(): Observable<ParkingLotEntity[]> {
    return this.http.get<ParkingLotEntity[]>(`${this.resourcePath()}/active`);
  }

  /**
   * GET /parking-lots/inactive
   * Retorna los estacionamientos desactivados/archivados.
   */
  getAllInactive(): Observable<ParkingLotEntity[]> {
    return this.http.get<ParkingLotEntity[]>(`${this.resourcePath()}/inactive`);
  }

  /**
   * GET /parking-lots/search?name=
   * Busca estacionamientos por nombre (coincidencia parcial o total).
   */
  searchByName(name: string): Observable<ParkingLotEntity[]> {
    const params = new HttpParams().set('name', name);
    return this.http.get<ParkingLotEntity[]>(`${this.resourcePath()}/search`, { params });
  }

  /**
   * GET /parking-lots/admin/{adminUserId}
   * Retorna el estacionamiento asignado a un administrador específico.
   */
  getByAdminUserId(adminUserId: string): Observable<ParkingLotEntity> {
    return this.http.get<ParkingLotEntity>(`${this.resourcePath()}/admin/${adminUserId}`);
  }

  /**
   * GET /parking-lots/{id}/occupancy
   * Retorna información de ocupación actual del estacionamiento (spots disponibles, porcentaje, estado).
   */
  getOccupancyInfo(id: string): Observable<OccupancyInfoEntity> {
    return this.http.get<OccupancyInfoEntity>(`${this.resourcePath()}/${id}/occupancy`);
  }

  /**
   * GET /parking-lots/{id}/stats
   * Retorna estadísticas de ocupación y alertas del estacionamiento.
   */
  getStats(id: string): Observable<OccupancyStatsEntity> {
    return this.http.get<OccupancyStatsEntity>(`${this.resourcePath()}/${id}/stats`);
  }

  /**
   * POST /parking-lots
   * Crea un nuevo estacionamiento con toda su configuración.
   */
  createParking(payload: CreateParkingRequest): Observable<ParkingLotEntity> {
    return this.http.post<ParkingLotEntity>(this.resourcePath(), payload);
  }

  /**
   * PATCH /parking-lots/{id}
   * Actualiza parcialmente la configuración de un estacionamiento (nombre, ubicación, horarios, tarifa).
   */
  patchParking(parkingId: string, payload: UpdateParkingRequest): Observable<ParkingLotEntity> {
    return this.http.patch<ParkingLotEntity>(`${this.resourcePath()}/${parkingId}`, payload);
  }

  /**
   * DELETE /parking-lots/{id}
   * Desactiva un estacionamiento (soft delete). Queda en registros pero no disponible para reservas.
   */
  deactivateParking(parkingId: string): Observable<string> {
    return this.http.delete<string>(`${this.resourcePath()}/${parkingId}`);
  }
}
