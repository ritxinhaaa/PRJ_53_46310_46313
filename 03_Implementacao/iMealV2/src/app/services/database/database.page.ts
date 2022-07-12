import { Injectable, Query } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireDatabase, snapshotChanges } from '@angular/fire/compat/database';
import { read } from 'fs';
import { ErrorFactory } from '@firebase/util';
import { resolve, resolveCname } from 'dns';
import { rejects } from 'assert';


@Injectable({
  providedIn: 'root'
})

export class DatabaseServices {

  constructor(
    private firestore: AngularFirestore) {}


  ////////////////
  //////////////// Handle shoppinglist collection ////////////////

  // add recipe to user shopping list
  addShoppinglist(userid: string, recipeid: string) {
    return new Promise((resolve, reject) => {
      this.firestore.collection('shoppinglist').doc(userid).get().toPromise().then((snapshot) => {
        console.log(snapshot.data())
        let recipes = (snapshot.data() != null) ? snapshot.data()['recipes'] : [];
        recipes.push(recipeid);

        let task = this.firestore.collection('shoppinglist').doc(userid).set({ recipes: recipes })
        .then(() => {
          resolve(task);  
        })
      })
    })
  }

  // remove recipe from user shopping list
  removeShoppinglist(userid: string, recipeid: string) {
    return new Promise((resolve, reject) => {
      this.firestore.collection('shoppinglist').doc(userid).get().toPromise().then((snapshot) => {
        let recipes = snapshot.data()['recipes'];
        let recipeidx = recipes.indexOf(recipeid);

        recipes.splice(recipeidx, 1);
        let task = this.firestore.collection('shoppinglist').doc(userid).update({ recipes: recipes })
        .then(() => {
          resolve(task);
        })
      })
    })
  }


  // get shopping list from user
  getShoppinglist(userid: string): Promise<Array<any>> {
    return new Promise((resolve, reject) => {
      this.firestore.collection('shoppinglist').doc(userid).get().toPromise().then((snapshot) => {
        resolve(snapshot.data()['recipes']);
      }).catch(() => { 
        resolve([]);
      })
    })
  }

  ////////////////
  //////////////// Handle favorites collection ////////////////
  recipes;

  // Add recipe to specific user favorites list
  addrecipeFavorites(userid: string, recipeid: string) {
    return new Promise((resolve, reject) => {
      this.getfavoriteRecipes(userid).then((response) => {
        this.recipes = response;
        this.recipes.push(recipeid);
        let task = this.firestore.collection('users').doc(userid).update({ favorites: this.recipes});
        resolve(task);
      })
    })
  }

  removerecipeFavorites(userid: string, recipeid: string) {
    return new Promise((resolve, reject) => {
      this.getfavoriteRecipes(userid).then((response) => {
        this.recipes = (response != null) ? response : [];

        if(this.recipes != null && this.recipes.includes(recipeid)) {
          const index = this.recipes.indexOf(recipeid);
          this.recipes.splice(index, 1);
          let task = this.firestore.collection('users').doc(userid).update({ favorites: this.recipes});
          resolve(task);
        }
      })
    })
  }

  // Get recipes from specific user favorites list
  getfavoriteRecipes(userid: string): Promise<Array<any>>{
    return new Promise((resolve, reject) => {
      this.firestore.collection('users').doc(userid).get().toPromise().then((snapshot) => {
        let response = snapshot.data()['favorites'];
        resolve(response);
      });
    })
  }


  ////////////////
  //////////////// Handle recipes collection ////////////////
  getingriedientInfo(ingredientid: string) {
    return new Promise((resolve, reject) => {
      this.firestore.collection('ingredients').doc(ingredientid).get().toPromise().then((snapshot) => {

        let response = {
          name: snapshot.data()['name'],
          recipes: snapshot.data()['recipes']
        }

        resolve(response);
      })
    })
  }

  addRecipe(authorid: string, recipeInfo) {
    return new Promise((resolve, reject) => {
      let task = this.firestore.collection('recipes').add({
        title: recipeInfo['title'],
        duration: recipeInfo['duration'],
        portion: recipeInfo['portion'],
        description: recipeInfo['description'],
        ingredients: recipeInfo['ingredients'],
        instructions: recipeInfo['instructions'],
        dietType: recipeInfo['dietType'],
        images: [],
        userid: authorid
      })
      .then((docRef) => {
        recipeInfo['ingredients'].forEach(inginfo => {
          this.getingriedientInfo(inginfo['ingid']).then((response) => {

            let recipes = response['recipes'];
            recipes.push(docRef.id)

            // Adicionar a receita à coleção de ingredientes
            this.firestore.collection('ingredients').doc(inginfo['ingid']).update({ recipes: recipes  })

          })
        });

        resolve(docRef.id);
      })
    })
  }

  // Set recipe images
  setrecipeImages(recipeid: string, imagesUrl: Array<string>) {
    return new Promise((resolve, reject) => {
      let response = this.firestore.collection('recipes').doc(recipeid).update({ images: imagesUrl });
      resolve(response);
    })
  }

  // Fetch all info from a specific recipe
  getRecipe(recipeid: string) {
    return new Promise((resolve, reject) => {
      this.firestore.collection('recipes').doc(recipeid).get().toPromise().then((snapshot) => {

        let response =  {
          id: recipeid,
          title: snapshot.data()['title'],
          dietType: snapshot.data()['dietType'],
          description: snapshot.data()['description'],
          duration: snapshot.data()['duration'],
          portion: snapshot.data()['portion'],
          ingredients: snapshot.data()['ingredients'],
          instructions: snapshot.data()['instructions'],
          images: snapshot.data()['images'],
          authorid: snapshot.data()['userid']
        }

        resolve(response);
      })
    });
  }

  // Fecth all recipes
  getRecipes(): Promise<Array<any>>{
    return new Promise((resolve, reject) => {
      this.firestore.collection('recipes').get().toPromise().then((snapshot) => {

        let response = snapshot.docs.map(doc => {
          return {
            id: doc.id,
            title: doc.data()['title'],
            description: doc.data()['description'],
            image: doc.data()['images'][0]
          }
        })

        resolve(response);
      })
    });
  }


  // Updates recipe with given parameters
  updateRecipe(recipeid: string, parameters) {
    return new Promise((resolve, reject) => {

      console.log("\n Im in database")
      console.log(parameters[7])

      let task = this.firestore.collection('recipes').doc(recipeid).set({
          title: parameters[0],
          dietType: parameters[1],
          description: parameters[2],
          duration: parameters[3],
          portion: parameters[4],
          ingredients: parameters[5],
          instructions: parameters[6],
          images: parameters[7],
          userid: parameters[8]
      }).then(() => {
        console.log("I finished uploading");
        resolve(task);
      });
    })
  }

  ////// ->>> QUERIED SEARCHES

  // Fetch recipes uploaded by specified user
  getuserRecipes(userid: string): Promise<Array<any>> {
    return new Promise((resolve, reject) => {
      this.firestore.collection('recipes', ref => ref.where('userid', '==', userid)).get().toPromise().then((snapshot) => {
        let response = snapshot.docs.map(doc => {
          return {
            id: doc.id,
            image: doc.data()['images'][0],
            title: doc.data()['title'],
            description: doc.data()['description']
          }
        })
        resolve(response);
      })
    })
  }
  // Fetch recipes with specified diet type (retornamos só o id)
  getRecipesByDiet(dietType: string): Promise<Array<any>> {
    return new Promise((resolve, reject) => {
      this.firestore.collection('recipes', ref => ref.where('dietType', '==', dietType)).get().toPromise().then((snapshot) => {

        let response = snapshot.docs.map(doc => {
          return { id: doc.id }
        })

        resolve(response);
      })
    })
  }
  // Fetch recipes by ingredient list
  getRecipesByIng(ingSearchList: Array<string>): Promise<Array<any>> {
    return new Promise((resolve, reject) => {

      let filteredRecipeList = [];  // guarda só os ids repetidos
      let resultRecipelist = [];    // guarda as receitas selecionadas no final
      let recipeList = [];          // guarda todos os ids das receitas dos ingredientes
      let idx = 0;

      let debuglog = "[getRecipesByIngredient] - ";

      ingSearchList.forEach(ingid => {
        this.firestore.collection('ingredients').doc(ingid).get().toPromise().then((snapshot) => {

          recipeList.push(...snapshot.data()['recipes']);
          idx++;

          // Se já fomos buscar as receitas de todos os ingredientes
          if(idx == ingSearchList.length) {

            // Se a lista de pesquisa tem mais de um ingrediente
            if(ingSearchList.length > 1) {
              console.log(debuglog + recipeList);
              console.log(debuglog + "filteredList " + filteredRecipeList);
  
              // Remover receitas NÃO repetidas (só queremos as receitas em comum)
              recipeList.filter((value, index, self) => {     // check filter with crtl+click to check arguments
  
                if(!(self.indexOf(value) === index)) {        // if is duplicate
                    if(!filteredRecipeList.includes(value)) { // if it is not inside the list yet
                      filteredRecipeList.push(value);         // we add it to the list :D
                    }
                  }
              })

            }
            else {filteredRecipeList = recipeList; }

            if(filteredRecipeList.length == 0) resolve(filteredRecipeList);

            idx = 0;
            filteredRecipeList.forEach(recipeid => {
              idx++;
              this.getRecipe(recipeid).then((recipe) => { 
                resultRecipelist.push(recipe); })
              
              if(idx == filteredRecipeList.length) {
                resolve(resultRecipelist)}
            })

          }
        })
      });
    })
  }
  // Fecth recipes by exclusive ingredient list (only contains given ingredients)
  getRecipesByExclusiveIng(ingSearchList: Array<string>): Promise<Array<any>> {
    // Vamos buscar as receitas dos ingredientes da lista
    // nas receitas excluimos todas as que têm mais de dois ingredientes
    return new Promise((resolve, reject) => {
      
      let filteredRecipeList = [];  // guarda só os ids repetidos
      let resultRecipelist = [];    // guarda as receitas selecionadas no final
      let recipeList = [];          // guarda todos os ids das receitas na lista de receitas de cada ingrediente
      let idx = 0;


      ingSearchList.forEach(ingid => {

        this.firestore.collection('ingredients').doc(ingid).get().toPromise().then((snapshot) => {

          // Guardar todas as receitas de todos os ingredientes
          recipeList.push(...snapshot.data()['recipes']);
          idx++;

          console.log(recipeList);

          // Se já fomos buscar as receitas de todos os ingredientes
          if(idx == ingSearchList.length) {

            // Se a lista de pesquisa tem mais de um ingrediente
            if(ingSearchList.length > 1) {
              
              // Remover receitas NÃO repetidas (só queremos as receitas em comum)
              recipeList.filter((value, index, self) => {
                if(!(self.indexOf(value) === index)){       // if is duplicate
                  if(!filteredRecipeList.includes(value)) { // if it is not inside the list yet
                    filteredRecipeList.push(value);         // we add it to the list :D
                  }
                }
              })

              // Para o caso remoto de não haverem receitas repetidas filteredRecipeList não pode ficar vazio
              // assim, assume o valor da lista original que não tem repetidos
              if(filteredRecipeList.length == 0) filteredRecipeList = recipeList; 
            }
            else { filteredRecipeList = recipeList; }

            idx = 0;
            // Adicionar à lista as receitas com o número de ingredientes pertencentes à pesquisa
            filteredRecipeList.forEach(recipeid => {
              idx++;

              // Se a length de ingredientes da receita com este id for igual à lista de ingredientes que estamos
              // a pesquisar significa que esta tem exclusivamente estes ingredientes
              this.getRecipe(recipeid).then((recipe) => {
                
                if(recipe['ingredients'].length == ingSearchList.length) {
                  resultRecipelist.push(recipe); }

                if(idx == filteredRecipeList.length) {
                  resolve(resultRecipelist); }
              })
            });

          }
        })
      });
    })
  }
  // Fecth recipes by ingredient list
  getRecipesByIngredient(ingredientList: Array<string>, exclusiveSearch: boolean): Promise<Array<any>>  {
    return new Promise((resolve, reject) => {

      if(exclusiveSearch) {
        // Realiza uma pesquisa unicamente exclusiva
        this.getRecipesByExclusiveIng(ingredientList).then((response) => {
          resolve(response); })
      }
      else {
        // Realiza uma pesquisa não exclusiva
        this.getRecipesByIng(ingredientList).then((response) => { 
          resolve(response); })
      }
    })
  }
  // Fetch recipes with both filter applied
  getRecipesByFilter(ingFilter, dietType, exclusiveSearch): Promise<Array<any>> {
    return new Promise((resolve, reject) => {
      let ingResults;
      let dietResults;
  
      let filterIng = ingFilter.length > 0;
      let filterDiet = dietType != "";
  
      // Se são usados os dois filtros fazemos uma filtragem dupla
      if(filterIng && filterDiet) {

        console.log("Vou pesquisar por ingrediente e dieta");

        this.getRecipesByIngredient(ingFilter, exclusiveSearch).then((response) => {
          ingResults = response; 
        
          this.getRecipesByDiet(dietType).then((response) => {
            dietResults = response; 
            resolve(ingResults.concat(dietResults));
          })
        })
      }
      // Se só é usado o filtro por ingredientes
      else if(filterIng) {

        console.log("Vou pesquisar por ingrediente");
        console.log((exclusiveSearch) ? "é uma pesquisa exclusiva" : "é uma pesquisa não exclusiva");

        this.getRecipesByIngredient(ingFilter, exclusiveSearch).then((response) => {
          ingResults = response; 
          resolve(ingResults);
        })
      }
      // Se só é usado o filtro por dietas
      else if(filterDiet) {

        console.log("Vou pesquisar por ingrediente");

        this.getRecipesByDiet(dietType).then((response) => {
          dietResults = response; 
          resolve(dietResults);
        })
      }
    })
  }


  ////////////////
  //////////////// Handle users collection ////////////////

  // Add user info to firestore database
  adduserInfo(username: string, usermail: string, userid: string) {
    return new Promise((resolve, reject) => {
      let task = this.firestore.collection('users').doc(userid).set({
        name: username,
        email: usermail,
        profileUrl: "assets/imgs/default_user.png",
        favorites: [],
        followers: [],
        following: []
      }).then(() => {
        resolve(task);
      })
    })
  }

  // Fetch user info
  getuserInfo(userid: string){
    return new Promise((resolve, reject) =>{
      this.firestore.collection('users').doc(userid).get().toPromise().then((snapshot) => {

        let response = {
          id: userid,
          name: snapshot.data()['name'],
          email: snapshot.data()['email'],
          profileurl: snapshot.data()['profileUrl']
        }

        resolve(response);
      })
    })
  }

  // Set profile image url
  setuserAvatar(userid: string, imageurl): Promise<string> {
    return new Promise((resolve, reject) => {
      let response = this.firestore.collection('users').doc(userid).update({ profileUrl: imageurl })
      .then(() => {
        resolve(imageurl);
      })
    })
  }


  ////////////////
  //////////////// Handle ingredients collection ////////////////

  // THIS METHOD IS USED *ONCE* TO FILL THE DATABASE
  addIngredient(ingname) {
    return new Promise((resolve, reject) => {
      let response = this.firestore.collection('ingredients').add({
        name: ingname,
        recipes: []
      }).then(() => {
        resolve(response);
      })
    })
  }

  // Get all ingredients from database
  getIngredients(): Promise<Array<any>> {
    return new Promise((resolve, reject) => {
      this.firestore.collection('ingredients').get().toPromise().then((snapshot) => {
        let response = snapshot.docs.map(doc => {
          return {
            id: doc.id,
            name: doc.data()['name']
          }
        })
        resolve(response);
      })
    });
  }


  ////////////////
  //////////////// Handle followers collection ////////////////

  // Add user to following list
  addFollowing(userid: string, followid: string) {
    return new Promise((resolve, reject) => {
      this.getFollowing(userid).then((response) => {
        let followingList: Array<any> = response;
        followingList.push(followid);

        let task = this.firestore.collection('users').doc(userid).update({
          following: followingList
        }).then(() => {
          this.addFollower(followid, userid); // adicionamos ao outro user um seguidor (o user que o está a seguir)
        })

        resolve(task);
      })
    }) 
  }
  
  // Add user to followers list
  addFollower(userid: string, followerid: string) {
    return new Promise((resolve, reject) => {
      this.getFollowers(userid).then((response) => {
        let followersList: Array<any> = response;
        followersList.push(followerid);
        
        let task = this.firestore.collection('users').doc(userid).update({
          followers: followersList
        })

        resolve(task);
      })
    }) 
  }

  // Remove from following list (user stops following specified user)
  removeFollowing(userid: string, followid: string){
    return new Promise((resolve, reject) => {
      this.getFollowing(userid).then((response) => {
        
        let followingList = response;
        const index = followingList.indexOf(followid);

        // Se seguimos o utilizador especificado
        if(index > -1) {
          
          // afetacao da lista
          followingList.splice(index,1);

          let task = this.firestore.collection('users').doc(userid).update({
            following: followingList
          }).then(() => {
            this.removeFollower(followid,userid); // removemos ao outro user, este seguidor
            resolve(task);
          })
        }
      })
    })
  }
  
  // Remove from followers (someone stops following user)
  removeFollower(userid: string, followerid: string){
    return new Promise((resolve, reject) => {
      this.getFollowers(userid).then((response) => {

        let followersList = response;
        const index = followersList.indexOf(followerid);

        // Se o utilizador especificado nos segue
        if(index > -1) {
          // afetacao da lista
          followersList.splice(index,1);

          let task = this.firestore.collection('users').doc(userid).update({
            followers: followersList
          }).then(() => {
            this.removeFollowing(followerid, userid); // o outro utilizador deixa de seguir este user 
            resolve(task);
          })
        }
      })
    })
  }

  // Get following list (list of users this user follows)
  getFollowing(userid: string): Promise<Array<any>> {
    return new Promise((resolve, reject) => {
      this.firestore.collection('users').doc(userid).get().toPromise().then((snapshot) => {
        resolve(snapshot.data()['following']);
      })
    })
  }
  
  // Get followers
  getFollowers(userid: string): Promise<Array<any>> {
    return new Promise((resolve, reject) => {
      this.firestore.collection('users').doc(userid).get().toPromise().then((snapshot) => {
        resolve(snapshot.data()['followers']);
      })
    })
  }

  
  ////////////////
  //////////////// Handle rating collection ////////////////

  // Add rating to db
  addRating(recipeid: string, userid: string, rating: number) {
    return new Promise((resolve, reject) => {
      let task = this.firestore.collection('ratings').doc(recipeid+"_"+userid).set({
        recipeid: recipeid,
        userid: userid,
        rating: rating
      }).then(() => {        
        resolve(task);
      })
    })
  }

  // Get rating from db (returns number)
  getRating(recipeid: string, userid: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this.firestore.collection('ratings').doc(recipeid+"_"+userid).get().toPromise().then((snapshot) => {
        if(snapshot.data() != null) resolve(snapshot.data()['rating']);
        else resolve(0);
      })
    })
  }

  // Get medium rating
  getmedianRating(recipeid: string): Promise<number>{
    return new Promise((resolve, reject) => {
      this.firestore.collection('ratings', ref => ref.where('recipeid','==',recipeid)).get().toPromise()
      .then((snapshot) => {
        let ratings = 0;
        let numratings = 0;
        snapshot.docs.map(doc => {
          ratings += doc.data()['rating'];
          numratings++;
        })

        if(ratings == 0 && numratings == 0) resolve(0);
        else resolve(Math.round(ratings/numratings));
      })
    })
  }

  // Edit rating from db
  updateRating(recipeid: string, userid: string, newrating: number) {
    return new Promise((resolve, reject) => {
      let task = this.firestore.collection('ratings').doc(recipeid+"_"+userid)
      .update({ rating: newrating }).then(() => {
        resolve(task);
      })
    })
  }


  ////////////////
  //////////////// Handle comments collection ////////////////

  addComment(authorid: string, recipeid: string, comment: string) {
    return new Promise((resolve, reject) => {
      let response = this.firestore.collection('comments').doc(recipeid).collection('comment').add({
        userid: authorid,
        comment: comment
      }).then(() => {
        resolve(response);
      })
    })
  }

  removeComment(authorid: string, recipeid: string) {}

  getComments(recipeid: string) {
    return new Promise((resolve, reject) => {
      this.firestore.collection('comments').doc(recipeid).collection('comment')
        .get().toPromise().then((snapshot) => {
          let response = snapshot.docs.map(doc => {
            return {
              id: doc.id,
              comment: doc.data()['comment'],
              userid: doc.data()['userid']
            }
          })

          resolve(response);
        })
    })
  }

}
