import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-driver-toolbar',
  imports: [MatToolbarModule, MatIconModule],
  templateUrl: './driver-toolbar.component.html',
  styleUrl: './driver-toolbar.component.css',
})
export class DriverToolbarComponent {}
