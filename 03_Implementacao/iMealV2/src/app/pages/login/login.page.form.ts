import { FormBuilder, FormGroup, Validators } from "@angular/forms";

export class LoginPageForm {

    private formBuilder: FormBuilder;

    constructor(formBuilder: FormBuilder) {
        this.formBuilder = formBuilder;
    }

    createForm() : FormGroup {
        return this.formBuilder.group({
            email: ['', [Validators.required, Validators.email]], // Validators class : Provides a set of built-in validators that can be used by form controls.
            password: ['', [Validators.required]]
        });
    }

}