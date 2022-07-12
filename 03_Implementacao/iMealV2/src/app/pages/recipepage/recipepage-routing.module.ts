import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RecipepagePage } from './recipepage.page';

const routes: Routes = [
  {
    path: '',
    component: RecipepagePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RecipepagePageRoutingModule {}
