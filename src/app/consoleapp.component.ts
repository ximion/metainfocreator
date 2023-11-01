/*
 * Copyright (C) 2020-2021 Matthias Klumpp <matthias@tenstral.net>
 *
 * SPDX-License-Identifier: LGPL-3.0+
 */

import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UntypedFormGroup,  UntypedFormBuilder, UntypedFormControl, AbstractControl, Validators } from '@angular/forms';

import { ClipboardService } from './clipboard.service';
import { componentIdValidator, urlValidator, noPathOrSpaceValidator } from './formvalidators';
import { guessComponentId, filterCategoriesByPrimary,
         LicenseInfo, PrimaryCategory, SecondaryCategory } from './utils';

import { makeMetainfoConsoleApp, ASBasicInfo, ConsoleAppInfo } from './makemetainfo';
import { makeMesonValidateSnippet } from './makemeson';

@Component({
    selector: 'app-consoleapp',
    templateUrl: './consoleapp.component.html'
})

export class ConsoleAppComponent implements OnInit {
    cptForm: UntypedFormGroup;
    finalCptId: string;

    metadataLicenses: Observable<LicenseInfo[]>;
    spdxLicenses: Observable<LicenseInfo[]>;

    categoriesPrimary: PrimaryCategory[];
    categoriesSecondaryFiltered: SecondaryCategory[];
    categoriesSecondaryAll: SecondaryCategory[];

    dataGenerated: boolean;
    dataError: boolean;
    dataErrorMessage: string;

    dataMetainfo: string;
    dataMesonValidate: string;

    constructor(private fb: UntypedFormBuilder,
                private http: HttpClient,
                public clipboard: ClipboardService) {
        this.dataGenerated = false;
        this.dataError = false;
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

            primaryCategory: ['', Validators.required ],
            secondaryCategory: ['', Validators.required ],

            appIcon: ['', [ Validators.required, noPathOrSpaceValidator() ] ],
            exeName: ['', [ Validators.required, noPathOrSpaceValidator() ] ],

            cbMesonSnippets: ['']
        });

        // some defaults
        this.rbLicenseMode.setValue('simple');

        this.appName.valueChanges.subscribe(value => {
            if (!this.cptId.dirty)
                this.cptId.setValue(guessComponentId(this.appHomepage.value, this.appName.value));
            if (!this.appIcon.dirty)
                this.appIcon.setValue(value.replace(/ /g, '').trim().toLowerCase());
        });

        this.appHomepage.valueChanges.subscribe(() => {
            if (!this.cptId.dirty)
                this.cptId.setValue(guessComponentId(this.appHomepage.value, this.appName.value));
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

    get primaryCategory() { return this.cptForm.get('primaryCategory'); }
    get secondaryCategory() { return this.cptForm.get('secondaryCategory'); }

    get appIcon() { return this.cptForm.get('appIcon'); }
    get exeName() { return this.cptForm.get('exeName'); }


    validationError(message: string) {
        this.dataError = true;
        this.dataErrorMessage = message;
    }

    validateField(field: AbstractControl, name: string, emptyOkay = false): boolean {
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

    resetGeneratedData() {
        this.dataGenerated = false;
        this.dataMetainfo = null;
        this.dataMesonValidate = null;
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

        if (!this.validateField(this.primaryCategory, 'primary application category'))
            return;
        if (!this.validateField(this.secondaryCategory, 'secondary application category'))
            return;
        if (!this.validateField(this.appIcon, 'application icon'))
            return;
        if (!this.validateField(this.exeName, 'executable name'))
            return;

        const appInfo: ConsoleAppInfo = new ConsoleAppInfo();
        appInfo.categories = [this.primaryCategory.value, this.secondaryCategory.value];
        appInfo.iconName = this.appIcon.value;
        appInfo.binary = this.exeName.value;

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

        this.dataGenerated = true;
        this.dataMetainfo = makeMetainfoConsoleApp(baseInfo, appInfo);

        // generate new meson snippets
        if (this.cptForm.value.cbMesonSnippets) {
            this.dataMesonValidate = makeMesonValidateSnippet(baseInfo);
        }
    }
}
