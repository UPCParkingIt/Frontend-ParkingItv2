import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PromotionEntity } from '../model/promotion.entity';
import { CreatePromotionRequest } from '../model/create-promotion.request';

@Injectable({ providedIn: 'root' })
export class PromotionService {
  private http = inject(HttpClient);
  private basePath = `${environment.baseUrl}/promotions`;

  /**
   * GET /promotions/{parkingId}
   * Retorna todas las promociones activas de un estacionamiento.
   */
  getByParkingId(parkingId: string): Observable<PromotionEntity[]> {
    return this.http.get<PromotionEntity[]>(`${this.basePath}/${parkingId}`);
  }

  /**
   * POST /promotions
   * Crea una nueva promoción para un estacionamiento.
   */
  createPromotion(payload: CreatePromotionRequest): Observable<PromotionEntity> {
    return this.http.post<PromotionEntity>(this.basePath, payload);
  }

  /**
   * DELETE /promotions/{promotionId}
   * Desactiva una promoción (soft delete).
   */
  deactivatePromotion(promotionId: string): Observable<string> {
    return this.http.delete(`${this.basePath}/${promotionId}`, { responseType: 'text' });
  }

  /**
   * PUT /promotions/{promotionId}
   * Activa una promoción previamente desactivada.
   */
  activatePromotion(promotionId: string): Observable<string> {
    return this.http.put(`${this.basePath}/${promotionId}`, {}, { responseType: 'text' });
  }
}
