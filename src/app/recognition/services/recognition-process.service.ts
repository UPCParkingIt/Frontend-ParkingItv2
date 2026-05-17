import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RecognitionStatus {
  faceRecognized: boolean;
  plateRecognized: boolean;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class RecognitionProcessService {
  private http: HttpClient = inject(HttpClient);
  private basePath: string = `${environment.baseUrl}/recognition`;
  private edgePath: string = `${environment.edgeUrl}/recognition`;

  getStatus(): Observable<RecognitionStatus> {
    return this.http.get<RecognitionStatus>(`${this.basePath}/status`);
  }

  startEnrollment(): Observable<any> {
    return this.http.post(`${this.basePath}/enroll`, {});
  }

  quickActivate(mode: 'ENTRY' | 'EXIT' | 'AUTO'): Observable<boolean> {
    return this.http.post<boolean>(`${this.edgePath}/quick-activate`, { mode });
  }

  getLatestMatch(): Observable<any> {
    return this.http.get<any>(`${this.edgePath}/latest-match`);
  }

  getLatestPlate(): Observable<any> {
    return this.http.get<any>(`${this.edgePath}/latest-plate`);
  }

  registerManualEntry(licensePlate: string): Observable<void> {
    return this.http.post<void>(`${this.edgePath}/active-vehicles`, { licensePlate });
  }

  requestQuickCapture(): Observable<boolean> {
    return this.http.post<boolean>(`${this.edgePath}/quick-capture`, {});
  }
}
