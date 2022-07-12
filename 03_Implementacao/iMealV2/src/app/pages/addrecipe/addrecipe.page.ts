import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AddrecipePageForm } from './addrecipe.page.form';

// App services
import { AuthServices } from '../../services/auth/auth.page';
import { DatabaseServices } from '../../services/database/database.page';
import { Session } from '../../services/variables/variables.page';

import { Plugins } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { getDownloadURL, getStorage, ref, uploadString } from 'firebase/storage';

import { Renderer2 } from '@angular/core';
import { RegisterPageRoutingModule } from '../register/register-routing.module';

@Component({
  selector: 'app-addrecipe',
  templateUrl: './addrecipe.page.html',
  styleUrls: ['./addrecipe.page.scss'],
})

export class AddrecipePage implements OnInit {

  form: FormGroup;

  recipeid;
  recipeImages: Array<Photo> = [];
  imagesUrl: Array<string> = [];
  imageedefaultUrl = ["assets/imgs/default_recipe.png"];

  // Default information
  dietTypes = ['Vegan', 'Gluten-free', 'Vegetarian', 'Keto', 'General'];
  selectedDiet = "";      // variável que guarda a dieta selecionada
  allingredients = [];    // lista com os ingredientes na base de dados

  inglistNames = [];
  inglistUnits = [];      // lista com o id das quantidades que o utilizador adicionou {unit:"2kg"}
  inglistIds = [];        // lista com o id dos ingredientes que o utilizador adicionou {id:"hasdhas"}
  instructionsList = [];  // lista com as instruções das receitas 

  numberInstruction = 0;

  // *Bind html elements to variable
  unit = "";              // unidade do alimento atualmente selecionado
  option = "";            // alimento atualmente selecionado
  optionname = "";        // nome do alimento atualmente selecionado

  // Input to select ingredients and units
  inputIng;
  inputUnit;

  validParameters = false; // regista se os parametros fora do formulário são válidos (imagens e ingredientes)

  constructor(
    private router: Router,
    private session: Session,
    private renderer: Renderer2,
    private formBuilder: FormBuilder,
    private authServices: AuthServices,
    private dbServices: DatabaseServices,) {
      console.log(this.session.ingredientDatabase);
    }

  ngOnInit() {
    this.form = new AddrecipePageForm(this.formBuilder).createForm();
    this.allingredients = this.session.ingredientDatabase;
  }

  // Fired when the component routing from is about to animate.
  ionViewWillLeave() {}


  //
  ///// Handle Add recipe
  handleAddrecipe() {
    let title = this.form.get('title').value;
    let duration = this.form.get('duration').value;
    let portion = this.form.get('portion').value;
    let description = this.form.get('description').value;
    let dietType = this.selectedDiet;
    let instructions = this.instructionsList;
    // let ingredients = this.addedIngredients;

    let ingredients = [];
    for (let i = 0; i < this.inglistIds.length; i++) {
      let ingid = this.inglistIds[i];
      let ingunit = this.inglistUnits[i];

      ingredients.push({ingid,ingunit});
    }

    const recipeInfo = {
      title: title,
      duration: duration,
      portion: portion,
      description: description,
      ingredients: ingredients,
      instructions: instructions,
      dietType: dietType
    }

    console.log(recipeInfo);

    this.dbServices.addRecipe(this.session.userid, recipeInfo).then((result) => { 
      this.recipeid = result;
      this.navigateRecipepage(); 
    })
  }


  //
  ////// Handle UI interaction
  // Diet Type Selection
  handleDiet(diet) {
    let oldSelection = this.selectedDiet;
    this.selectedDiet = diet;

    if(oldSelection != ""){
      const oldFig = document.getElementById("img"+oldSelection);
      this.renderer.removeClass(oldFig, "selected-diet");
    }

    const figure = document.getElementById("img"+this.selectedDiet);
    this.renderer.addClass(figure, "selected-diet");
  }
  // Ingredient Selection 
  setValue(inputid) {
    const input = document.getElementById(inputid);

    let id = this.option;

    this.allingredients.forEach(element => {
      if(element.id === id){
        this.optionname = element.name;
      }
    });

    input.setAttribute("value", this.optionname);
  }
  // Adiciona o ingrediente ao bloco onde o utilizador vê os ingredientes que já selecionou
  addIng() {
    // Adicionar ingrediente e unidade a uma lista (get igredient name and id)
    let ingid = this.option;
    let ingunit = this.unit;
    let ingname = this.optionname;

    if(ingid != null) {

      // if ingredient was already added
      if(this.inglistIds.includes(ingid)) return;

      console.log(ingid);
      console.log(ingunit);

      ingunit = (ingunit != null) ? ingunit : "" ;
  
      this.inglistIds.push(ingid);
      this.inglistUnits.push(ingunit);
      const idx = this.inglistIds.indexOf(ingid,0);
  
      // Criar novo bloco com o nome do ingrediente e a quantidade
      const div = document.getElementById("ing-container");
  
      const p = document.getElementById("template").cloneNode();
      this.renderer.removeAttribute(p, "hidden");
      p.textContent = ingname + " " + ingunit;
  
      const cross = document.createElement("ion-icon");
      cross.setAttribute("name","close");
      cross.addEventListener("click", () => {
        this.inglistIds.splice(idx,1);
        this.inglistUnits.splice(idx,1);
        div.removeChild(p);
      });
  
      p.appendChild(cross);
      div.appendChild(p);

      this.inputIng = document.getElementById('ingredient');
      this.inputIng.value = '';

      this.inputUnit = document.getElementById('unit');
      this.inputUnit.value = '';
    }
  }
  // Adiciona a instrução ao bloco onde o utilizador vê os ingredientes que já selecionou
  addInstruction() {
    let newInstruction = this.form.get('instruction').value;
    this.form.get('instruction').setValue('');
  
    let idx = this.numberInstruction;
    this.numberInstruction++;
    this.instructionsList.push(newInstruction);
    let message = this.numberInstruction + ". " + newInstruction;

    console.log(idx);
    console.log(this.instructionsList)

    const list = document.getElementById("instruction-list");
    const item = document.createElement("ion-item");
    this.renderer.addClass(item, "text-area");

    const input = document.createElement("ion-input");
    this.renderer.setAttribute(input,"id", this.numberInstruction.toString())
    this.renderer.setAttribute(input, "value", message)
    this.renderer.setAttribute(input, "readOnly", "true");
    this.renderer.setAttribute(input, "style", "font-family: Abel");
    this.renderer.addClass(input, "text");

    const cross = document.createElement("ion-icon");
    this.renderer.setAttribute(cross, "style", "font-family: Abel");

    this.renderer.setAttribute(cross,"name","close")
    cross.addEventListener("click", () => {
      this.numberInstruction--;
      this.instructionsList.splice(idx,1)
      item.remove();
    });

    input.appendChild(cross);
    item.appendChild(input);
    list.appendChild(item);
  }


  //
  ///// Handle Preview and Upload images
  async handlePreviewimage(pickerid) {
    var DataUrl = "";

    const image = Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos // Camera, Photos or Prompt
    })
    if(await image) {
      const result = await image;
      this.recipeImages.push(result);
      console.log(this.recipeImages);
      DataUrl = result.dataUrl;
    }

    var imgPrev = document.getElementById(pickerid);
    imgPrev.setAttribute('src', DataUrl);
  }

  handleUploadimages(recipeid) {
    return new Promise((resolve, reject) => {
      for(let i = 0; i < this.recipeImages.length; i++) {
        const photo = this.recipeImages[i];
        const filePath = `uploads/${recipeid}/img${i+1}.png`;
        const fileRef = ref(getStorage(), filePath);

        let base64 = photo.dataUrl.split(',')[1]
        let response = uploadString(fileRef, base64, 'base64');

        response.then((response) => {
          getDownloadURL(fileRef).then((response) => {
            this.imagesUrl.push(response.toString());

            if(i == this.recipeImages.length - 1) {
              this.dbServices.setrecipeImages(recipeid, this.imagesUrl).then((response) => {
                resolve(response);
              })
            }
          })
        })
      }
    })
  }


  // 
  ///// Handle validate form
  valid() {
    // && this.recipeImages.length > 0
    this.validParameters = (this.inglistIds.length > 1 && this.selectedDiet != "");
    return this.form.valid && this.validParameters
  }


  // 
  ///// Handle navigate to recipepage
  navigateRecipepage() {

    console.log("Tou no navigate recipe page");

    // Senão é adicionada nenhuma página à receita
    if(this.recipeImages.length == 0) {
      this.dbServices.setrecipeImages(this.recipeid, this.imageedefaultUrl).then((response) => {
        console.log("Eu meti a imagem default na base de dados");
        this.router.navigate(['homepage']);
      })  
    }

    // Se são adicionadas páginas à receita
    this.handleUploadimages(this.recipeid).then((response) => {
      console.log("Eu meti as imagens na base de dados");
      this.router.navigate(['homepage']) })
  }

}