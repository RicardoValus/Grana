import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then(m => m.HomePageModule)
  },
  {
    path: 'ganhos',
    loadChildren: () => import('src/app/ganhos/ganhos.module').then(m => m.GanhosPageModule)
  },
  {
    path: 'gastos',
    loadChildren: () => import('./gastos/gastos.module').then(m => m.GastosPageModule)
  },
  {
    path: 'total-restante',
    loadChildren: () => import('./total-restante/total-restante.module').then(m => m.TotalRestantePageModule)
  },
  {
    path: 'porcentagem-gasta',
    loadChildren: () => import('./porcentagem-gasta/porcentagem-gasta.module').then(m => m.PorcentagemGastaPageModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
