import { Component, OnInit, Renderer2 } from '@angular/core';
import { AngularFirestore, docChanges } from '@angular/fire/compat/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { IonModal } from '@ionic/angular';

// Auth services
import { AuthServices } from 'src/app/services/auth/auth.page';
import { DatabaseServices } from 'src/app/services/database/database.page';
import { Session } from 'src/app/services/variables/variables.page';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.page.html',
  styleUrls: ['./homepage.page.scss'],
})

export class HomepagePage implements OnInit {

  useravatar = "";
  searchTerm;
  filtersModal;

  // Array with all recipes
  recipes = [];

  // Handle show modal
  showModal = false;

  footerChoice = "footer";    // [footer, filter, randomMeal]
  //showFilters = false;
  //showRandomMeal: boolean = false;

  // Handle random meal generator
  randomMeal: Array<any> = [];

  // Handle filters
  dietTypes = ['Vegan','Gluten-free','Vegetarian','Keto','General']; // armazena todos os tipos de dietas
  ingredientDatabase: Array<any>;                                    // armazena todos os ingredientes na base de dados

  choosenIngredient = "";       // armazena o ingrediente que está atualmente no input de pesquisa
  searchIngredients = [];       // armazena os ids dos ingredientes que o utilizador está a pesquisar
  searchIngredientsName = [];   // armaznea os nomes dos ingredientes que o utilizador está a pesquisar
  exclusiveSearch = false;      // indica se a pesquisa por ingredientes é exclusiva

  // Input to select ingredients
  inputIng;

  // Handle show user profile image
  private showImage; 

  constructor(
    private session: Session,
    private renderer: Renderer2,
    private authServices: AuthServices,   // os authservices são usados no HTML
    private dbServices: DatabaseServices, // os databaseServices são usados no HTML
    private router: Router) { }
  
  ngOnInit() {
    this.filtersModal = document.getElementById("filtersModal") as HTMLIonModalElement;
    this.ingredientDatabase = this.session.ingredientDatabase;

    console.log(this.ingredientDatabase);
  }

  ionViewWillEnter() {
    this.useravatar = this.session.userimage;

    this.dbServices.getRecipes().then((response) => {
      this.recipes = response;
      
      this.recipes.forEach(recipe => {
        this.dbServices.getmedianRating(recipe.id).then((response) => {
          recipe.rating = response;
        })
      })
    });
  }


  //
  ///// Handle filter - diet type
  dietFilter = "";

  selectedDiet(diet) {
    let oldSelection = this.dietFilter;
    this.dietFilter = diet;

    if(oldSelection != ""){
      const oldFig = document.getElementById("img"+oldSelection);
      this.renderer.removeClass(oldFig, "selected-diet");
    }

    const figure = document.getElementById("img"+this.dietFilter);
    this.renderer.addClass(figure, "selected-diet");
  }


  //
  ///// Handle filter - ingredients
  setValue(inputid) {
    const input = document.getElementById(inputid);

    let id = this.choosenIngredient;
    let name = "";

    this.ingredientDatabase.forEach(element => {
      if(element.id === id){
        name = element.name;
      }
    });

    input.setAttribute("value", name);
  }

  // Adiciona o ingrediente ao bloco quando o modal é "ligado"
  //
  // - precisamos de realizar este passo porque quando
  showIngs() {
    console.log(this.footerChoice);
    this.footerChoice = (this.footerChoice == "filter") ? 'footer' : 'filter';
    console.log(this.footerChoice);

    // Criar novo bloco com o nome do ingrediente
    const div = document.getElementById("ing-container");

    // Criar um <p> novo para cada ingrediente que existe na lista
    this.searchIngredients.forEach(ingid => {
      const idx = this.searchIngredients.indexOf(ingid,0);
      const ingname = this.searchIngredientsName[idx];

      const p = document.createElement("p"); // document.getElementById("template").cloneNode();
      this.renderer.removeAttribute(p, "hidden");
      this.renderer.addClass(p, "ing-block");
      p.textContent = ingname;

      const cross = document.createElement("ion-icon");
      cross.setAttribute("name","close");
      cross.addEventListener("click", () => {
        this.searchIngredients.splice(idx,1);
        this.searchIngredientsName.splice(idx,1);
        div.removeChild(p);
      });

      p.appendChild(cross);
      div.appendChild(p);
    });
  }
  // Adiciona o ingrediente ao bloco onde o utilizador vê os ingredientes que já selecionou
  addIng() {
    // Adicionar ingrediente a uma lista (get igredient name and id)
    const ingid = this.choosenIngredient;
    let ingname = "";

    // console.log("I will add this ingredient " + ingid);

    this.ingredientDatabase.forEach(element => {
      if(element.id === ingid){
        ingname = element.name;
      }
    });

    this.searchIngredients.push(ingid);
    this.searchIngredientsName.push(ingname);
    const idx = this.searchIngredients.indexOf(ingid,0);

    // Criar novo bloco com o nome do ingrediente
    const div = document.getElementById("ing-container");

    const p = document.getElementById("template").cloneNode();
    this.renderer.removeAttribute(p, "hidden");
    p.textContent = ingname;

    const cross = document.createElement("ion-icon");
    cross.setAttribute("name","close");
    cross.addEventListener("click", () => {
      this.searchIngredients.splice(idx,1);
      this.searchIngredientsName.splice(idx,1);
      div.removeChild(p);
    });

    p.appendChild(cross);
    div.appendChild(p);

    this.inputIng = document.getElementById('ingredient');
    this.inputIng.value = '';
  }


  //
  ///// Handle apply filters
  applyFilter() {
    this.dbServices.getRecipesByFilter(this.searchIngredients, this.dietFilter, this.exclusiveSearch)
    .then((response) => {
      this.recipes = response;
      console.log(this.recipes);
    })
  }

  //
  ///// Handle clear filters
  clearFilter() {
    this.searchIngredients = [];
    this.dietFilter = "";

    this.dbServices.getRecipes().then((response) => {
      this.recipes = response;
    })
  }


  //
  ///// Handle random meal generator
  randomMealGenerator(){
    this.dbServices.getRecipes().then((response) => {
      this.recipes = response;
    });
  
    const messages = [];
    for(let i = 0; i < this.recipes.length; i++){
      messages[i] = this.recipes[i];
    }
  
    const randIndex = Math.floor(Math.random() * messages.length); // Get random index
    this.randomMeal = messages[randIndex];
  
    this.footerChoice = (this.footerChoice == "randomMeal") ? 'footer' : 'randomMeal';
    
    this.showImage = true;
  
    setTimeout(()=>{
      this.showImage = false;
    }, 3000);
  }


  //
  ///// Handle modal events
  dismissModal() {
    this.footerChoice = "footer";
  }

  //
  ///// Click events
  clickRecipe(recipeId) {
    this.router.navigate(['recipepage', recipeId]);
  }

  clickExclusiveSearch(e) {
    this.exclusiveSearch = !this.exclusiveSearch;
    console.log(this.exclusiveSearch);
  }


  //
  ///// Navigate to userpage
  navigateUserpage() {
    this.router.navigate(['userpage', this.session.userid]);
  }
}