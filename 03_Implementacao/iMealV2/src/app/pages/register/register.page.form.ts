import { FormBuilder, FormGroup, Validators } from "@angular/forms";

export class RegisterPageForm {

    private formBuilder: FormBuilder;

    constructor(formBuilder: FormBuilder) {
        this.formBuilder = formBuilder;
    }

    createForm() : FormGroup {
        return this.formBuilder.group({
            name: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.email]], // Validators class : Provides a set of built-in validators that can be used by form controls.
            password: ['', [Validators.required]],
            confirmPassword: ['', [Validators.required]]
        });
    }

}