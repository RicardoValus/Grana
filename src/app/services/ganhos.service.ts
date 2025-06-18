import { Injectable } from '@angular/core';
import { SqliteService } from './sqlite.service';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GanhosService {
  constructor(private sqliteService: SqliteService) {}

  getGanhos(mes: number, ano: number): Observable<any[]> {
    return from(this.sqliteService.getGanhos(mes, ano));
  }

  adicionarGanho(ganho: any): Observable<any> {
    return from(this.sqliteService.adicionarGanho(ganho));
  }

  excluirGanho(id: number): Observable<any> {
    return from(this.sqliteService.excluirGanho(id));
  }
} 