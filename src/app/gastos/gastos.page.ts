import { Component, OnInit } from '@angular/core';
import { SqliteService } from '../services/sqlite.service';
import { MesService, DateValue } from '../services/mes.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-gastos',
  templateUrl: './gastos.page.html',
  styleUrls: ['./gastos.page.scss'],
})
export class GastosPage implements OnInit {
  gastos: any[] = [];
  mesSelecionado: number;
  anoSelecionado: number;
  novoGasto: { descricao: string; valor: number; mes: string; ano: number; data: string; categoria: string };
  dates: DateValue[];
  anos: number[] = [];
  carregando: boolean = true;
  erro: string = '';
  categorias: string[] = [
    'Alimentação',
    'Transporte',
    'Moradia',
    'Saúde',
    'Educação',
    'Lazer',
    'Vestuário',
    'Outros'
  ];

  constructor(
    private sqliteService: SqliteService,
    private mesService: MesService,
    private alertController: AlertController
  ) {
    this.mesSelecionado = this.mesService.getMesSelecionado();
    this.anoSelecionado = this.mesService.getAnoSelecionado();
    this.dates = this.mesService.dates;
    this.novoGasto = {
      descricao: '',
      valor: 0,
      mes: this.mesSelecionado.toString(),
      ano: this.anoSelecionado,
      data: new Date().toISOString(),
      categoria: ''
    };

    const anoAtual = new Date().getFullYear();
    for (let i = anoAtual - 5; i <= anoAtual + 5; i++) {
      this.anos.push(i);
    }
  }

  ngOnInit() {
    this.carregarGastos();
  }

  async carregarGastos() {
    try {
      this.carregando = true;
      this.erro = '';

      const dbName = await this.sqliteService.getDbName();
      const sql = 'SELECT * FROM gastos WHERE mes = ? AND ano = ? ORDER BY id DESC';
      const result = await this.sqliteService.query({
        database: dbName,
        statement: sql,
        values: [this.mesSelecionado.toString(), this.anoSelecionado.toString()]
      });

      this.gastos = result.values || [];
    } catch (error) {
      console.error('Erro ao carregar gastos:', error);
      this.erro = 'Erro ao carregar gastos. Tente novamente.';
    } finally {
      this.carregando = false;
    }
  }

  async adicionarGasto() {
    if (!this.novoGasto.descricao || this.novoGasto.valor <= 0 || !this.novoGasto.categoria) {
      const alert = await this.alertController.create({
        header: 'Erro',
        message: 'Por favor, preencha todos os campos corretamente.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    try {
      const dbName = await this.sqliteService.getDbName();
      const sql = 'INSERT INTO gastos (descricao, valor, mes, ano, data, categoria) VALUES (?, ?, ?, ?, ?, ?)';
      await this.sqliteService.executeSet({
        database: dbName,
        set: [{
          statement: sql,
          values: [
            this.novoGasto.descricao,
            this.novoGasto.valor,
            this.mesSelecionado.toString(),
            this.anoSelecionado.toString(),
            this.novoGasto.data,
            this.novoGasto.categoria
          ]
        }]
      });

      this.novoGasto = {
        descricao: '',
        valor: 0,
        mes: this.mesSelecionado.toString(),
        ano: this.anoSelecionado,
        data: new Date().toISOString(),
        categoria: ''
      };
      await this.carregarGastos();
    } catch (error) {
      console.error('Erro ao adicionar gasto:', error);
      const alert = await this.alertController.create({
        header: 'Erro',
        message: 'Erro ao adicionar gasto. Tente novamente.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  async excluirGasto(id: number) {
    const alert = await this.alertController.create({
      header: 'Confirmar exclusão',
      message: 'Tem certeza que deseja excluir este gasto?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Excluir',
          handler: async () => {
            try {
              const dbName = await this.sqliteService.getDbName();
              const sql = 'DELETE FROM gastos WHERE id = ?';
              await this.sqliteService.executeSet({
                database: dbName,
                set: [{
                  statement: sql,
                  values: [id]
                }]
              });

              await this.carregarGastos();
            } catch (error) {
              console.error('Erro ao excluir gasto:', error);
              const errorAlert = await this.alertController.create({
                header: 'Erro',
                message: 'Erro ao excluir gasto. Tente novamente.',
                buttons: ['OK']
              });
              await errorAlert.present();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  onMesChange(event: any) {
    this.mesService.setMesSelecionado(this.mesSelecionado);
    this.mesService.setAnoSelecionado(this.anoSelecionado);
    this.carregarGastos();
  }
} 