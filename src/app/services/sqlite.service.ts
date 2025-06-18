import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CapacitorSQLite, JsonSQLite, capSQLiteChanges, capSQLiteValues } from '@capacitor-community/sqlite';
import { Device } from '@capacitor/device';
import { Preferences } from '@capacitor/preferences';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SqliteService {

  public dbReady: BehaviorSubject<boolean>
  public isWeb: boolean
  public isIOS: boolean
  public dbName: string


  constructor(
    private http: HttpClient
  ) {
    this.dbReady = new BehaviorSubject(false);
    this.isWeb = false;
    this.isIOS = false;
    this.dbName = '';
  }

  async init() {
    const info = await Device.getInfo();
    const sqlite = CapacitorSQLite as any;

    if (info.platform == 'android') {
      try {
        await sqlite.requestPermission();
      } catch (error) {
        console.error('Este aplicativo precisa de permissão')
      }

    } else if (info.platform == 'web') {
      this.isWeb = true;
      await sqlite.initWebStore();
    } else if (info.platform == 'ios') {
      this.isIOS = true;
    }

    await this.setupDatabase();
  }

  async setupDatabase() {
    const dbSetup = await Preferences.get({
      key: 'first_setup_key'
    })
    if (!dbSetup.value) {
      this.downloadDatabase();
    } else {
      this.dbName = await this.getDbName();
      await CapacitorSQLite.createConnection({ database: this.dbName });
      await CapacitorSQLite.open({ database: this.dbName });
      
      if (this.isWeb) {
        await this.criarTabelaGanhosWeb();
      }
      
      this.dbReady.next(true);
    }
  }

  private async criarTabelaGanhosWeb() {
    const sqlGanhos = `
      CREATE TABLE IF NOT EXISTS ganhos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mes TEXT NOT NULL,
        ano INTEGER NOT NULL,
        descricao TEXT NOT NULL,
        valor REAL NOT NULL,
        data TEXT NOT NULL
      )
    `;

    const sqlGastos = `
      CREATE TABLE IF NOT EXISTS gastos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mes TEXT NOT NULL,
        ano INTEGER NOT NULL,
        descricao TEXT NOT NULL,
        valor REAL NOT NULL,
        data TEXT NOT NULL,
        categoria TEXT NOT NULL
      )
    `;

    try {
      await CapacitorSQLite.execute({
        database: this.dbName,
        statements: sqlGanhos
      });

      await CapacitorSQLite.execute({
        database: this.dbName,
        statements: sqlGastos
      });
    } catch (error) {
      console.error('Erro ao criar tabelas:', error);
    }
  }

  downloadDatabase() {
    this.http.get('assets/db/db.json').subscribe(async (jsonExport: JsonSQLite) => {
      try {
        const jsonstring = JSON.stringify(jsonExport);
        const isValid = await CapacitorSQLite.isJsonValid({ jsonstring });

        if (isValid.result) {
          this.dbName = jsonExport.database;
          await CapacitorSQLite.importFromJson({ jsonstring });
          await CapacitorSQLite.createConnection({ database: this.dbName });
          await CapacitorSQLite.open({ database: this.dbName });

          if (this.isWeb) {
            await this.criarTabelaGanhosWeb();
          }

          await Preferences.set({ key: 'first_setup_key', value: '1' });
          await Preferences.set({ key: 'dbname', value: this.dbName });

          this.dbReady.next(true);
        } else {
          console.error('JSON inválido');
        }
      } catch (error) {
        console.error('Erro ao processar o JSON:', error);
      }
    }, error => {
      console.error('Erro ao carregar o JSON:', error);
    });
  }

  async getDbName() {
    if (!this.dbName) {
      const dbname = await Preferences.get({ key: 'dbname' })
      if (dbname.value) {
        this.dbName = dbname.value
      }
    }
    return this.dbName;
  }

  async create(item: string) {
    let sql = 'INSERT INTO items VALUES(?)';
    const dbName = await this.getDbName();
    return CapacitorSQLite.executeSet({
      database: dbName,
      set: [
        {
          statement: sql,
          values: [
            item
          ]
        }
      ]
    }).then((changes: capSQLiteChanges) => {
      if (this.isWeb) {
        CapacitorSQLite.saveToStore({ database: dbName });
      }
      return changes;
    }).catch(err => Promise.reject(err))
  }

  async read() {
    let sql = 'SELECT * FROM items';
    const dbName = await this.getDbName();
    return CapacitorSQLite.query({
      database: dbName,
      statement: sql,
      values: []
    }).then((response: capSQLiteValues) => {
      let items: string[] = [];

      if (this.isIOS && response.values.length > 0) {
        response.values.shift();
      }

      for (let index = 0; index < response.values.length; index++) {
        const item = response.values[index];
        items.push(item.name);
      }

      return items;
    }).catch(err => Promise.reject(err))
  }

  async update(newItem: string, originalItem: string) {
    let sql = 'UPDATE items SET name=? WHERE name=?';
    const dbName = await this.getDbName();
    return CapacitorSQLite.executeSet({
      database: dbName,
      set: [
        {
          statement: sql,
          values: [
            newItem,
            originalItem
          ]
        }
      ]
    }).then((changes: capSQLiteChanges) => {
      if (this.isWeb) {
        CapacitorSQLite.saveToStore({ database: dbName });
      }
      return changes;
    }).catch(err => Promise.reject(err))
  }

  async delete(item: string) {
    let sql = 'DELETE FROM items WHERE name=?';
    const dbName = await this.getDbName();
    return CapacitorSQLite.executeSet({
      database: dbName,
      set: [
        {
          statement: sql,
          values: [
            item
          ]
        }
      ]
    }).then((changes: capSQLiteChanges) => {
      if (this.isWeb) {
        CapacitorSQLite.saveToStore({ database: dbName });
      }
      return changes;
    }).catch(err => Promise.reject(err))
  }

  async query(params: { database: string, statement: string, values: any[] }): Promise<capSQLiteValues> {
    return CapacitorSQLite.query({
      database: params.database,
      statement: params.statement,
      values: params.values
    });
  }

  async executeSet(params: { database: string, set: { statement: string, values: any[] }[] }): Promise<capSQLiteChanges> {
    return CapacitorSQLite.executeSet({
      database: params.database,
      set: params.set
    }).then((changes: capSQLiteChanges) => {
      if (this.isWeb) {
        CapacitorSQLite.saveToStore({ database: params.database });
      }
      return changes;
    });
  }

  async getTotalGanhosMes(mes: string, ano: number): Promise<number> {
    const sql = 'SELECT SUM(valor) as total FROM ganhos WHERE mes = ? AND ano = ?';
    const dbName = await this.getDbName();
    
    try {
      const result = await this.query({
        database: dbName,
        statement: sql,
        values: [mes, ano]
      });
      
      return result.values[0]?.total || 0;
    } catch (error) {
      console.error('Erro ao obter total de ganhos:', error);
      return 0;
    }
  }

  async getGanhos(mes: number, ano: number): Promise<any[]> {
    const query = 'SELECT * FROM ganhos WHERE mes = ? AND ano = ? ORDER BY data DESC';
    const result = await this.query({
      database: await this.getDbName(),
      statement: query,
      values: [mes, ano]
    });
    const ganhos = [];
    for (let i = 0; i < result.values.length; i++) {
      ganhos.push(result.values[i]);
    }
    return ganhos;
  }

  async adicionarGanho(ganho: any): Promise<any> {
    const query = 'INSERT INTO ganhos (descricao, valor, data, mes, ano) VALUES (?, ?, ?, ?, ?)';
    const result = await this.query({
      database: await this.getDbName(),
      statement: query,
      values: [
        ganho.descricao,
        ganho.valor,
        ganho.data,
        ganho.mes,
        ganho.ano
      ]
    });
    return result;
  }

  async excluirGanho(id: number): Promise<any> {
    const query = 'DELETE FROM ganhos WHERE id = ?';
    const result = await this.query({
      database: await this.getDbName(),
      statement: query,
      values: [id]
    });
    return result;
  }

  async getGastos(mes: number, ano: number): Promise<any[]> {
    const query = 'SELECT * FROM gastos WHERE mes = ? AND ano = ? ORDER BY data DESC';
    const result = await this.query({
      database: await this.getDbName(),
      statement: query,
      values: [mes, ano]
    });
    const gastos = [];
    for (let i = 0; i < result.values.length; i++) {
      gastos.push(result.values[i]);
    }
    return gastos;
  }

  async adicionarGasto(gasto: any): Promise<any> {
    const query = 'INSERT INTO gastos (descricao, valor, data, mes, ano) VALUES (?, ?, ?, ?, ?)';
    const result = await this.query({
      database: await this.getDbName(),
      statement: query,
      values: [
        gasto.descricao,
        gasto.valor,
        gasto.data,
        gasto.mes,
        gasto.ano
      ]
    });
    return result;
  }

  async excluirGasto(id: number): Promise<any> {
    const query = 'DELETE FROM gastos WHERE id = ?';
    const result = await this.query({
      database: await this.getDbName(),
      statement: query,
      values: [id]
    });
    return result;
  }

}
