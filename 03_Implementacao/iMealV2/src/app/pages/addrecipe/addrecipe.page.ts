import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AddrecipePageForm } from './addrecipe.page.form';

// App services
import { AuthServices } from '../../services/auth/auth.page';
import { DatabaseServices } from '../../services/database/database.page';
import { Session } from '../../services/variables/variables.page';

import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { getDownloadURL, getStorage, ref, uploadString } from 'firebase/storage';

import { Renderer2 } from '@angular/core';

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
  imageedefaultUrl = ['assets/imgs/default_recipe.png'];

  // Default information
  dietTypes = ['Vegan', 'Gluten-free', 'Vegetarian', 'Keto', 'General'];
  selectedDiet = '';      // variável que guarda a dieta selecionada
  allingredients = [];    // lista com os ingredientes na base de dados

  inglistNames = [];
  inglistUnits = [];      // lista com o id das quantidades que o utilizador adicionou {unit:"2kg"}
  inglistIds = [];        // lista com o id dos ingredientes que o utilizador adicionou {id:"hasdhas"}
  instructionsList = [];  // lista com as instruções das receitas

  numberInstruction = 0;

  // *Bind html elements to variable
  unit = '';              // unidade do alimento atualmente selecionado
  option = '';            // alimento atualmente selecionado
  optionname = '';        // nome do alimento atualmente selecionado

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
    const title = this.form.get('title').value;
    const duration = this.form.get('duration').value;
    const portion = this.form.get('portion').value;
    const description = this.form.get('description').value;
    const dietType = this.selectedDiet;
    const instructions = this.instructionsList;

    const ingredients = [];
    for (let i = 0; i < this.inglistIds.length; i++) {
      const ingid = this.inglistIds[i];
      const ingunit = this.inglistUnits[i];

      ingredients.push({ingid,ingunit});
    }

    const recipeInfo = {
      title,
      duration,
      portion,
      description,
      ingredients,
      instructions,
      dietType
    };

    this.dbServices.addRecipe(this.session.userid, recipeInfo).then((result) => {
      this.recipeid = result;
      this.navigateRecipepage();
    });
  }


  //
  ////// Handle UI interaction
  // Diet Type Selection
  handleDiet(diet) {
    const oldSelection = this.selectedDiet;
    this.selectedDiet = diet;

    if(oldSelection !== ''){
      const oldFig = document.getElementById('img'+oldSelection);
      this.renderer.removeClass(oldFig, 'selected-diet');
    }

    const figure = document.getElementById('img'+this.selectedDiet);
    this.renderer.addClass(figure, 'selected-diet');
  }
  // Ingredient Selection
  setValue(inputid) {
    const input = document.getElementById(inputid);

    const id = this.option;

    this.allingredients.forEach(element => {
      if(element.id === id){
        this.optionname = element.name;
      }
    });

    input.setAttribute('value', this.optionname);
  }
  // Adiciona o ingrediente ao bloco onde o utilizador vê os ingredientes que já selecionou
  addIng() {
    // Adicionar ingrediente e unidade a uma lista (get igredient name and id)
    const ingid = this.option;
    let ingunit = this.unit;
    const ingname = this.optionname;

    if(ingid != null) {

      // if ingredient was already added
      if(this.inglistIds.includes(ingid)) {return;}

      ingunit = (ingunit != null) ? ingunit : '' ;

      this.inglistIds.push(ingid);
      this.inglistUnits.push(ingunit);
      const idx = this.inglistIds.indexOf(ingid,0);

      // Criar novo bloco com o nome do ingrediente e a quantidade
      const div = document.getElementById('ing-container');

      const p = document.getElementById('template').cloneNode();
      this.renderer.removeAttribute(p, 'hidden');
      p.textContent = ingname + ' ' + ingunit;

      const cross = document.createElement('ion-icon');
      cross.setAttribute('name','close');
      cross.addEventListener('click', () => {
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
    const newInstruction = this.form.get('instruction').value;
    this.form.get('instruction').setValue('');

    const idx = this.numberInstruction;
    this.numberInstruction++;
    this.instructionsList.push(newInstruction);
    const message = this.numberInstruction + '. ' + newInstruction;

    const list = document.getElementById('instruction-list');
    const item = document.createElement('ion-item');
    this.renderer.addClass(item, 'text-area');

    const input = document.createElement('ion-input');
    this.renderer.setAttribute(input,'id', this.numberInstruction.toString());
    this.renderer.setAttribute(input, 'value', message);
    this.renderer.setAttribute(input, 'readOnly', 'true');
    this.renderer.setAttribute(input, 'style', 'font-family: Abel');
    this.renderer.addClass(input, 'text');

    const cross = document.createElement('ion-icon');
    this.renderer.setAttribute(cross, 'style', 'font-family: Abel');

    this.renderer.setAttribute(cross,'name','close');
    cross.addEventListener('click', () => {
      this.numberInstruction--;
      this.instructionsList.splice(idx,1);
      item.remove();
    });

    input.appendChild(cross);
    item.appendChild(input);
    list.appendChild(item);
  }


  //
  ///// Handle Preview and Upload images
  async handlePreviewimage(pickerid) {
    let DataUrl = '';

    const image = Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos // Camera, Photos or Prompt
    });

    if(await image) {
      const result = await image;
      this.recipeImages.push(result);
      DataUrl = result.dataUrl;
    }

    const imgPrev = document.getElementById(pickerid);
    imgPrev.setAttribute('src', DataUrl);
  }

  handleUploadimages(recipeid) {
    return new Promise((resolve, reject) => {
      for(let i = 0; i < this.recipeImages.length; i++) {
        const photo = this.recipeImages[i];
        const filePath = `uploads/${recipeid}/img${i+1}.png`;
        const fileRef = ref(getStorage(), filePath);

        const base64 = photo.dataUrl.split(',')[1];
        const response = uploadString(fileRef, base64, 'base64');

        response.then(() => {
          getDownloadURL(fileRef).then(() => {
            this.imagesUrl.push(response.toString());

            if(i === this.recipeImages.length - 1) {
              this.dbServices.setrecipeImages(recipeid, this.imagesUrl).then(() => {
                resolve(response);
              });
            }
          });
        });
      }
    });
  }



  ///// Handle validate form
  valid() {
    this.validParameters = (this.inglistIds.length > 1 && this.selectedDiet !== '');
    return this.form.valid && this.validParameters;
  }



  ///// Handle navigate to recipepage
  navigateRecipepage() {

    // Senão é adicionada nenhuma página à receita
    if(this.recipeImages.length === 0) {
      this.dbServices.setrecipeImages(this.recipeid, this.imageedefaultUrl).then((response) => {
        this.router.navigate(['homepage']);
      });
    }

    // Se são adicionadas páginas à receita
    this.handleUploadimages(this.recipeid).then((response) => {
      this.router.navigate(['homepage']);
    });
  }
}