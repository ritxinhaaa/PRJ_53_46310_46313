import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

// Services
import { DatabaseServices } from 'src/app/services/database/database.page';
import { AuthServices } from 'src/app/services/auth/auth.page';
import { Session } from 'src/app/services/variables/variables.page';

// Temporary
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.page.html',
  styleUrls: ['./favorites.page.scss'],
})
export class FavoritesPage implements OnInit {

  userid: string = "";
  favoriteRecipes: Array<any> = [];
  ratings: Array<number> = [];

  constructor(
    private session: Session,
    private authServices: AuthServices,
    private firestore: AngularFirestore,
    private dbServices: DatabaseServices,
    private router: Router) { }

  ngOnInit() {}

  // Fired when the component routing to is about to animate into view.  
  ionViewWillEnter() {
    this.userid = this.session.userid;
    this.favoriteRecipes = [];

    this.dbServices.getfavoriteRecipes(this.userid).then((response) => {
      // ir buscar ids das receitas -> ir buscar info de cada receita
      response.forEach(recipeid => {
        this.dbServices.getRecipe(recipeid).then((recipe) => {
          this.dbServices.getmedianRating(recipeid).then((median) => {
            recipe['rating'] = median;

            this.favoriteRecipes.push(recipe);
          });
        });
      });
    })
  }


  ///// Click events
  clickRecipe(recipeId) {
    this.router.navigate(['recipepage', recipeId]);
  }

}