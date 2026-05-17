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
@Injectable({ providedIn: 'root' })
export class CompanionService {
  private http = inject(HttpClient);
  private readonly edgeUrl = 'https://parking-it-edge-wcnjz.ondigitalocean.app/api/registrar';

  register(userId: string, photo: File): Observable<any> {
    const formData = new FormData();
    formData.append('id_usuario', userId);  // field name required by the edge API
    formData.append('foto', photo, photo.name);

    // Pass empty HttpHeaders so the browser sets the correct
    // Content-Type: multipart/form-data; boundary=... automatically
    const headers = new HttpHeaders();

    return this.http.post(this.edgeUrl, formData, { headers });
  }
}

