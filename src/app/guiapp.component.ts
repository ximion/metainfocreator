/*
 * Copyright (C) 2020 Matthias Klumpp <matthias@tenstral.net>
 *
 * SPDX-License-Identifier: LGPL-3.0+
 */

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormGroup,  FormBuilder, FormControl,
         Validators, ValidatorFn, AbstractControl } from '@angular/forms';

import { guessComponentId, componentIdValid, isAcceptableUrl,
         isDesktopFilename, isNoPath, arrayAddIfNotEmpty } from './utils';
import { makeMetainfoGuiApp, BasicASInfo, GUIAppInfo } from './makemetainfo';
import { makeMesonValidateSnippet, makeMesonMItoDESnippet,
         makeMesonL10NSnippet } from './makemeson';
import { makeDesktopEntryData } from './makeauxdata';

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

    categoriesPrimary: any;
    categoriesSecondary: any;

    createDesktopData: boolean;

    dataGenerated: boolean;
    dataError: boolean;
    dataErrorMessage: string;

    dataMetainfo: string;
    dataDesktopEntry: string;

    dataMesonValidate: string;
    dataMesonL10N: string;
    dataMesonMItoDE: string;

    constructor(private fb: FormBuilder,
                private http: HttpClient)
    {
        this.dataGenerated = false;
        this.dataError = false;
        this.createDesktopData = false;
    }

    ngOnInit()
    {
        this.metadataLicenses = this.http.get('assets/metadata-licenses.json');
        this.spdxLicenses = this.http.get('assets/spdx-licenses.json');

        this.categoriesPrimary = this.http.get('assets/categories-primary.json');
        this.categoriesSecondary = this.http.get('assets/categories-secondary.json');

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

    desktopEntryValidator(): ValidatorFn {
        return (control: AbstractControl): {[key: string]: any} | null => {
            return isDesktopFilename(control.value) ? null : {'invalidName': {value: control.value}};
        };
    }

    noPathValidator(): ValidatorFn {
        return (control: AbstractControl): {[key: string]: any} | null => {
            return isNoPath(control.value) ? null : {'invalidName': {value: control.value}};
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
            rbLicenseMode: [''],
            simpleProjectLicense: new FormControl({value: '', disabled: false}),
            complexProjectLicense: new FormControl({value: '', disabled: true}),

            primaryScreenshot: ['', this.urlValidator() ],
            extraScreenshot1: ['', this.urlValidator() ],
            extraScreenshot2: ['', this.urlValidator() ],

            rbLaunchableMode: [''],
            desktopEntryName: ['', [ Validators.required, this.desktopEntryValidator() ] ],

            primaryCategory: ['', Validators.required ],
            secondaryCategory: ['', Validators.required ],

            appIcon: ['', [ Validators.required, this.noPathValidator() ] ],
            exeName: ['', [ Validators.required, this.noPathValidator() ] ],

            cbMesonSnippets: ['']
        });

        // some defaults
        this.rbLicenseMode.setValue('simple');
        this.rbLaunchableMode.setValue('provided');

        this.appName.valueChanges.subscribe(value => {
            if (!this.cptId.dirty)
                this.cptId.setValue(guessComponentId(this.appHomepage.value, this.appName.value));
            if (!this.appIcon.dirty)
                this.appIcon.setValue(value.replace(/ /g, '').trim().toLowerCase());
        });

        this.appHomepage.valueChanges.subscribe(value => {
            if (!this.cptId.dirty)
                this.cptId.setValue(guessComponentId(this.appHomepage.value, this.appName.value));
        });

        this.rbLaunchableMode.valueChanges.subscribe(value => {
            // if the desktop-entry ID isn't provided, we have to request additional data
            this.createDesktopData = false;
            if (value != 'provided')
                this.createDesktopData = true;
        });
    }

    licenseModeChange(evt)
    {
        if (evt.target.value == 'simple') {
            this.complexProjectLicense.disable();
            this.simpleProjectLicense.enable();
        } else {
            this.complexProjectLicense.enable();
            this.simpleProjectLicense.disable();
        }
    }


    get appName() { return this.cptForm.get('appName'); }
    get appSummary() { return this.cptForm.get('appSummary'); }

    get appHomepage() { return this.cptForm.get('appHomepage'); }

    get appDescription() { return this.cptForm.get('appDescription'); }

    get cptId() { return this.cptForm.get('cptId'); }

    get metadataLicense() { return this.cptForm.get('metadataLicense'); }
    get rbLicenseMode() { return this.cptForm.get('rbLicenseMode'); }
    get simpleProjectLicense() { return this.cptForm.get('simpleProjectLicense'); }
    get complexProjectLicense() { return this.cptForm.get('complexProjectLicense'); }

    get primaryScreenshot() { return this.cptForm.get('primaryScreenshot'); }
    get extraScreenshot1() { return this.cptForm.get('extraScreenshot1'); }
    get extraScreenshot2() { return this.cptForm.get('extraScreenshot2'); }

    get rbLaunchableMode() { return this.cptForm.get('rbLaunchableMode'); }
    get desktopEntryName() { return this.cptForm.get('desktopEntryName'); }

    get primaryCategory() { return this.cptForm.get('primaryCategory'); }
    get secondaryCategory() { return this.cptForm.get('secondaryCategory'); }

    get appIcon() { return this.cptForm.get('appIcon'); }
    get exeName() { return this.cptForm.get('exeName'); }


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
        this.dataDesktopEntry = null;

        this.dataMesonValidate = null;
        this.dataMesonL10N = null;
        this.dataMesonMItoDE = null;
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
        if (this.rbLicenseMode.value == 'simple')
            pLicense = this.simpleProjectLicense.value;
        else
            pLicense = this.complexProjectLicense.value;
        pLicense = pLicense.trim();
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

        let appInfo: GUIAppInfo = new GUIAppInfo();

        let launchableMode = this.rbLaunchableMode.value;
        if (launchableMode == 'provided') {
            if (!this.validateField(this.desktopEntryName, 'desktop-entry filename'))
                return;
            appInfo.desktopEntryName = this.desktopEntryName.value;
        } else {
            // no desktop-entry filename was provided, so we need to check if a bunch more
            // data is present to build one

            if (!this.validateField(this.primaryCategory, 'primary application category'))
                return;
            if (!this.validateField(this.secondaryCategory, 'secondary application category'))
                return;
            if (!this.validateField(this.appIcon, 'application icon'))
                return;
            if (!this.validateField(this.exeName, 'executable name'))
                return;

            appInfo.categories = [this.primaryCategory.value, this.secondaryCategory.value];
            appInfo.iconName = this.appIcon.value;
            appInfo.binary = this.exeName.value;
        }

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

        arrayAddIfNotEmpty(appInfo.scrImages, this.primaryScreenshot.value);
        arrayAddIfNotEmpty(appInfo.scrImages, this.extraScreenshot1.value);
        arrayAddIfNotEmpty(appInfo.scrImages, this.extraScreenshot2.value);

        let miSelfContained: boolean = (launchableMode == 'generate-from-mi');
        if (launchableMode == 'generate') {
            this.dataDesktopEntry = makeDesktopEntryData(baseInfo, appInfo);
        }

        this.dataGenerated = true;
        this.dataMetainfo = makeMetainfoGuiApp(baseInfo, appInfo, miSelfContained);

        // generate new meson snippets
        if (this.cptForm.value.cbMesonSnippets) {
            this.dataMesonValidate = makeMesonValidateSnippet(baseInfo);
            this.dataMesonL10N = makeMesonL10NSnippet(baseInfo);
            if (launchableMode == 'generate-from-mi')
                this.dataMesonMItoDE = makeMesonMItoDESnippet(baseInfo);
        }
    }
}
