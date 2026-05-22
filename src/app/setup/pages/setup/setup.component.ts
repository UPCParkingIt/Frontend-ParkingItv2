import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatCardModule, 
    MatButtonModule, 
    MatInputModule, 
    MatFormFieldModule,
    MatSnackBarModule
  ],
  templateUrl: './setup.component.html',
  styleUrl: './setup.component.css'
})
export class SetupComponent {
  private http = inject(HttpClient);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  edgeUrl: string = localStorage.getItem('edgeUrl') || 'http://localhost:9090';
  isLoading: boolean = false;

  async saveConfiguration() {
    if (!this.edgeUrl) {
      this.snackBar.open('Debes ingresar una URL', 'OK', { duration: 3000 });
      return;
    }

    // Clean URL
    const cleanUrl = this.edgeUrl.endsWith('/') ? this.edgeUrl.slice(0, -1) : this.edgeUrl;
    
    this.isLoading = true;
    try {
      const response: any = await this.http.get(`${cleanUrl}/edge/api/v1/edge/health`).toPromise();
      
      if (response && response.parkingId) {
        localStorage.setItem('edgeUrl', cleanUrl);
        localStorage.setItem('parkingId', response.parkingId);
        this.snackBar.open('Configuración guardada exitosamente.', 'OK', { duration: 3000 });
        this.router.navigate(['/driver/home']);
      } else {
        this.snackBar.open('El Edge no devolvió un Parking ID. Verifica la configuración del backend.', 'OK', { duration: 5000 });
      }
    } catch (e) {
      console.error(e);
      this.snackBar.open('Error conectando al Edge. Verifica la URL o tu red.', 'OK', { duration: 5000 });
    } finally {
      this.isLoading = false;
    }
  }
}
