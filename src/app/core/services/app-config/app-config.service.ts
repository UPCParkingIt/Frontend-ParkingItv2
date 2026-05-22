import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {
  private http = inject(HttpClient);
  
  private edgeUrl: string | null = null;
  private parkingId: string | null = null;

  async loadAppConfig(): Promise<void> {
    // 1. Try to load Edge URL from local storage
    const storedEdgeUrl = localStorage.getItem('edgeUrl');
    
    if (storedEdgeUrl) {
      this.edgeUrl = storedEdgeUrl;
      try {
        // 2. Fetch the parkingId from Edge
        const healthUrl = `${this.edgeUrl}/edge/api/v1/edge/health`;
        const response: any = await firstValueFrom(
          this.http.get(healthUrl).pipe(
            catchError(err => {
              console.error('Error connecting to Edge', err);
              return of(null);
            })
          )
        );
        
        if (response && response.parkingId) {
          this.parkingId = response.parkingId;
          if (this.parkingId) {
             localStorage.setItem('parkingId', this.parkingId);
          }
          console.log(`[Config] Edge configured at: ${this.edgeUrl}, ParkingID: ${this.parkingId}`);
        } else {
          console.warn('[Config] Could not retrieve ParkingID from Edge.');
          // Fallback to local storage if available
          this.parkingId = localStorage.getItem('parkingId');
        }
      } catch (e) {
         this.parkingId = localStorage.getItem('parkingId');
      }
    } else {
      console.warn('[Config] Edge URL not found in localStorage. Setup required.');
      this.parkingId = localStorage.getItem('parkingId');
    }
  }

  getEdgeUrl(): string {
    return this.edgeUrl || 'http://localhost:9090'; // default fallback
  }

  getParkingId(): string {
    // Si no está configurado, podemos devolver un string vacío o un fallback
    return this.parkingId || 'NOT_CONFIGURED'; 
  }
  
  isConfigured(): boolean {
    return this.edgeUrl !== null && this.parkingId !== null;
  }
}
