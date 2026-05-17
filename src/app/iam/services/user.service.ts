import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserEntity } from '../model/user.entity';
import { BaseService } from '../../shared/services/base.service';

@Injectable({ providedIn: 'root' })
export class UserService extends BaseService<UserEntity> {
  protected resourceEndpoint(): string {
    return 'users';
  }

  /**
   * GET /users
   * Retorna todos los usuarios registrados en el sistema.
   * Sobrescribe getAll() del BaseService que llama a /active por defecto.
   */
  override getAll(): Observable<UserEntity[]> {
    return this.http.get<UserEntity[]>(this.resourcePath());
  }

  /**
   * GET /users/{id}
   * Retorna la información de un usuario específico por su UUID.
   */
  getUserById(id: string): Observable<UserEntity> {
    return this.getById(id);
  }
}
