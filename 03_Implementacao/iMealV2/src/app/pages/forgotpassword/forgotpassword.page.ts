import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { LoginPageForm } from '../login/login.page.form';

// Auth services
import { AuthServices } from 'src/app/services/auth/auth.page';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgotpassword',
  templateUrl: './forgotpassword.page.html',
  styleUrls: ['./forgotpassword.page.scss'],
})
export class ForgotpasswordPage implements OnInit {

  form: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private authServices: AuthServices,
    private router: Router ) { }

  ngOnInit() {
    this.form = new LoginPageForm(this.formBuilder).createForm();
  }

  resetPassword(){
    const email = this.form.get('email').value;
    this.authServices.resetPassword(email);
  }
}
