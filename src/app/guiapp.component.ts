import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormGroup,  FormBuilder, FormControl,
         Validators, ValidatorFn, AbstractControl } from '@angular/forms';

import { guessComponentId, componentIdValid,
         isAcceptableUrl, arrayAddIfNotEmpty } from './utils';
import { makeMetainfoGuiApp, BasicASInfo, GUIAppInfo } from './makemetainfo';
import { makeMesonValidateSnippet } from './makeauxdata';

@Component({
    selector: 'app-guiapp',
    templateUrl: './guiapp.component.html'
})

export class GUIAppComponent implements OnInit
{
    cptForm: FormGroup;
    finalCptId: string;

    metadataLicenses: any;
    spdxLicenses: any;

    dataGenerated: boolean;
    dataError: boolean;
    dataErrorMessage: string;

    dataMetainfo: string;
    dataMesonValidate: string;

    constructor(private fb: FormBuilder,
                private http: HttpClient)
    {
        this.dataGenerated = false;
        this.dataError = false;
    }

    ngOnInit()
    {
        this.metadataLicenses = this.http.get('assets/metadata-licenses.json');
        this.spdxLicenses = this.http.get('assets/spdx-licenses.json');
        this.createForm();
    };

    componentIdValidator(): ValidatorFn {
        return (control: AbstractControl): {[key: string]: any} | null => {
            const res = componentIdValid(control.value);
            return res.valid ? null : {'forbiddenId': {value: res.message}};
        };
    }

    urlValidator(): ValidatorFn {
        return (control: AbstractControl): {[key: string]: any} | null => {
            return isAcceptableUrl(control.value) ? null : {'invalidUrl': {value: control.value}};
        };
    }

    createForm()
    {
        this.cptForm = this.fb.group({
            appName: ['', Validators.required ],
            appSummary: ['', Validators.required ],
            appHomepage: ['', [ Validators.required, this.urlValidator() ] ],
            appDescription: ['', Validators.required ],
            cptId: ['', [ Validators.required, Validators.minLength(4), this.componentIdValidator() ]],
            metadataLicense: ['', Validators.required ],
            simpleProjectLicense: new FormControl({value: '', disabled: false}),
            complexProjectLicense: new FormControl({value: '', disabled: true}),

            primaryScreenshot: ['', this.urlValidator() ],
            extraScreenshot1: ['', this.urlValidator() ],
            extraScreenshot2: ['', this.urlValidator() ],

            cbMesonValidate: ['']
        });

        this.cptForm.get('appName').valueChanges.subscribe(value => {
          if (!this.cptId.dirty)
              this.cptId.setValue(guessComponentId(this.appHomepage.value, this.appName.value));
        });

        this.cptForm.get('appHomepage').valueChanges.subscribe(value => {
          if (!this.cptId.dirty)
              this.cptId.setValue(guessComponentId(this.appHomepage.value, this.appName.value));
        });
    }

    licenseModeSimpleChange(evt)
    {
        if (evt.target.checked) {
            this.complexProjectLicense.disable();
            this.simpleProjectLicense.enable();
        } else {
            this.complexProjectLicense.enable();
            this.simpleProjectLicense.disable();
        }
    }

    licenseModeSPDXExprChange(evt)
    {
        if (evt.target.checked) {
            this.complexProjectLicense.enable();
            this.simpleProjectLicense.disable();
        } else {
            this.complexProjectLicense.disable();
            this.simpleProjectLicense.enable();
        }
    }

    get appName() { return this.cptForm.get('appName'); }
    get appSummary() { return this.cptForm.get('appSummary'); }

    get appHomepage() { return this.cptForm.get('appHomepage'); }

    get appDescription() { return this.cptForm.get('appDescription'); }

    get cptId() { return this.cptForm.get('cptId'); }

    get metadataLicense() { return this.cptForm.get('metadataLicense'); }
    get simpleProjectLicense() { return this.cptForm.get('simpleProjectLicense'); }
    get complexProjectLicense() { return this.cptForm.get('complexProjectLicense'); }

    get primaryScreenshot() { return this.cptForm.get('primaryScreenshot'); }
    get extraScreenshot1() { return this.cptForm.get('extraScreenshot1'); }
    get extraScreenshot2() { return this.cptForm.get('extraScreenshot2'); }

    validationError(message: string)
    {
        this.dataError = true;
        this.dataErrorMessage = message;
    }

    validateField(field: any, name: string, emptyOkay: boolean = false): boolean
    {
        field.markAsTouched();

        if (!emptyOkay) {
            if (!field.value.trim()) {
                this.validationError(`No value set for ${name}!`);
                return false;
            }
        }

        if (!field.valid) {
            this.validationError(`Value for ${name} is invalid!`);
            return false;
        }
        return true;
    }

    resetGeneratedData()
    {
        this.dataGenerated = false;
        this.dataMetainfo = null;
        this.dataMesonValidate = null;
    }

    generate()
    {
        this.resetGeneratedData();

        if (!this.validateField(this.appName, 'application name'))
            return;
        if (!this.validateField(this.appSummary, 'application summary'))
            return;
        if (!this.validateField(this.appHomepage, 'homepage'))
            return;
        if (!this.validateField(this.appDescription, 'long description'))
            return;
        if (!this.validateField(this.cptId, 'component ID'))
            return;
        if (!this.validateField(this.metadataLicense, 'metadata license'))
            return;

        let pLicense;
        if (this.simpleProjectLicense.enabled)
            pLicense = this.simpleProjectLicense.value;
        else
            pLicense = this.complexProjectLicense.value;
        if (!pLicense) {
            this.validationError('No project license has been selected.');
            return;
        }

        if (!this.validateField(this.primaryScreenshot, 'primary screenshot', true))
            return;
        if (!this.validateField(this.extraScreenshot1, 'additional screenshot 1', true))
            return;
        if (!this.validateField(this.extraScreenshot2, 'additional screenshot 2', true))
            return;

        // all validity checks have passed at this point
        this.dataError = false;
        this.finalCptId = this.cptId.value;

        let baseInfo: BasicASInfo = {
            cid: this.cptId.value,
            name: this.appName.value,
            summary: this.appSummary.value,
            metadataLicense: this.metadataLicense.value,
            projectLicense: pLicense,
            description: this.appDescription.value
        };

        let appInfo: GUIAppInfo = new GUIAppInfo();
        arrayAddIfNotEmpty(appInfo.scrImages, this.primaryScreenshot.value);
        arrayAddIfNotEmpty(appInfo.scrImages, this.extraScreenshot1.value);
        arrayAddIfNotEmpty(appInfo.scrImages, this.extraScreenshot2.value);

        this.dataGenerated = true;
        this.dataMetainfo = makeMetainfoGuiApp(baseInfo, appInfo);

        if (this.cptForm.value.cbMesonValidate)
            this.dataMesonValidate = makeMesonValidateSnippet(baseInfo);
    }
}
