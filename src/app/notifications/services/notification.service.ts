import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificationEntity } from '../model/notification.entity';
import { BaseService } from '../../shared/services/base.service';

@Injectable({ providedIn: 'root' })
export class NotificationService extends BaseService<NotificationEntity> {
  protected resourceEndpoint(): string {
    return 'notifications';
  }

  /**
   * GET /notifications
   * Retorna todas las notificaciones del sistema (uso admin).
   * Sobrescribe getAll() del BaseService que llama a /active por defecto.
   */
  override getAll(): Observable<NotificationEntity[]> {
    return this.http.get<NotificationEntity[]>(this.resourcePath());
  }

  /**
   * GET /notifications/{recipientUserId}
   * Retorna todas las notificaciones de un usuario específico.
   */
  getByUserId(recipientUserId: string): Observable<NotificationEntity[]> {
    return this.http.get<NotificationEntity[]>(`${this.resourcePath()}/${recipientUserId}`);
  }
}

