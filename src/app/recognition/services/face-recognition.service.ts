import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FaceRecognitionEntity } from '../model/face-recognition.entity';

@Injectable({ providedIn: 'root' })
export class FaceRecognitionService {
  private http: HttpClient = inject(HttpClient);
  private basePath: string = `${environment.baseUrl}/recognition/face`;

  processFaceImage(imageData: FormData): Observable<FaceRecognitionEntity> {
    return this.http.post<FaceRecognitionEntity>(this.basePath, imageData);
  }

  getLast(): Observable<FaceRecognitionEntity> {
    return this.http.get<FaceRecognitionEntity>(`${this.basePath}/last`);
  }
}
