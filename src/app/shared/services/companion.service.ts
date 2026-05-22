import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Companion Registration Service
 *
 * Sends a multipart/form-data POST to the edge API.
 * DO NOT set Content-Type manually — the browser sets it automatically
 * with the correct multipart boundary when using FormData.
 *
 * Field names expected by the edge API:
 *   - 'id'   → logged-in user UUID
 *   - 'foto' → photo File object
 */
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CompanionService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.baseUrl}/authentication/companions`;

  register(userId: string, photo: File): Observable<any> {
    const formData = new FormData();
    formData.append('faceImage', photo, photo.name);

    return this.http.post(this.apiUrl, formData);
  }
}

