import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SqliteService } from '../services/sqlite.service';
import { AlertController } from '@ionic/angular';
import { MesService, DateValue } from '../services/mes.service';
import { GanhosService } from '../services/ganhos.service';
import { GastosService } from '../services/gastos.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  mesSelecionado: string;
  anoSelecionado: number;
  dates: DateValue[] = [];
  anos: number[] = [];
  totalGanhos: number = 0;
  totalGastos: number = 0;
  totalAReceber: number = 0;
  porcentagemGasta: number = 0;
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
    this.mesSelecionado = this.mesService.getMesAtual().toString();
    this.anoSelecionado = this.mesService.getAnoAtual();
    const anoAtual = this.anoSelecionado;
    this.anos = Array.from({ length: 11 }, (_, i) => anoAtual - 5 + i);
  }

  ngOnInit() {
    this.dates = this.mesService.getDates();
    this.carregarDados();
  }

  ionViewWillEnter() {
    this.carregarDados();
  }

  onMesChange(event: any) {
    this.carregarDados();
  }

  private carregarDados() {
    this.carregando = true;
    this.erro = '';

    this.ganhosService.getGanhos(Number(this.mesSelecionado), this.anoSelecionado).subscribe({
      next: (ganhos) => {
        this.ganhos = ganhos;
        this.calcularTotais();
      },
      error: (error) => {
        this.erro = 'Erro ao carregar ganhos: ' + error.message;
        this.carregando = false;
      }
    });

    this.gastosService.getGastos(Number(this.mesSelecionado), this.anoSelecionado).subscribe({
      next: (gastos) => {
        this.gastos = gastos;
        this.calcularTotais();
      },
      error: (error) => {
        this.erro = 'Erro ao carregar gastos: ' + error.message;
        this.carregando = false;
      }
    });

    // Buscar total a receber
    this.sqliteService.getAReceber(Number(this.mesSelecionado), this.anoSelecionado).then((aReceber) => {
      this.totalAReceber = aReceber
        .filter((item: any) => item.status === 'PENDENTE')
        .reduce((total: number, item: any) => total + item.valor, 0);
    }).catch(() => {
      this.totalAReceber = 0;
    });
  }

  private calcularTotais() {
    this.totalGanhos = this.ganhos.reduce((total, ganho) => total + ganho.valor, 0);
    this.totalGastos = this.gastos.reduce((total, gasto) => total + gasto.valor, 0);
    this.porcentagemGasta = this.totalGanhos > 0 ? (this.totalGastos / this.totalGanhos) * 100 : 0;
    this.carregando = false;
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
              const ganhos = await this.ganhosService.getGanhos(Number(this.mesSelecionado), this.anoSelecionado).toPromise();
              for (const ganho of ganhos) {
                await this.ganhosService.excluirGanho(ganho.id).toPromise();
              }

              const gastos = await this.gastosService.getGastos(Number(this.mesSelecionado), this.anoSelecionado).toPromise();
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
