import { Injectable } from '@angular/core';
import { DatabaseServices } from '../database/database.page';

@Injectable({
  providedIn: 'root'
})

export class Session {

  constructor( private dbServices: DatabaseServices ) {}

  ////////////////////////////////////////////
  //  THIS CLASS WILL STORE ALL VARIABLES 
  //  FROM A SESSION INCLUDING TEMPORARY ONES 
  ////////////////////////////////////////////

  // USER INFORMATION
  userid: string = "";      // store user id
  username: string = "";    // store user name
  useremail: string = "";   // store user email
  userimage: string = "";   // store user image

  // RECIPE INFORMARTION
  recipeid: string = ""; // stores recipe user is visiting at the moment 
  recipeinfo = [];       // stores recipe information  

  // DATABASE INFORMATION
  ingredientDatabase: Array<any> = []; // stores all ingredients in the database

  
  clearUserData() {
    this.userid = "";
    this.username = "";
    this.useremail = "";
    this.userimage = "";
  }
}
