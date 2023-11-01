/*
 * Copyright (C) 2020-2021 Matthias Klumpp <matthias@tenstral.net>
 *
 * SPDX-License-Identifier: LGPL-3.0+
 */

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UntypedFormGroup,  UntypedFormBuilder, UntypedFormControl, AbstractControl, Validators } from '@angular/forms';

import { ClipboardService } from './clipboard.service';
import { componentIdValidator, urlValidator, desktopEntryValidator,
         noPathOrSpaceValidator } from './formvalidators';
import { guessComponentId, arrayAddIfNotEmpty, filterCategoriesByPrimary,
         LicenseInfo, PrimaryCategory, SecondaryCategory } from './utils';
import { makeMetainfoGuiApp, ASBasicInfo, GUIAppInfo } from './makemetainfo';
import { makeMesonValidateSnippet, makeMesonMItoDESnippet,
         makeMesonL10NSnippet } from './makemeson';
import { makeDesktopEntryData } from './makeauxdata';

@Component({
    selector: 'app-guiapp',
    templateUrl: './guiapp.component.html'
})

export class GUIAppComponent implements OnInit {
    cptForm: UntypedFormGroup;
    finalCptId: string;

    metadataLicenses: Observable<LicenseInfo[]>;
    spdxLicenses: Observable<LicenseInfo[]>;

    categoriesPrimary: PrimaryCategory[];
    categoriesSecondaryFiltered: SecondaryCategory[];
    categoriesSecondaryAll: SecondaryCategory[];

    createDesktopData: boolean;

    dataGenerated: boolean;
    dataError: boolean;
    dataErrorMessage: string;

    dataMetainfo: string;
    dataDesktopEntry: string;

    dataMesonValidate: string;
    dataMesonL10N: string;
    dataMesonMItoDE: string;

    constructor(private fb: UntypedFormBuilder,
                private http: HttpClient,
                public clipboard: ClipboardService) {
        this.dataGenerated = false;
        this.dataError = false;
        this.createDesktopData = false;
        this.categoriesSecondaryFiltered = [];
    }

    ngOnInit() {
        this.metadataLicenses = this.http.get<LicenseInfo[]>('assets/metadata-licenses.json');
        this.spdxLicenses = this.http.get<LicenseInfo[]>('assets/spdx-licenses.json');

        this.http.get<PrimaryCategory[]>('assets/categories-primary.json').subscribe((data) => {
            this.categoriesPrimary = data;
        });

        this.http.get<SecondaryCategory[]>('assets/categories-secondary.json').subscribe((data) => {
            this.categoriesSecondaryAll = data;
        });

        this.createForm();
    }

    createForm() {
        this.cptForm = this.fb.group({
            appName: ['', Validators.required ],
            appSummary: ['', Validators.required ],
            appHomepage: ['', [ Validators.required, urlValidator() ] ],
            cptBugtracker: ['', urlValidator()],
            cptDonation: ['', urlValidator()],
            cptCode: ['', urlValidator()],
            appDescription: ['', Validators.required ],
            cptId: ['', [ Validators.required, Validators.minLength(4), componentIdValidator() ]],
            metadataLicense: ['', Validators.required ],
            rbLicenseMode: [''],
            simpleProjectLicense: new UntypedFormControl({value: '', disabled: false}),
            complexProjectLicense: new UntypedFormControl({value: '', disabled: true}),

            primaryScreenshot: ['', urlValidator() ],
            extraScreenshot1: ['', urlValidator() ],
            extraScreenshot2: ['', urlValidator() ],

            rbLaunchableMode: [''],
            desktopEntryName: ['', [ Validators.required, desktopEntryValidator() ] ],

            primaryCategory: ['', Validators.required ],
            secondaryCategory: ['', Validators.required ],

            appIcon: ['', [ Validators.required, noPathOrSpaceValidator() ] ],
            exeName: ['', [ Validators.required, noPathOrSpaceValidator() ] ],

            cbInputMouseKeys: [''],
            cbInputTouch: [''],
            cbInputGamepad: [''],
            cbInputTablet: [''],

            cbMinSurfaceSize: [''],
            minSurfaceSize: ['', [ Validators.min(10), Validators.max(8192), Validators.pattern('^[0-9]*$') ] ],

            cbMesonSnippets: [''],
        });

        // some defaults
        this.rbLicenseMode.setValue('simple');
        this.rbLaunchableMode.setValue('provided');
        this.cbInputMouseKeys.setValue('true');
        this.cbInputMouseKeys.disable();

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
            if (value !== 'provided')
                this.createDesktopData = true;
        });
    }

    licenseModeChange(evt) {
        if (evt.target.value === 'simple') {
            this.complexProjectLicense.disable();
            this.simpleProjectLicense.enable();
        } else {
            this.complexProjectLicense.enable();
            this.simpleProjectLicense.disable();
        }
    }

    inputControlChange(evt) {
        if (!this.cbInputTouch.value && !this.cbInputGamepad.value && !this.cbInputTablet.value) {
            this.cbInputMouseKeys.disable();
            this.cbInputMouseKeys.setValue('true');
        } else {
            this.cbInputMouseKeys.enable();
        }
    }

    primaryCategoryChange(evt) {
        this.secondaryCategory.setValue('');
        this.categoriesSecondaryFiltered = filterCategoriesByPrimary(this.categoriesSecondaryAll,
                                                                     this.primaryCategory.value);
    }

    get appName() { return this.cptForm.get('appName'); }
    get appSummary() { return this.cptForm.get('appSummary'); }

    get appHomepage() { return this.cptForm.get('appHomepage'); }
    get cptBugtracker() { return this.cptForm.get('cptBugtracker'); }
    get cptDonation() { return this.cptForm.get('cptDonation'); }
    get cptCode() { return this.cptForm.get('cptCode'); }

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

    get cbInputMouseKeys() { return this.cptForm.get('cbInputMouseKeys'); }
    get cbInputTouch() { return this.cptForm.get('cbInputTouch'); }
    get cbInputGamepad() { return this.cptForm.get('cbInputGamepad'); }
    get cbInputTablet() { return this.cptForm.get('cbInputTablet'); }

    get cbMinSurfaceSize() { return this.cptForm.get('cbMinSurfaceSize'); }
    get minSurfaceSize() { return this.cptForm.get('minSurfaceSize'); }

    validationError(message: string) {
        this.dataError = true;
        this.dataErrorMessage = message;
    }

    validateField(field: AbstractControl, name: string, emptyOkay = false): boolean {
        field.markAsTouched();

        if (!emptyOkay) {
            if (!field.value || (typeof field.value === 'string' && !field.value.trim())) {
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

    resetGeneratedData() {
        this.dataGenerated = false;
        this.dataMetainfo = null;
        this.dataDesktopEntry = null;

        this.dataMesonValidate = null;
        this.dataMesonL10N = null;
        this.dataMesonMItoDE = null;
    }

    generate() {
        this.resetGeneratedData();

        if (!this.validateField(this.appName, 'application name'))
            return;
        if (!this.validateField(this.appSummary, 'application summary'))
            return;
        if (!this.validateField(this.appHomepage, 'homepage'))
            return;
        if (!this.validateField(this.cptBugtracker, 'bugtracker', true))
            return;
        if (!this.validateField(this.cptDonation, 'donation', true))
            return;
        if (!this.validateField(this.cptCode, 'code', true))
            return;
        if (!this.validateField(this.appDescription, 'long description'))
            return;
        if (!this.validateField(this.cptId, 'component ID'))
            return;
        if (!this.validateField(this.metadataLicense, 'metadata license'))
            return;

        let pLicense;
        if (this.rbLicenseMode.value === 'simple')
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

        const appInfo: GUIAppInfo = new GUIAppInfo();

        const launchableMode = this.rbLaunchableMode.value;
        if (launchableMode === 'provided') {
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

        // input controls
        appInfo.inputPointKeyboard = this.cbInputMouseKeys.value;
        appInfo.inputTouch = this.cbInputTouch.value;
        appInfo.inputGamepad = this.cbInputGamepad.value;
        appInfo.inputTablet = this.cbInputTablet.value;

        // surface size
        if (this.cbMinSurfaceSize.value) {
            if (!this.validateField(this.minSurfaceSize, 'minimum surface size'))
                return;
            appInfo.minDisplaySize = this.minSurfaceSize.value;
        }

        // all validity checks have passed at this point
        this.dataError = false;
        this.finalCptId = this.cptId.value;

        const baseInfo: ASBasicInfo = {
            cid: this.cptId.value,
            name: this.appName.value,
            summary: this.appSummary.value,
            metadataLicense: this.metadataLicense.value,
            projectLicense: pLicense,
            description: this.appDescription.value,
            homepage: this.appHomepage.value,
            bugtracker: this.cptBugtracker.value,
            donation: this.cptDonation.value,
            code: this.cptCode.value,
        };

        arrayAddIfNotEmpty(appInfo.scrImages, this.primaryScreenshot.value);
        arrayAddIfNotEmpty(appInfo.scrImages, this.extraScreenshot1.value);
        arrayAddIfNotEmpty(appInfo.scrImages, this.extraScreenshot2.value);

        const miSelfContained: boolean = (launchableMode === 'generate-from-mi');
        if (launchableMode === 'generate') {
            this.dataDesktopEntry = makeDesktopEntryData(baseInfo, appInfo);
        }

        this.dataGenerated = true;
        this.dataMetainfo = makeMetainfoGuiApp(baseInfo, appInfo, miSelfContained);

        // generate new meson snippets
        if (this.cptForm.value.cbMesonSnippets) {
            this.dataMesonValidate = makeMesonValidateSnippet(baseInfo);
            this.dataMesonL10N = makeMesonL10NSnippet(baseInfo);
            if (launchableMode === 'generate-from-mi')
                this.dataMesonMItoDE = makeMesonMItoDESnippet(baseInfo);
        }
    }
}
