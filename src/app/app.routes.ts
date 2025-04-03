import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'main',
    loadComponent: () => import('./main/main.component').then(m => m.MainComponent)
  }
];
