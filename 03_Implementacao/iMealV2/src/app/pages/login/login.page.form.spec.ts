import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { componentOnReady } from '@ionic/core';
import { LoginPageForm } from './login.page.form';

describe('LoginPageForm', () => {

    let loginPageForm: LoginPageForm;
    let form: FormGroup;

    beforeEach(() => {
        loginPageForm = new LoginPageForm(new FormBuilder());
        form = loginPageForm.createForm();
    });

    it('should create login form empty', () => {
        // verificar se a instância de form é ou não nula
        expect(form).not.toBeNull();

        // verificar se a instância de email é nula e está vazia
        expect(form.get('email')).not.toBeNull();
        expect(form.get('email').value).toEqual('');
        expect(form.get('email').valid).toBeFalsy();

        // verificar se a instância de password é nula e está vazia
        expect(form.get('password')).not.toBeNull();
        expect(form.get('password').value).toEqual('');
        expect(form.get('password').valid).toBeFalsy();
    });

    it('should have email invalid if email is not valid', () => {
        form.get('email').setValue('invalid email');

        expect(form.get('email').valid).toBeFalsy();
    });

    it('should have email valid if email is valid', () => {
        form.get('email').setValue('valid@email.com');

        expect(form.get('email').valid).toBeTruthy();
    });

    it('should have a valid form', () => {
        form.get('email').setValue('valid@email.com');
        form.get('password').setValue('anyPassword');

        expect(form.get('email').valid).toBeTruthy();
    });
});
