import { Component, OnInit } from '@angular/core';
import { SqliteService } from '../services/sqlite.service';
import { MesService, DateValue } from '../services/mes.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-ganhos',
  templateUrl: './ganhos.page.html',
  styleUrls: ['./ganhos.page.scss'],
})
export class GanhosPage implements OnInit {
  ganhos: any[] = [];
  mesSelecionado: string;
  anoSelecionado: number;
  novoGanho: { descricao: string; valor: number; mes: string; ano: number; data: string };
  dates: DateValue[];
  anos: number[] = [];
  carregando: boolean = true;
  erro: string = '';
  mostrarFormGanho: boolean = true;
  mostrarListaGanhos: boolean = true;

  constructor(
    private sqliteService: SqliteService,
    private mesService: MesService,
    private alertController: AlertController
  ) {
    this.mesSelecionado = this.mesService.getMesAtual().toString();
    this.anoSelecionado = this.mesService.getAnoAtual();
    this.dates = this.mesService.dates;
    this.novoGanho = {
      descricao: '',
      valor: 0,
      mes: this.mesSelecionado,
      ano: this.anoSelecionado,
      data: new Date().toISOString()
    };

    const anoAtual = this.anoSelecionado;
    for (let i = anoAtual - 5; i <= anoAtual + 5; i++) {
      this.anos.push(i);
    }
  }

  ngOnInit() {
    this.carregarGanhos();
  }

  async carregarGanhos() {
    try {
      this.carregando = true;
      this.erro = '';

      const dbName = await this.sqliteService.getDbName();
      const sql = 'SELECT * FROM ganhos WHERE mes = ? AND ano = ? ORDER BY id DESC';
      const result = await this.sqliteService.query({
        database: dbName,
        statement: sql,
        values: [this.mesSelecionado, this.anoSelecionado.toString()]
      });

      this.ganhos = result.values || [];
    } catch (error) {
      console.error('Erro ao carregar ganhos:', error);
      this.erro = 'Erro ao carregar ganhos. Tente novamente.';
    } finally {
      this.carregando = false;
    }
  }

  async adicionarGanho() {
    if (!this.novoGanho.descricao || this.novoGanho.valor <= 0) {
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
      const sql = 'INSERT INTO ganhos (descricao, valor, mes, ano, data) VALUES (?, ?, ?, ?, ?)';
      await this.sqliteService.executeSet({
        database: dbName,
        set: [{
          statement: sql,
          values: [
            this.novoGanho.descricao,
            this.novoGanho.valor,
            this.mesSelecionado,
            this.anoSelecionado.toString(),
            this.novoGanho.data
          ]
        }]
      });

      this.novoGanho = {
        descricao: '',
        valor: 0,
        mes: this.mesSelecionado,
        ano: this.anoSelecionado,
        data: new Date().toISOString()
      };
      await this.carregarGanhos();
    } catch (error) {
      console.error('Erro ao adicionar ganho:', error);
      const alert = await this.alertController.create({
        header: 'Erro',
        message: 'Erro ao adicionar ganho. Tente novamente.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  async excluirGanho(id: number) {
    const alert = await this.alertController.create({
      header: 'Confirmar exclusão',
      message: 'Tem certeza que deseja excluir este ganho?',
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
              const sql = 'DELETE FROM ganhos WHERE id = ?';
              await this.sqliteService.executeSet({
                database: dbName,
                set: [{
                  statement: sql,
                  values: [id]
                }]
              });

              await this.carregarGanhos();
            } catch (error) {
              console.error('Erro ao excluir ganho:', error);
              const errorAlert = await this.alertController.create({
                header: 'Erro',
                message: 'Erro ao excluir ganho. Tente novamente.',
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
    this.mesService.setMesSelecionado(Number(this.mesSelecionado));
    this.mesService.setAnoSelecionado(this.anoSelecionado);
    this.carregarGanhos();
  }
} 