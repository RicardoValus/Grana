import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface DateValue {
  value: string;
  viewValue: string;
}

@Injectable({
  providedIn: 'root'
})
export class MesService {
  private mesSelecionadoSubject = new BehaviorSubject<number>(new Date().getMonth() + 1);
  private anoSelecionadoSubject = new BehaviorSubject<number>(new Date().getFullYear());

  public dates: DateValue[] = [
    { value: '1', viewValue: 'Janeiro' },
    { value: '2', viewValue: 'Fevereiro' },
    { value: '3', viewValue: 'Março' },
    { value: '4', viewValue: 'Abril' },
    { value: '5', viewValue: 'Maio' },
    { value: '6', viewValue: 'Junho' },
    { value: '7', viewValue: 'Julho' },
    { value: '8', viewValue: 'Agosto' },
    { value: '9', viewValue: 'Setembro' },
    { value: '10', viewValue: 'Outubro' },
    { value: '11', viewValue: 'Novembro' },
    { value: '12', viewValue: 'Dezembro' }
  ];

  constructor() { }

  setMesSelecionado(mes: number) {
    this.mesSelecionadoSubject.next(mes);
  }

  getMesSelecionado(): number {
    return this.mesSelecionadoSubject.value;
  }

  setAnoSelecionado(ano: number) {
    this.anoSelecionadoSubject.next(ano);
  }

  getAnoSelecionado(): number {
    return this.anoSelecionadoSubject.value;
  }

  getMesAtual(): number {
    return new Date().getMonth() + 1;
  }

  getAnoAtual(): number {
    return new Date().getFullYear();
  }

  getMesViewValue(mesValue: string): string {
    return this.dates.find(d => d.value === mesValue)?.viewValue || '';
  }

  getDates(): DateValue[] {
    return this.dates;
  }
} 