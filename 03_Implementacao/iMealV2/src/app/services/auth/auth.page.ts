import { Injectable } from '@angular/core';
// import '@codetrix-studio/capacitor-google-auth';

// Ionic services
import { AlertController, IonList, LoadingController } from '@ionic/angular';

// Firebase services
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';

// Database services
import { DatabaseServices } from '../database/database.page';
import { Session } from '../variables/variables.page';

@Injectable({
  providedIn: 'root'
})

export class AuthServices {

  userVerified = false;
  sessionStarted = false;

  constructor(
    private auth: AngularFireAuth,
    private alertCtrl: AlertController,
    private session: Session,
    private dbServices: DatabaseServices,
    private loadingCtrl: LoadingController) {
  }


  /////// Authentication services functions (Firebase authentication)

  // Check if there is a user already signed in
  checkSession() {
    return new Promise((resolve, reject) => {
      this.auth.onAuthStateChanged((user) => {
        if(user) {
          console.log(user);
  
          this.sessionStarted = true;
          this.session.userid = user.uid;
  
          this.getCurrentuserData(this.session.userid).then((userinfo) => {
            this.session.username = userinfo['name'];
            this.session.useremail = userinfo['email'];
            this.session.userimage = userinfo['profileurl'];

            console.log(userinfo)
          }).then(() => {
            resolve(user);
          })
        }
      })
    })
  }

  // Login using email and password
  login(email: string, password: string) {
    return new Promise((resolve, reject) => {
      this.auth.signInWithEmailAndPassword(email,password)
      .then((userCredential) => {
        this.userVerified = userCredential.user.emailVerified;  // registamos se o email deste utilizador já está verificado
        
        if(this.userVerified) {
          this.sessionStarted = true;
          this.getCurrentuserData(this.session.userid).then((userinfo) => {
            this.session.username = userinfo['name'];
            this.session.useremail = userinfo['email'];
            this.session.userimage = userinfo['profileurl'];
          }).then(() => {
            resolve(userCredential);
          })
        }
        else {
          this.loginErrors('auth/not-verified')
        }
      })
      .catch(error => {
        this.loginErrors(error.code);
      })
    })
  }

  // Register using email and password
  register(username: string, email: string, password: string) {
    return new Promise((resolve, reject) => {
      this.auth.createUserWithEmailAndPassword(email, password)
      .then(async (userCredential) => {
        
        const userid = (await this.auth.currentUser).uid;
        this.dbServices.adduserInfo(username, email, userid);   // guardar o utilizador na base de dados

        (await this.auth.currentUser).sendEmailVerification().then(() => {
          this.emailverificationLog();
          resolve(userCredential);
        })
      })
      .catch(error => {
        // console.log(error.code);
        this.registerErrors(error.code)
      })
    })
  }

  // Reset password using email
  async resetPassword(email: string) {
    const loading = await this.loadingCtrl.create({
      message:"Sending reset password link",
      spinner:"crescent"
    });

    loading.present();

    this.auth.sendPasswordResetEmail(email).then(() => {
      loading.dismiss();
    })
    .catch((error) => {
      loading.dismiss();
    });
  }

  // log out function
  logout() {
    return new Promise((resolve, reject) => {
      this.auth.signOut().then((response) => {

        this.session.clearUserData();
        this.sessionStarted = false;

        resolve(response); })
    })
  }


  /////// Firestore services functions ///////
  getCurrentuserData(userid) {
    return new Promise((resolve, reject) => {
      this.dbServices.getuserInfo(userid).then((userinfo) => {
        resolve(userinfo);
      })
    });
  }


  /////// Logic functions ///////

  // Show alert with login errors
  loginErrors(error) {
    let title = "Login error";
    switch(error) {
      //  Thrown if the email address is not verified 
      case 'auth/not-verified':
        this.showAlert(title, "This email is not verified. Please chek your email for a verification code")
      //  Thrown if the email address is not valid. (esta verificação é feita no client side e dificilmente vai entrar aqui, mas para efeitos de coerencia deve estar aqui)
      case 'auth/invalid-email':
        this.showAlert(title, "This email is invalid");
        break;
      //  Thrown if the user corresponding to the given email has been disabled.
      case 'auth/user-disabled':
        this.showAlert(title, "This user has been disabled!");
        break;
      //  Thrown if there is no user corresponding to the given email.
      case 'auth/user-not-found':
        this.showAlert(title, "There is no user corresponding to this email!");  
        break;
      // Thrown if the password is invalid for the given email, or the account corresponding to the email does not have a password set.
      case 'auth/wrong-password':
        this.showAlert(title, "Wrong password. Try again or press Forget Password to reset password");
        break;
      default:
        console.log(error.message);
        break;
    }
  }

  // Show alert with registry errors
  registerErrors(error) {
    let title = "Register error";
    switch(error) {
      // Thrown if there already exists an account with the given email address.
      case 'auth/email-already-in-use':
          this.showAlert(title, "Email address already in use");
          break;
      // Thrown if the email address is not valid.
      case 'auth/invalid-email':
        this.showAlert(title, "This email is invalid");
        break;
      // Thrown if email/password accounts are not enabled. Enable email/password accounts in the Firebase Console, under the Auth tab
      case 'auth/operation-not-allowed':
        this.showAlert(title, "Error during sign up.");
        break;
      // Thrown if the password is not strong enough.
      case 'auth/weak-password':
        this.showAlert(title, "Password is not strong enough. Add additional characters including special characters and numbers.");
        break;
      default:
        console.log(error.message);
        break;
    }
  }

  // Show alert with email sent image
  emailverificationLog() {
    let title = "Verification email";
    this.showAlert(title, "Please check your email for an account verification email");
  }

  async showAlert(title, msg) {
    const alert = await this.alertCtrl.create({
      header: title,
      subHeader: msg
    })
    alert.present();
  }
  ///////////////////////////////////
}

