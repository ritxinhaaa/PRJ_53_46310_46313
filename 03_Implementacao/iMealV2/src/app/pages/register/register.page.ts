import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { RegisterPageForm } from './register.page.form';
import { Router } from '@angular/router';

// Auth services
import { AuthServices } from 'src/app/services/auth/auth.page';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {

  form: FormGroup;

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private authServices: AuthServices) {  }

  ngOnInit() {
    this.form = new RegisterPageForm(this.formBuilder).createForm();
  }

  checkPassword(): boolean{
    let password = this.form.get('password').value;
    let confirmPassword = this.form.get('confirmPassword').value;

    console.log(password);
    console.log(confirmPassword);
    console.log(password.length >= 6);

    return (password == confirmPassword && password.length >= 6);
  }

  register() {
    let name = this.form.get('name').value;
    let email = this.form.get('email').value;
    let password = this.form.get('password').value;

    this.authServices.register(name, email, password).then(() => {
      console.log("I registered you ;)");
      this.router.navigate(['login']);
    })
  }

  checkForm(){
    // retorna true se o form for válido e se a password for válida
    console.log("Form is " + this.form.valid + " Check password is " + this.checkPassword());
    return this.form.valid && this.checkPassword();
  }
}
