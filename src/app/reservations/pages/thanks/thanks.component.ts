import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DriverToolbarComponent } from '../../../recognition/components/driver-toolbar/driver-toolbar.component';

@Component({
  selector: 'app-thanks',
  imports: [MatIconModule, MatProgressSpinnerModule, DriverToolbarComponent],
  templateUrl: './thanks.component.html',
  styleUrl: './thanks.component.css',
})
export class ThanksComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private timerId: any;

  countdown = signal(5);

  ngOnInit(): void {
    this.timerId = setInterval(() => {
      this.countdown.update(v => v - 1);
      if (this.countdown() <= 0) {
        clearInterval(this.timerId);
        this.router.navigate(['/driver/home']);
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }
}
