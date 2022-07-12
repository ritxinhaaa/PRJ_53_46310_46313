import { FormBuilder, FormGroup, Validators } from "@angular/forms";

export class EditrecipePageForm {

    private formBuilder: FormBuilder;

    constructor(formBuilder: FormBuilder) {
        this.formBuilder = formBuilder;
    }

    createForm() : FormGroup {
        return this.formBuilder.group({
            title: ['', [Validators.required]], // Validators class : Provides a set of built-in validators that can be used by form controls.
            duration: ['', [Validators.required, Validators.pattern("^[0-9]*$")]],
            portion: ['', [Validators.required, Validators.pattern("^[0-9]*$")]],
            description: ['', [Validators.required]],
            ingredient: [''],
            option: [''],
            unit: [''],
            instruction: ['']
        });
    }

}