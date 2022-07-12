import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EditrecipePage } from './editrecipe.page';

const routes: Routes = [
  {
    path: '',
    component: EditrecipePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EditrecipePageRoutingModule {}
