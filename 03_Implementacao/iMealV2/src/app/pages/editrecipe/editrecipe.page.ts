import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { getDownloadURL, getStorage, ref, uploadString } from 'firebase/storage';
import { EditrecipePageForm } from './editrecipe.page.form';

// Services
import { DatabaseServices } from '../../services/database/database.page';
import { Session } from '../../services/variables/variables.page';
import { resolve } from 'dns';

@Component({
  selector: 'app-editrecipe',
  templateUrl: './editrecipe.page.html',
  styleUrls: ['./editrecipe.page.scss']
})
export class EditrecipePage implements OnInit {

  /* 
  Para a página de editar a receita: (apagar isto depois)

  ---> Antes da página carregar
  - Obter informação da receita
  - Colocar informação toda no xml
  
  ---> Depois de sairmos da página
  - Fazer update da informação na base de dados
  */

  form: FormGroup; 

  // Store current recipe information
  recipeinfo;

  id: string = "";
  title: string = "";
  description: string = "";
  duration: string = "";
  portion: string = "";
  images = [];
  ingredients = [];
  instructions = [];

  authorid: string = "";
  authorName;

  // Default information
  dietTypes = ['Vegan','Gluten-free','Vegetarian','Keto','General'];
  allingredients = [];

  inglistNames = [];
  inglistUnits = [];
  inglistIds = [];

  numberInstruction = 0;

  // Updated variables
  selectedDiet = "";
  option = "";
  unit = "";
  save = false;

  // Handle images
  images64 = [];
  changedIndex = [null, null, null, null];

  constructor(
    private router: Router,
    private session: Session, 
    private renderer: Renderer2,
    private formBuilder: FormBuilder,
    private dbServices: DatabaseServices) { }

  ngOnInit() {
    this.form = new EditrecipePageForm(this.formBuilder).createForm();
  }

  // Fired when the component routing to is about to animate into view.  
  ionViewWillEnter() {
    // Store ingredients name, id and unit
    this.inglistIds = [];
    this.inglistUnits = [];
    this.inglistNames = []; 
    this.instructions= []; // must be reseted everytime we return to this page

    this.recipeinfo = this.session.recipeinfo;

    this.title = this.recipeinfo['title']
    this.description = this.recipeinfo['description'];
    this.duration = this.recipeinfo['duration']; 
    this.portion = this.recipeinfo['portion'];
    this.images = this.recipeinfo['images'];
    this.authorid = this.recipeinfo['authorid'];
    this.instructions = this.recipeinfo['instructions'];
    this.ingredients = this.recipeinfo['ingredients'];

    this.numberInstruction = this.instructions.length;
    this.allingredients = this.session.ingredientDatabase;

    this.ingredients.forEach(element => {
      let ingid = element['ingid'];
      let ingunit = element['ingunit'];

      this.inglistIds.push(ingid);
      this.inglistUnits.push(ingunit);

      this.dbServices.getingriedientInfo(ingid).then((response) => {
        let ingname = response['name'];
        this.inglistNames.push(ingname);
      })
    });

    // Get author name (is the name of the logged user)
    this.authorName = this.session.username;
  
    console.log(this.images)
  }

  ionViewDidEnter() {
    // reset ui to default parameters
    this.resetUI();
    // set default info
    this.setdefaultInfo();
  }

  // Fired when the component routing from is about to animate.
  ionViewWillLeave() {
    // if(this.save) this.saveChanges();
  }

  //
  ////// Set database information to UI
  setdefaultInfo() {
    // set dietType
    this.setDietType();

    // set title
    this.form.get('title').setValue(this.title);

    // set duration
    this.form.get('duration').setValue(this.duration);

    // set portion
    this.form.get('portion').setValue(this.portion);

    // set description
    this.form.get('description').setValue(this.description);

    // set ingredients
    for (let i = 0; i < this.inglistIds.length; i++) {
      const ingid = this.inglistIds[i];
      const ingunit = this.inglistUnits[i];
      const ingname = this.inglistNames[i];

      this.setIngredient(ingid, ingname, ingunit);
    }

    // set instructions
    console.log(this.instructions);
    for (let i = 0; i < this.instructions.length; i++) {
      const instruction = this.instructions[i];
      this.setInstruction(i, instruction);
    }

    // set images
    this.setImages();
  }
  setDietType() {
    this.selectedDiet = this.recipeinfo['dietType'];

    const figure = document.getElementById("img"+this.selectedDiet);
    this.renderer.addClass(figure, "selected-diet"); 
  }
  setIngredient(ingid, ingname, ingunit) {
    const idx = this.inglistIds.indexOf(ingid,0);

    // Criar bloco com o nome do ingrediente e a quantidade
    const div = document.getElementById("ing-container");

    const p = document.getElementById("template").cloneNode();
    this.renderer.removeAttribute(p, "hidden");
    // this.renderer.removeAttribute(p, "id");
    p.textContent = ingname + " " + ingunit;

    const cross = document.createElement("ion-icon");
    cross.setAttribute("name","close");
    cross.addEventListener("click", () => {
      this.inglistIds.splice(idx,1);
      this.inglistUnits.splice(idx,1);
      this.inglistNames.splice(idx,1);
      div.removeChild(p);
    });

    p.appendChild(cross);
    div.appendChild(p); 
  }
  setInstruction(idx, instruction) {
    const list = document.getElementById("instruction-list");
    const item = document.createElement("ion-item");
    this.renderer.setAttribute(item ,"id", "item"+idx.toString()+1);
    this.renderer.addClass(item, "text-area");

    const input = document.createElement("ion-input");
    this.renderer.setAttribute(input,"id", idx.toString()+1);
    this.renderer.setAttribute(input, "value", instruction);
    this.renderer.setAttribute(input, "readOnly", "true");
    this.renderer.addClass(input, "text");

    const cross = document.createElement("ion-icon");
    this.renderer.setAttribute(cross,"name","close")
    cross.addEventListener("click", () => {
      this.numberInstruction--;
      this.instructions.splice(idx,1)
      item.remove();
    });

    input.appendChild(cross);
    item.appendChild(input);
    list.appendChild(item);
  }
  setImages() {
    for (let i = 1; i < this.images.length+1; i++) {
      const imgsrc = this.images[i-1];
      
      const img = document.getElementById("picker"+i)
      this.renderer.setAttribute(img, "src", imgsrc);
    }
  }

  ////// Handle UI interaction
  resetUI() {
    // Limpar bloquinhos com ingredientes da view
    let div = document.getElementById("ing-container");
    div.replaceChildren();

    // Limpar bloquinhos com instruções da view
    for (let i = 1; i < this.instructions.length+1; i++) {
      let instructionBlock = document.getElementById("item"+i.toString());
      if(instructionBlock!= null) instructionBlock.remove();
    }
  }
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
    let name = "";

    this.allingredients.forEach(element => {
      if(element.id === id){
        name = element.name;
      }
    });

    input.setAttribute("value", name);
  }
  // Adiciona o ingrediente ao bloco onde o utilizador vê os ingredientes que já selecionou
  addIng() {
    // Adicionar ingrediente e unidade a uma lista (get igredient name and id)
    let ingid = this.option;
    let ingunit = this.unit;
    let ingname = ""

    if(ingid != null) {

      console.log(ingid);
      console.log(ingunit);

      ingunit = (ingunit != null) ? ingunit : "" ;

      this.allingredients.forEach(element => {
        if(element.id === ingid) {
          ingname = element.name;
        }
      });

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
    }
  }
  // Adiciona a instrução ao bloco onde o utilizador vê os ingredientes que já selecionou
  addInstruction() {
    let newInstruction = this.form.get('instruction').value;
    this.form.get('instruction').setValue('');

    let idx = this.numberInstruction;
    this.numberInstruction++;
    this.instructions.push(newInstruction);
    let message = this.numberInstruction + ". " + newInstruction;

    console.log(idx);

    const list = document.getElementById("instruction-list");
    const item = document.createElement("ion-item");
    this.renderer.addClass(item, "text-area");

    const input = document.createElement("ion-input");
    this.renderer.setAttribute(input,"id", this.numberInstruction.toString())
    this.renderer.setAttribute(input, "value", message)
    this.renderer.addClass(input, "text");

    const cross = document.createElement("ion-icon");
    this.renderer.setAttribute(cross,"name","close")
    cross.addEventListener("click", () => {
      this.numberInstruction--;
      this.instructions.splice(idx,1)
      item.remove();
    });

    input.appendChild(cross);
    item.appendChild(input);
    list.appendChild(item);
  }
  // Adiciona as imagens selecionadas à view do utilizador
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
      // this.images64.push(result);
      DataUrl = result.dataUrl;
      console.log(DataUrl);

      switch (pickerid) {
        case 'picker1':
          this.changedIndex[0] = result;
          break;
        case 'picker2':
          this.changedIndex[1] = result;
          break;
        case 'picker3':
          this.changedIndex[2] = result;
          break;
        case 'picker4':
          this.changedIndex[3] = result;
          break;
      }
    }

    var imgPrev = document.getElementById(pickerid);
    imgPrev.setAttribute('src', DataUrl);
  }
  handleUploadimages(recipeid) {
    return new Promise((resolve, reject) => {

      console.log(this.images);
      console.log(this.changedIndex);

      for(let i = 0; i < this.changedIndex.length; i++) {

        if(this.changedIndex[i] != null) { // se este index foi alterado nas imagens
          const photo = this.changedIndex[i];
          const filePath = `uploads/${recipeid}/img${i+1}.png`;
          const fileRef = ref(getStorage(), filePath);

          let base64 = photo.dataUrl.split('data:image/jpeg;base64,')[1];
          let uploadResult = uploadString(fileRef, base64, 'base64');
  
          uploadResult.then((response) => {
            getDownloadURL(fileRef).then((firestoreurl) => {

              const newLink = firestoreurl;
              
              // Se o index onde estamos está definido no array da base de dados 
              // (user alterou a imagem 3 mas esta antes não tinha image nenhuma, vamos até ao idx 2,
              // mas images.length só tem size 2 (só indexa até ao 1) , lg não podemos indexar o 2. Para o fazermos o size 
              // tem que ser maior que o index ou igual)
              if(i <= this.images.length-1) {
                this.images[i] = newLink;
              }
              else {
                this.images.push(newLink);
              }

            })
          })
        }
      }
      resolve(this.images);
      console.log("Fim do handle upload image");
    })
  }


  // 
  ////// Handle save changes
  saveChanges() {
    return new Promise((resolve, reject) => {
      let ingredients = [];
      for (let i = 0; i < this.inglistIds.length; i++) {
        let ingid = this.inglistIds[i];
        let ingunit = this.inglistUnits[i];
        ingredients.push({ingid,ingunit});
      }

      this.handleUploadimages(this.session.recipeid).then(() => {
        let parameters = [];

        console.log("Im in save changes")
        console.log(this.images);

        parameters.push(
          this.form.get('title').value,
          this.selectedDiet,
          this.form.get('description').value,
          this.form.get('duration').value,
          this.form.get('portion').value,
          ingredients,
          this.instructions,
          this.images,
          this.session.userid);

        this.dbServices.updateRecipe(this.session.recipeid, parameters).then((response) => { 
          resolve(response); })
      })
    })
  }


  // 
  ///// Handle navigate to recipepage
  navigateRecipepage() {
    this.saveChanges().then((response) => {
      console.log(response);
      console.log("Im navigating to recipe page");
      // this.router.navigate(['recipepage', this.session.recipeid]);
    })
  }
}
