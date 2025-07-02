import { Component, OnInit } from '@angular/core';
import { SqliteService } from '../services/sqlite.service';
import { AlertController } from '@ionic/angular';
import { MesService, DateValue } from '../services/mes.service';

@Component({
  selector: 'app-a-receber',
  templateUrl: './a-receber.page.html',
  styleUrls: ['./a-receber.page.scss'],
})
export class AReceberPage implements OnInit {
  aReceber: any[] = [];
  mesSelecionado: string;
  anoSelecionado: number;
  dates: DateValue[];
  anos: number[] = [];
  novoAReceber = {
    descricao: '',
    valor: 0,
    data: new Date().toISOString().substring(0, 10),
    mes: '',
    ano: 0,
    status: 'PENDENTE'
  };
  carregando = true;
  erro = '';
  mostrarFormAReceber: boolean = true;
  mostrarListaAReceber: boolean = true;

  constructor(
    private sqliteService: SqliteService,
    private mesService: MesService,
    private alertController: AlertController
  ) {
    this.mesSelecionado = this.mesService.getMesAtual().toString();
    this.anoSelecionado = this.mesService.getAnoAtual();
    this.dates = this.mesService.dates;
    this.novoAReceber.mes = this.mesSelecionado;
    this.novoAReceber.ano = this.anoSelecionado;
    const anoAtual = this.anoSelecionado;
    for (let i = anoAtual - 5; i <= anoAtual + 5; i++) {
      this.anos.push(i);
    }
  }

  ngOnInit() {
    this.carregarAReceber();
  }

  async carregarAReceber() {
    this.carregando = true;
    this.erro = '';
    try {
      this.aReceber = await this.sqliteService.getAReceber(Number(this.mesSelecionado), this.anoSelecionado);
    } catch (error) {
      this.erro = 'Erro ao carregar registros.';
    } finally {
      this.carregando = false;
    }
  }

  async adicionarAReceber() {
    if (!this.novoAReceber.descricao || this.novoAReceber.valor <= 0) {
      const alert = await this.alertController.create({
        header: 'Erro',
        message: 'Preencha todos os campos corretamente.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }
    try {
      this.novoAReceber.mes = this.mesSelecionado;
      this.novoAReceber.ano = this.anoSelecionado;
      await this.sqliteService.adicionarAReceber(this.novoAReceber);
      this.novoAReceber = {
        descricao: '',
        valor: 0,
        data: new Date().toISOString().substring(0, 10),
        mes: this.mesSelecionado,
        ano: this.anoSelecionado,
        status: 'PENDENTE'
      };
      await this.carregarAReceber();
    } catch (error) {
      const alert = await this.alertController.create({
        header: 'Erro',
        message: 'Erro ao adicionar registro.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  async excluirAReceber(id: number) {
    const alert = await this.alertController.create({
      header: 'Confirmar exclusão',
      message: 'Deseja excluir este registro?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Excluir', handler: async () => {
          await this.sqliteService.excluirAReceber(id);
          await this.carregarAReceber();
        }}
      ]
    });
    await alert.present();
  }

  async atualizarStatus(id: number, status: string) {
    await this.sqliteService.atualizarStatusAReceber(id, status);
    await this.carregarAReceber();
  }

  onMesChange() {
    this.carregarAReceber();
  }
}
