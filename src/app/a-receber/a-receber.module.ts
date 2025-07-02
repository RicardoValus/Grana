import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AReceberPageRoutingModule } from './a-receber-routing.module';

import { AReceberPage } from './a-receber.page';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AReceberPageRoutingModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule
  ],
  declarations: [AReceberPage]
})
export class AReceberPageModule {}
