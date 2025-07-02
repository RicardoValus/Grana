import { Component, OnInit } from '@angular/core';
import { SqliteService } from '../services/sqlite.service';
import { Router } from '@angular/router';
import { MesService } from '../services/mes.service';

@Component({
  selector: 'app-total-restante',
  templateUrl: './total-restante.page.html',
  styleUrls: ['./total-restante.page.scss'],
})
export class TotalRestantePage implements OnInit {
  totalGanhos: number = 0;
  totalGastos: number = 0;
  totalRestante: number = 0;
  porcentagemGasta: number = 0;
  mesSelecionado: string;
  anoSelecionado: number;
  dates = this.mesService.dates;
  mostrarResumo: boolean = true;

  meses = [
    { value: '01', viewValue: 'Janeiro' },
    { value: '02', viewValue: 'Fevereiro' },
    { value: '03', viewValue: 'Março' },
    { value: '04', viewValue: 'Abril' },
    { value: '05', viewValue: 'Maio' },
    { value: '06', viewValue: 'Junho' },
    { value: '07', viewValue: 'Julho' },
    { value: '08', viewValue: 'Agosto' },
    { value: '09', viewValue: 'Setembro' },
    { value: '10', viewValue: 'Outubro' },
    { value: '11', viewValue: 'Novembro' },
    { value: '12', viewValue: 'Dezembro' }
  ];

  constructor(
    private sqlite: SqliteService,
    private router: Router,
    private mesService: MesService
  ) {
    this.mesSelecionado = this.mesService.getMesAtual().toString();
    this.anoSelecionado = this.mesService.getAnoAtual();
    this.dates = this.mesService.dates;
  }

  ngOnInit() {
    this.carregarDados();
  }

  async carregarDados() {
    const dbName = await this.sqlite.getDbName();
    
    try {
      const sqlGanhos = 'SELECT SUM(valor) as total FROM ganhos WHERE mes = ? AND ano = ?';
      const resultGanhos = await this.sqlite.query({
        database: dbName,
        statement: sqlGanhos,
        values: [this.mesSelecionado, this.anoSelecionado]
      });
      this.totalGanhos = resultGanhos.values[0]?.total || 0;

      const sqlGastos = 'SELECT SUM(valor) as total FROM gastos WHERE mes = ? AND ano = ?';
      const resultGastos = await this.sqlite.query({
        database: dbName,
        statement: sqlGastos,
        values: [this.mesSelecionado, this.anoSelecionado]
      });
      this.totalGastos = resultGastos.values[0]?.total || 0;
        
      this.totalRestante = this.totalGanhos - this.totalGastos;
      this.porcentagemGasta = this.totalGanhos > 0 ? (this.totalGastos / this.totalGanhos) * 100 : 0;
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  }

  onMesChange() {
    this.carregarDados();
  }

  voltar() {
    this.router.navigate(['/home']);
  }
} 