import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FcmPage } from './fcm.page';

const routes: Routes = [
  {
    path: '',
    component: FcmPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FcmPageRoutingModule {}
