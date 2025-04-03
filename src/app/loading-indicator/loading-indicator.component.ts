import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-indicator">
      <div *ngIf="isLoading">🔄 Loading...</div>
      <div *ngIf="justLoaded">✅ Loaded</div>
    </div>
  `,
  styles: [`
    .loading-indicator {
      position: fixed;
      top: 10px;
      right: 20px;
      font-size: 14px;
      background: rgba(255,255,255,0.85);
      padding: 6px 12px;
      border-radius: 8px;
      box-shadow: 0 0 5px rgba(0,0,0,0.2);
      z-index: 10000;
      transition: opacity 0.3s ease;
    }
  `]
})
export class LoadingIndicatorComponent {
  @Input() isLoading = false;
  @Input() justLoaded = false;
}
