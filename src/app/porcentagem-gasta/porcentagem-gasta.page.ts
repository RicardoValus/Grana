import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { SqliteService } from '../services/sqlite.service';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { MesService } from '../services/mes.service';

Chart.register(...registerables);

@Component({
  selector: 'app-porcentagem-gasta',
  templateUrl: './porcentagem-gasta.page.html',
  styleUrls: ['./porcentagem-gasta.page.scss']
})
export class PorcentagemGastaPage implements OnInit, AfterViewInit {
  @ViewChild('pieChart') pieChart: ElementRef;
  chart: any;

  totalGanhos: number = 0;
  totalGastos: number = 0;
  porcentagemGasta: number = 0;
  porcentagemRestante: number = 0;

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

  mesSelecionado: string = this.meses[new Date().getMonth()].value;
  anoSelecionado: number = new Date().getFullYear();
  dates = this.mesService.dates;

  constructor(
    private sqlite: SqliteService,
    private router: Router,
    private mesService: MesService
  ) {}

  ngOnInit() {
    this.carregarDados();
  }

  ngAfterViewInit() {
    this.criarGrafico();
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

      this.porcentagemGasta = this.totalGanhos > 0 ? (this.totalGastos / this.totalGanhos) * 100 : 0;
      this.porcentagemRestante = 100 - this.porcentagemGasta;

      this.atualizarGrafico();
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  }

  criarGrafico() {
    const ctx = this.pieChart.nativeElement.getContext('2d');
    
    this.chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Gasto', 'Restante'],
        datasets: [{
          data: [this.porcentagemGasta, this.porcentagemRestante],
          backgroundColor: [
            this.getCorPorcentagem(this.porcentagemGasta),
            '#4caf50'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw as number;
                return `${context.label}: ${value.toFixed(1)}%`;
              }
            }
          }
        }
      }
    });
  }

  atualizarGrafico() {
    if (this.chart) {
      this.chart.data.datasets[0].data = [this.porcentagemGasta, this.porcentagemRestante];
      this.chart.data.datasets[0].backgroundColor = [
        this.getCorPorcentagem(this.porcentagemGasta),
        '#4caf50'
      ];
      this.chart.update();
    }
  }

  getCorPorcentagem(porcentagem: number): string {
      if (porcentagem <= 50) return '#4caf50';
    if (porcentagem <= 80) return '#ff9800';
    return '#f44336';
  }

  onMesChange() {
    this.carregarDados();
  }

  voltar() {
    this.router.navigate(['/home']);
  }
} 