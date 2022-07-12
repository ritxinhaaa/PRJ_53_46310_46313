import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RecipepagePageRoutingModule } from './recipepage-routing.module';

import { RecipepagePage } from './recipepage.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RecipepagePageRoutingModule
  ],
  declarations: [RecipepagePage]
})
export class RecipepagePageModule {}
