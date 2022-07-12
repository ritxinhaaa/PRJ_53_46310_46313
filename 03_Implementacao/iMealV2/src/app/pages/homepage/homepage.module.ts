import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { HomepagePageRoutingModule } from './homepage-routing.module';
import { HomepagePage } from './homepage.page';

import { Ng2SearchPipeModule } from 'ng2-search-filter';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomepagePageRoutingModule,
    Ng2SearchPipeModule
  ],
  declarations: [HomepagePage]
})
export class HomepagePageModule {}
