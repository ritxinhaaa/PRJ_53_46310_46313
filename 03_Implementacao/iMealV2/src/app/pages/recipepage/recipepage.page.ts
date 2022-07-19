import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { IonButton, IonSegmentButton } from '@ionic/angular';
import { TouchSequence } from 'selenium-webdriver';
import { runInThisContext } from 'vm';
import { AuthServices } from '../../services/auth/auth.page';
import { DatabaseServices } from '../../services/database/database.page';
import { Session } from '../../services/variables/variables.page';

@Component({
  selector: 'app-recipepage',
  templateUrl: './recipepage.page.html',
  styleUrls: ['./recipepage.page.scss']
})
export class RecipepagePage implements OnInit {

  // recipe info
  recipeinfo;
  recipeid = '';
  dietType = '';
  title = '';
  description = '';
  duration = '';
  portion = '';
  images = [];
  ingredients = [];
  instructions = [];

  authorid = '';
  authoravatar = '';

  // handle go to edit page
  isAuthor = false;       // só podemos editar a receita se o utilizador que está a vistar a página for seu autor
  popoverIsOpen = false;  // popover onde se podemo ver as opções do menu

  // comments info
  comment = '';
  numComments;
  recipeComments;
  recipeCommentInfo = [];

  // handle shoppinglist
  addShoppinglist = false;
  isinShoppingList = false;
  showaddButton = false;

  // handle add favorites
  addFavorites = false;
  recipeisFavorite = false;

  // handle rating
  dbRating = 0;         // get rating stored in database if defined
  medianRating = 0;     // get media rating stored in database if defined
  currentRating = 0;    // get rating registered by user in page if defined

  // handle comments
  showComments = false;  // wether comment view should be shown or not
  currentComments = [];           // store comments made by user

  // handle segment
  section = '';
  showIngredients = true;

  // Column size
  colSize = 4;

  // Slider options
  mySlideOptions = {
    initialSlide: 0,
    loop: true
  };

  constructor(
    private router: Router,
    private session: Session,
    private route: ActivatedRoute,
    private firestore: AngularFirestore,
    private authServices: AuthServices,
    private dbServices: DatabaseServices) {
      this.section = 'ingredients';
    }

  ngOnInit() {
    this.recipeid = this.route.snapshot.paramMap.get('id');
  }

  // Fired when the component routing to is about to animate into view.  
  ionViewWillEnter() {
    this.setinitaldesign();

    if (this.authServices.sessionStarted) {
      this.colSize = 3;
      // Vamos verificar se esta receita está nos favoritos do utilizador
      this.checkFavorites(this.recipeid).then((response) => {
        this.recipeisFavorite = response;
        this.addFavorites = this.recipeisFavorite;
      });
    }

    // Ir buscar rating e shopping list
    if(this.session.userid !== '') {
      // Get rating
      this.dbServices.getRating(this.recipeid, this.session.userid).then((response) => {
        this.dbRating = response;
        this.currentRating = this.dbRating;
      });

      // Get shopping list
      this.dbServices.getShoppinglist(this.session.userid).then((shoppinglist) => {
        this.isinShoppingList = shoppinglist.includes(this.recipeid);
      });
    }

    // Vamos buscar a informação da receita cada vez que entramos na página
    this.dbServices.getRecipe(this.recipeid).then(response => {
      this.recipeinfo = response;

      this.title = this.recipeinfo.title;
      this.dietType = this.recipeinfo.dietType;
      this.description = this.recipeinfo.description;
      this.duration = this.recipeinfo.duration;
      this.portion = this.recipeinfo.portion;
      this.images = this.recipeinfo.images;
      this.authorid = this.recipeinfo.authorid;
      this.instructions = this.recipeinfo.instructions;

      this.isAuthor = (this.authorid === this.session.userid);

      // Get ingredients names
      this.recipeinfo.ingredients.forEach(element => {

        const ingid = element.ingid;
        const ingunit = element.ingunit;

        this.dbServices.getingriedientInfo(ingid).then((ingname) =>{
          this.ingredients.push([ingname['name'], ingunit]);
        });
      });

      // Get author name
      this.dbServices.getuserInfo(this.authorid).then(response => {
        this.authoravatar = response['profileurl'];
      });

      // Get median rating
      this.dbServices.getmedianRating(this.recipeid).then((response) => {
        this.medianRating = response;
      });

      // Update session variables
      this.session.recipeid = this.recipeid;
      this.session.recipeinfo = this.recipeinfo;
    });

    // Vamos buscar a informação dos comentários cada vez que entramos na página
    this.dbServices.getComments(this.recipeid).then((response) => {
      this.recipeComments = response;
      this.numComments = this.recipeComments.length;
    }).then(() => {
      this.recipeComments.forEach(recipeComment => {
        const userid = recipeComment.userid;
        const comment = recipeComment.comment;

        this.dbServices.getuserInfo(userid).then((response) => {
          const userinfo = response;

          const username = userinfo['name'];
          const userimage = userinfo['profileurl'];

          this.recipeCommentInfo.push({
            username,
            userimage,
            comment
          });
        });
      });
    });
  }


  // Fired when the component routing to is about to animate into view.
  ionViewDidLeave() {
    const userid = this.session.userid;

    // só vamos adicionar a receita aos favoritos se esta ainda não estiver lá
    if(!this.recipeisFavorite && this.addFavorites) {
      this.dbServices.addrecipeFavorites(userid, this.recipeid);
    }
    // só vamos remover a receitas dos favoritos se esta já lá estiver
    else if(this.recipeisFavorite && !this.addFavorites) {
      this.dbServices.removerecipeFavorites(userid, this.recipeid);
    }

    // dbRating is 0 if no rating is found on database. So we use add function
    if(this.dbRating === 0) {
      if(this.currentRating !== 0) { // if user rated recipe
        this.dbServices.addRating(this.recipeid, this.session.userid, this.currentRating);
      }
    }
    // dbRating is != 0, means there was a value already. So we use update function
    else {
      if(this.dbRating !== this.currentRating && this.currentRating > 0) {
        this.dbServices.updateRating(this.recipeid, this.session.userid, this.currentRating);
      }
    }

    // Add comment to db
    this.currentComments.forEach(comment => {
      this.dbServices.addComment( this.session.userid, this.recipeid, comment);
    });

    // Add recipe to shopping list
    if(this.addShoppinglist) {
      this.dbServices.addShoppinglist(this.session.userid, this.recipeid);
    }

    this.ingredients = [];
    this.currentComments = [];
    this.recipeCommentInfo = [];
  }

  toggle() {
    this.addFavorites = !this.addFavorites;
  }

  //
  ////// Handle shopping list function
  handleShoppinglist() {
    this.addShoppinglist = true;
    alert('Recipe was added to your shopping list');
  }

  //
  ////// Handle ratings function
  handleRating(rating: number) {
    this.currentRating = rating;
  }

  //
  ////// Handle comments function
  handleComment() {
    if(this.comment !== '') {
      this.currentComments.push(this.comment);
    }
    this.comment = '';
  }


  //
  ///// Handle favorites
  tmpRecipes;

  checkFavorites(recipeid: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const userid = this.session.userid;
      this.dbServices.getfavoriteRecipes(userid).then((response) => {
        this.tmpRecipes = response;

        if(this.tmpRecipes != null) {
          resolve(this.tmpRecipes.includes(recipeid));
        }
        else {
          reject(false);
        }
      });
    });
  }


  //
  ///// Handle UI interactions
  colorScheme1 = ['white','black'];
  colorScheme2 = ['#34A853','#F5E7E0'];

  setinitaldesign() {
    const button1 = document.getElementById('ing-seg');
    const button2 = document.getElementById('inst-seg');

    button1.style.backgroundColor = this.colorScheme2[0];
    button1.style.color = this.colorScheme1[0];

    button2.style.backgroundColor = this.colorScheme1[0];
    button2.style.color = this.colorScheme1[1];
  }
  changeButtons(id1,id2) {
    const button1 = document.getElementById(id1);
    const button2 = document.getElementById(id2);

    button2.style.backgroundColor = this.colorScheme1[0];
    button2.style.color = this.colorScheme1[1];

    button1.style.backgroundColor = this.colorScheme2[0];
    button1.style.color = this.colorScheme1[0];
  }

  //
  ///// Navigation functions
  navigateHomepage() { this.router.navigate(['homepage']); }
  navigateUserpage() { this.router.navigate(['userpage', this.authorid]); }
}
