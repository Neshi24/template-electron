import {
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
  Router
} from '@angular/router';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LoadingIndicatorComponent } from './loading-indicator/loading-indicator.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, LoadingIndicatorComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  isLoading = false;
  justLoaded = false;
  private hideTimeout: any;
  private justLoadedTimeout: any;

  constructor(private router: Router) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        clearTimeout(this.hideTimeout);
        clearTimeout(this.justLoadedTimeout);
        this.isLoading = true;
        this.justLoaded = false;
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.hideTimeout = setTimeout(() => {
          this.isLoading = false;
          this.justLoaded = true;

          this.justLoadedTimeout = setTimeout(() => {
            this.justLoaded = false;
          }, 1500);
        }, 100);
      }
    });
  }
}
