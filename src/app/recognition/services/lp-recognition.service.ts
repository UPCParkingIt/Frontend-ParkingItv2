import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LPRecognitionEntity } from '../model/lp-recognition.entity';

@Injectable({ providedIn: 'root' })
export class LPRecognitionService {
  private http: HttpClient = inject(HttpClient);
  private basePath: string = `${environment.baseUrl}/recognition/plate`;

  processPlateImage(imageData: FormData): Observable<LPRecognitionEntity> {
    return this.http.post<LPRecognitionEntity>(this.basePath, imageData);
  }

  getLast(): Observable<LPRecognitionEntity> {
    return this.http.get<LPRecognitionEntity>(`${this.basePath}/last`);
  }
}
