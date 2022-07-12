import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AddrecipePage } from './addrecipe.page';

const routes: Routes = [
  {
    path: '',
    component: AddrecipePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AddrecipePageRoutingModule {}
