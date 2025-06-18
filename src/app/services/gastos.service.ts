import { Injectable } from '@angular/core';
import { SqliteService } from './sqlite.service';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GastosService {
  constructor(private sqliteService: SqliteService) {}

  getGastos(mes: number, ano: number): Observable<any[]> {
    return from(this.sqliteService.getGastos(mes, ano));
  }

  adicionarGasto(gasto: any): Observable<any> {
    return from(this.sqliteService.adicionarGasto(gasto));
  }

  excluirGasto(id: number): Observable<any> {
    return from(this.sqliteService.excluirGasto(id));
  }
} 