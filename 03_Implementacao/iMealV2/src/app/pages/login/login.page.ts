import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { LoginPageForm } from './login.page.form';
import { Router } from '@angular/router';

// Auth services
import { AuthServices } from 'src/app/services/auth/auth.page';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  form: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private authServices: AuthServices,
    private router: Router){}

  ngOnInit() {
    this.form = new LoginPageForm(this.formBuilder).createForm();
  }

  login() {
    let email = this.form.get('email').value;
    let password = this.form.get('password').value;
    
    this.authServices.login(email, password).then(() => {
      if(this.authServices.userVerified) this.navigateHomepage();
    });
  }


  navigateHomepage() {
    this.router.navigate(['homepage']);
  }

}
