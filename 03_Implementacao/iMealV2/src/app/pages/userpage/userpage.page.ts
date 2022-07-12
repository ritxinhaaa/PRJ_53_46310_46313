import { Component, OnInit, TRANSLATIONS_FORMAT } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { ActivatedRoute, Router } from '@angular/router';

import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';

import { AuthServices } from 'src/app/services/auth/auth.page';
import { DatabaseServices } from 'src/app/services/database/database.page';
import { Session } from 'src/app/services/variables/variables.page';

import { getDownloadURL, getStorage, ref, uploadString } from 'firebase/storage';
import { identity } from 'rxjs';
 
@Component({
  selector: 'app-userpage',
  templateUrl: './userpage.page.html',
  styleUrls: ['./userpage.page.scss'],
})
export class UserpagePage implements OnInit {

  userinfo;
  userid: string = "";
  username: string = "";
  useravatar: string = "";
  userrecipes: Array<any> = [];

  followersList;
  followingList;
  numFollowers;
  numFollowing;

  updatedImage;

  isuserProfile = false;        // Verifica se este é o perfil do utilizador logado
  sessionStarted = false;       // Verifica se existe algum utilizador logado

  userinFollowinglist = false;  // Verifica se o utilizador logado segue este utilizador
  followUser = false;           // Regista se o utilizador pretende seguir este utilizador

  showfollowBtn;                // Indica se devemos mostrar o botão para seguir
  showfollowedBtn;              // Indica se devemos mostrar o botão de já estar seguido

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private session: Session,
    private authServices: AuthServices,
    private dbServices: DatabaseServices,
    private storage: AngularFireStorage) {}

  ngOnInit() {}

  // Fired when the component routing to is about to animate into view
  ionViewWillEnter() {
    this.userid = this.route.snapshot.paramMap.get('id');
    this.isuserProfile = (this.session.userid == this.userid);
    this.sessionStarted = this.authServices.sessionStarted;

    console.log("Session is started " + this.sessionStarted);
    console.log("Is user profile " + this.isuserProfile);

    // Vamos buscar a informação do utilizador
    this.dbServices.getuserInfo(this.userid).then((response) => {
      this.userinfo = response;
      this.username = response['name'];
      this.useravatar = response['profileurl'];
    })

    // Vamos buscar a lista de receitas do utilizador e respetivos ratings
    this.dbServices.getuserRecipes(this.userid).then((response)=> {
      this.userrecipes = response;

      this.userrecipes.forEach(recipe => {
        this.dbServices.getmedianRating(recipe['id']).then((rating) => {
          recipe['rating'] = rating;
        })
      });
    })

    // Vamos buscar a lista de followers do utilizador
    this.dbServices.getFollowers(this.userid).then((response) => {
      this.followersList = response;
      this.numFollowers = this.followersList.length;
    })

    // Vamos buscar a lista de pessoas que o utilizador segue
    this.dbServices.getFollowing(this.userid).then((response) => {
      this.followingList = response;
      this.numFollowing = this.followingList.length;
    })

    // Se este não é o perfil do utilizador atual, vamos verificar se está na lista de seguidores
    if(this.sessionStarted && !this.isuserProfile) {
      this.dbServices.getFollowing(this.session.userid).then((response) => {
        let followingList = response;

        if(followingList.includes(this.userid)) {
          this.userinFollowinglist = true;
          this.followUser = this.userinFollowinglist;

          this.showfollowBtn = false;
          this.showfollowedBtn = true;
        } else {
          this.showfollowBtn = true;
          this.showfollowedBtn = false;
        }
      })
    }
  }

  // Fired when the component routing from is about to animate.
  ionViewWillLeave() {
    // Atualizar nova imagem na base de dados caso tenha havido uma alteração
    if(this.updatedImage != null) {
      this.uploadImage(this.updatedImage);
    }

    // Atualizar lista de seguidores
    if(this.sessionStarted && !this.userinFollowinglist && this.followUser) {
      console.log('[ionViewDidLeave] - Vou dar follow a este seguidor');
      this.dbServices.addFollowing(this.session.userid, this.userid);
    }
    else if(this.sessionStarted && this.userinFollowinglist && !this.followUser) {
      console.log('[ionViewDidLeave] - Vou dar unfollow a este seguidor');
      this.dbServices.removeFollowing(this.session.userid, this.userid);
    }
  }


  // 
  ///// Handle toggle follow button
  toggleFollow() {
    this.followUser = !this.followUser;
    this.showfollowBtn = !this.showfollowBtn;
    this.showfollowedBtn = !this.showfollowedBtn;
  }


  //
  ///// Handle image events

  // Change image
  async changeImage() {
    const image = Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos // Camera, Photos or Prompt
    })
    
    if(await image) {
      this.updatedImage = await image;
      let dataUrl = this.updatedImage.dataUrl;
      this.previewImage(dataUrl);
    }
  }

  // Preview image in page
  previewImage(imgdataUrl) {
    var userimg = document.getElementById("userimage");
    userimg.setAttribute('src', imgdataUrl);
  }

  // Upload image to database
  uploadImage(image: Photo) {
    return new Promise((resolve, reject) => {
      const filePath = `uploads/${this.userid}/profile_pic.png`;
      const fileRef = ref(getStorage(), filePath);

      const task = new Promise((resolve, reject)=> {
        let base64 = image.dataUrl.split(',')[1]
        resolve(uploadString(fileRef, base64, 'base64'));
      }).then((response) => {
        const downloadUrl = getDownloadURL(fileRef);

        downloadUrl.then((response) => {
          let url = response;
          this.dbServices.setuserAvatar(this.session.userid, url).then((imageurl) => {
            this.session.userimage = imageurl;
            resolve(imageurl);
          })
        })
      })
    })
  }


  //
  ///// Handle log out event
  logout() {
    this.authServices.logout().then((response) => {
      this.router.navigate(['homepage']); })
  }

  //
  ///// Handle navigation events
  
  // Navigate back to homepage
  goBack() {
    // Atualizar nova imagem na base de dados caso tenha havido uma alteração
    if(this.updatedImage != null) {
      this.uploadImage(this.updatedImage).then(() => {
        this.updatedImage == null;
        this.router.navigate(['homepage']);
      })
    }
    else {
      this.router.navigate(['homepage']);
    }
  }
  // Navigate recipe page
  clickRecipe(recipeId) {
    this.router.navigate(['recipepage', recipeId]);}
  // Navigate followers page
  navigateFollowers(followingSection: boolean) {
    this.router.navigate(['followers', this.userid, followingSection]);}
}