import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { VehicleEntity } from '../model/vehicle.entity';
import { BaseService } from '../../shared/services/base.service';

@Injectable({ providedIn: 'root' })
export class VehicleService extends BaseService<VehicleEntity> {
  protected resourceEndpoint(): string {
    return 'vehicles';
  }

  getLastVehicle(): Observable<VehicleEntity> {
    return this.http.get<VehicleEntity>(`${this.resourcePath()}/last`);
  }
}
