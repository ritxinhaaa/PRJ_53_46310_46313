import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AlertController, Platform } from '@ionic/angular';
import { AuthServices } from './services/auth/auth.page';
import { DatabaseServices } from './services/database/database.page';
import { Session } from './services/variables/variables.page';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {

  constructor(
    private route: Router,
    private session: Session,
    private authServices: AuthServices,
    private dbServices: DatabaseServices) {
    this.initializeApp();
  }

  initializeApp() {
    // Preencher o array que guarda todos os ingredientes que estõa na base dados
    this.dbServices.getIngredients().then((response) => {
      this.session.ingredientDatabase = response;
    })

    // Verificar se existe um utilizador logado
    this.authServices.checkSession().then(() => {
      console.log(this.session.userimage);
    })
  }

}
