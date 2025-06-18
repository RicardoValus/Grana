import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { SqliteService } from '../services/sqlite.service';
import { AlertController } from '@ionic/angular';
import { MesService, DateValue } from '../services/mes.service';
import { GanhosService } from '../services/ganhos.service';
import { GastosService } from '../services/gastos.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, AfterViewInit {
  @ViewChild('graficoCanvas') graficoCanvas!: ElementRef;
  private chart: Chart | null = null;

  mesSelecionado: number = new Date().getMonth() + 1;
  anoSelecionado: number = new Date().getFullYear();
  dates: DateValue[] = [];
  anos: number[] = [];
  totalGanhos: number = 0;
  totalGastos: number = 0;
  porcentagemGasta: number = 0;
  porcentagemRestante: number = 100;
  carregando: boolean = true;
  erro: string = '';
  ganhos: any[] = [];
  gastos: any[] = [];

  constructor(
    private sqliteService: SqliteService,
    private router: Router,
    private alertController: AlertController,
    private mesService: MesService,
    private ganhosService: GanhosService,
    private gastosService: GastosService
  ) {
    const anoAtual = new Date().getFullYear();
    this.anos = Array.from({ length: 11 }, (_, i) => anoAtual - 5 + i);
  }

  ngOnInit() {
    this.dates = this.mesService.getDates();
    this.carregarDados();
  }

  ngAfterViewInit() {
    this.criarGrafico();
  }

  private criarGrafico() {
    const ctx = this.graficoCanvas.nativeElement.getContext('2d');
    
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
            display: false
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

  private getCorPorcentagem(porcentagem: number): string {
    if (porcentagem <= 50) return '#4caf50';
    if (porcentagem <= 80) return '#ff9800';
    return '#f44336';
  }

  onMesChange(event: any) {
    this.carregarDados();
  }

  private carregarDados() {
    this.carregando = true;
    this.erro = '';

    this.ganhosService.getGanhos(this.mesSelecionado, this.anoSelecionado).subscribe({
      next: (ganhos) => {
        this.ganhos = ganhos;
        this.calcularTotais();
      },
      error: (error) => {
        this.erro = 'Erro ao carregar ganhos: ' + error.message;
        this.carregando = false;
      }
    });

    this.gastosService.getGastos(this.mesSelecionado, this.anoSelecionado).subscribe({
      next: (gastos) => {
        this.gastos = gastos;
        this.calcularTotais();
      },
      error: (error) => {
        this.erro = 'Erro ao carregar gastos: ' + error.message;
        this.carregando = false;
      }
    });
  }

  private calcularTotais() {
    this.totalGanhos = this.ganhos.reduce((total, ganho) => total + ganho.valor, 0);
    this.totalGastos = this.gastos.reduce((total, gasto) => total + gasto.valor, 0);
    this.porcentagemGasta = this.totalGanhos > 0 ? (this.totalGastos / this.totalGanhos) * 100 : 0;
    this.porcentagemRestante = 100 - this.porcentagemGasta;
    this.atualizarGrafico();
    this.carregando = false;
  }

  private atualizarGrafico() {
    if (this.chart) {
      this.chart.data.datasets[0].data = [this.porcentagemGasta, this.porcentagemRestante];
      this.chart.data.datasets[0].backgroundColor = [
        this.getCorPorcentagem(this.porcentagemGasta),
        '#4caf50'
      ];
      this.chart.update();
    }
  }

  async mostrarAlerta(titulo: string, mensagem: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensagem,
      buttons: ['OK']
    });
    await alert.present();
  }

  irParaGanhos() {
    this.router.navigate(['/ganhos']);
  }

  async limparDadosMes() {
    const alert = await this.alertController.create({
      header: 'Confirmar exclusão',
      message: `Tem certeza que deseja excluir todos os dados de ${this.dates.find(d => d.value === this.mesSelecionado.toString())?.viewValue}/${this.anoSelecionado.toString()}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Excluir',
          handler: async () => {
            try {
              const ganhos = await this.ganhosService.getGanhos(this.mesSelecionado, this.anoSelecionado).toPromise();
              for (const ganho of ganhos) {
                await this.ganhosService.excluirGanho(ganho.id).toPromise();
              }

              const gastos = await this.gastosService.getGastos(this.mesSelecionado, this.anoSelecionado).toPromise();
              for (const gasto of gastos) {
                await this.gastosService.excluirGasto(gasto.id).toPromise();
              }

              await this.carregarDados();
              await this.mostrarAlerta('Sucesso', 'Dados excluídos com sucesso!');
            } catch (error) {
              console.error('Erro ao limpar dados:', error);
              await this.mostrarAlerta('Erro', 'Erro ao excluir dados. Tente novamente.');
            }
          }
        }
      ]
    });

    await alert.present();
  }
}
