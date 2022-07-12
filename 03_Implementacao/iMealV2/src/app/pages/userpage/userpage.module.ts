import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { UserpagePageRoutingModule } from './userpage-routing.module';

import { UserpagePage } from './userpage.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    UserpagePageRoutingModule,
  ],
  declarations: [UserpagePage]
})
export class UserpagePageModule {}
