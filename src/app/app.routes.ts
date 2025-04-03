import { Routes } from '@angular/router';

export const routes: Routes = [

  {
    path: '',
    loadComponent: () =>
      delayImport(() => import('./main/main.component').then(m => m.MainComponent), 1500)
  }
];

function delayImport<T>(importFn: () => Promise<T>, delayMs: number): Promise<T> {
  return new Promise<T>((resolve) => {
    setTimeout(() => {
      importFn().then(resolve);
    }, delayMs);
  });
}

