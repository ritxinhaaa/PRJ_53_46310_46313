import { Component, OnInit, Renderer2 } from '@angular/core';
import { provideRoutes, Router } from '@angular/router';
import { deepStrictEqual } from 'assert';
import { DatabaseServices } from 'src/app/services/database/database.page';

import { Session } from 'src/app/services/variables/variables.page';

@Component({
  selector: 'app-shoppinglist',
  templateUrl: './shoppinglist.page.html',
  styleUrls: ['./shoppinglist.page.scss'],
})
export class ShoppinglistPage implements OnInit {

  // Shopping list
  shoppinglist = [];
  recipes = [];

  constructor(
    private router: Router,
    private session: Session,
    private dbServices: DatabaseServices,
    private renderer: Renderer2) { }
  

  ngOnInit() {
    this.dbServices.getShoppinglist(this.session.userid).then((response) => {
      console.log(response);
      this.shoppinglist = response;

      if(this.shoppinglist.length > 0) {

        this.shoppinglist.forEach(recipeid => {
          this.dbServices.getRecipe(recipeid).then((recipeinfo) => {

            const ingredients = [];
            const recipeings = recipeinfo['ingredients'];

            // Get ingredients names
            recipeings.forEach(ing => {
              const ingid = ing['ingid'];
              const ingunit = ing['ingunit'];

              this.dbServices.getingriedientInfo(ingid).then(() => {
                ingredients.push([response['name'], ingunit]);
              });
            });

            this.recipes.push({
              id: recipeinfo['id'],
              title: recipeinfo['title'],
              ingredients,
              image: recipeinfo['images'][0]
            });
          });
        });
      }
    });
  }

  removeRecipe(elementid, recipeId) {
    // Remove recipe from shopping list on database
    this.dbServices.removeShoppinglist(this.session.userid, recipeId);

    // Remove recipe from shopping list on page
    document.getElementById(elementid).remove();
  }

  ///// Click events
  clickRecipe(recipeId) {
    this.router.navigate(['recipepage', recipeId]);
  }
}
