import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FcmPageRoutingModule } from './fcm-routing.module';

import { FcmPage } from './fcm.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FcmPageRoutingModule
  ],
  declarations: [FcmPage]
})
export class FcmPageModule {}
