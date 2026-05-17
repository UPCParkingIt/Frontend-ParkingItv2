import { Injectable } from '@angular/core';
import { DeviceEntity } from '../model/device.entity';
import { BaseService } from '../../shared/services/base.service';

@Injectable({ providedIn: 'root' })
export class DeviceService extends BaseService<DeviceEntity> {
  protected resourceEndpoint(): string {
    return 'devices';
  }
}
