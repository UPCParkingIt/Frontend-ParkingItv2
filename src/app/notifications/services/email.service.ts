import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EmailService {
  private http = inject(HttpClient);
  private basePath = `${environment.baseUrl}/emails`;

  /**
   * POST /emails/send?recipient=&subject=&messageBody=
   * Envía un email de texto plano al destinatario indicado.
   */
  sendEmail(recipient: string, subject: string, messageBody: string): Observable<string> {
    const params = new HttpParams()
      .set('recipient', recipient)
      .set('subject', subject)
      .set('messageBody', messageBody);
    return this.http.post<string>(`${this.basePath}/send`, null, { params });
  }

  /**
   * POST /emails/send-attachment?recipient=&subject=&messageBody=&attachmentPath=
   * Envía un email con un archivo adjunto (PDF, recibos, reportes).
   */
  sendEmailWithAttachment(
    recipient: string,
    subject: string,
    messageBody: string,
    attachmentPath: string
  ): Observable<string> {
    const params = new HttpParams()
      .set('recipient', recipient)
      .set('subject', subject)
      .set('messageBody', messageBody)
      .set('attachmentPath', attachmentPath);
    return this.http.post<string>(`${this.basePath}/send-attachment`, null, { params });
  }
}
