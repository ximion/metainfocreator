/*
 * Copyright (C) 2020-2021 Matthias Klumpp <matthias@tenstral.net>
 *
 * SPDX-License-Identifier: LGPL-3.0+
 */

import { Component, OnInit, Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormGroup,  FormBuilder, FormControl, Validators } from '@angular/forms';

import { ClipboardService } from './clipboard.service';
import { componentIdValidator, urlValidator, noPathOrSpaceValidator } from './formvalidators';
import { guessComponentId, filterCategoriesByPrimary } from './utils';
import { makeMetainfoService, ASBasicInfo, ServiceInfo } from './makemetainfo';
import { makeMesonValidateSnippet } from './makemeson';
import { makeDesktopEntryData } from './makeauxdata';

@Component({
    selector: 'app-service',
    templateUrl: './service.component.html'
})

@Injectable()
export class ServiceComponent implements OnInit {
    cptForm: FormGroup;
    finalCptId: string;

    metadataLicenses: any;
    spdxLicenses: any;

    categoriesPrimary: any;
    categoriesSecondaryFiltered: any;
    categoriesSecondaryAll: any;

    dataGenerated: boolean;
    dataError: boolean;
    dataErrorMessage: string;

    dataMetainfo: string;
    dataMesonValidate: string;

    constructor(private fb: FormBuilder,
                private http: HttpClient,
                public clipboard: ClipboardService) {
        this.dataGenerated = false;
        this.dataError = false;
        this.categoriesSecondaryFiltered = [];
    }

    ngOnInit() {
        this.metadataLicenses = this.http.get('assets/metadata-licenses.json');
        this.spdxLicenses = this.http.get('assets/spdx-licenses.json');

        this.http.get('assets/categories-primary.json').subscribe((data) => {
            this.categoriesPrimary = data;
        });

        this.http.get('assets/categories-secondary.json').subscribe((data) => {
            this.categoriesSecondaryAll = data;
        });

        this.createForm();
    }

    createForm() {
        this.cptForm = this.fb.group({
            cptName: ['', Validators.required ],
            cptSummary: ['', Validators.required ],
            cptHomepage: ['', [ Validators.required, urlValidator() ] ],
            cptDescription: ['', Validators.required ],
            cptId: ['', [ Validators.required, Validators.minLength(4), componentIdValidator() ]],
            metadataLicense: ['', Validators.required ],
            rbLicenseMode: [''],
            simpleProjectLicense: new FormControl({value: '', disabled: false}),
            complexProjectLicense: new FormControl({value: '', disabled: true}),

            primaryCategory: ['', Validators.required ],
            secondaryCategory: [''],

            cptIcon: ['', [ Validators.required, noPathOrSpaceValidator() ] ],
            serviceName: ['', [ Validators.required, noPathOrSpaceValidator() ] ],

            cbMesonSnippets: ['']
        });

        // some defaults
        this.rbLicenseMode.setValue('simple');

        this.cptName.valueChanges.subscribe(value => {
            if (!this.cptId.dirty)
                this.cptId.setValue(guessComponentId(this.cptHomepage.value, this.cptName.value));
            if (!this.cptIcon.dirty)
                this.cptIcon.setValue(value.replace(/ /g, '').trim().toLowerCase());
        });

        this.cptHomepage.valueChanges.subscribe(value => {
            if (!this.cptId.dirty)
                this.cptId.setValue(guessComponentId(this.cptHomepage.value, this.cptName.value));
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

    get cptName() { return this.cptForm.get('cptName'); }
    get cptSummary() { return this.cptForm.get('cptSummary'); }

    get cptHomepage() { return this.cptForm.get('cptHomepage'); }

    get cptDescription() { return this.cptForm.get('cptDescription'); }

    get cptId() { return this.cptForm.get('cptId'); }

    get metadataLicense() { return this.cptForm.get('metadataLicense'); }
    get rbLicenseMode() { return this.cptForm.get('rbLicenseMode'); }
    get simpleProjectLicense() { return this.cptForm.get('simpleProjectLicense'); }
    get complexProjectLicense() { return this.cptForm.get('complexProjectLicense'); }

    get primaryCategory() { return this.cptForm.get('primaryCategory'); }
    get secondaryCategory() { return this.cptForm.get('secondaryCategory'); }

    get cptIcon() { return this.cptForm.get('cptIcon'); }
    get serviceName() { return this.cptForm.get('serviceName'); }


    validationError(message: string) {
        this.dataError = true;
        this.dataErrorMessage = message;
    }

    validateField(field: any, name: string, emptyOkay: boolean = false): boolean {
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

        if (!this.validateField(this.cptName, 'service human-readable name'))
            return;
        if (!this.validateField(this.cptSummary, 'service summary'))
            return;
        if (!this.validateField(this.cptHomepage, 'homepage'))
            return;
        if (!this.validateField(this.cptDescription, 'long description'))
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

        if (!this.validateField(this.primaryCategory, 'primary service category'))
            return;
        if (!this.validateField(this.secondaryCategory, 'secondary service category', true))
            return;
        if (!this.validateField(this.cptIcon, 'service icon'))
            return;
        if (!this.validateField(this.serviceName, 'service launcher name'))
            return;

        const cptInfo: ServiceInfo = new ServiceInfo();
        cptInfo.categories = [this.primaryCategory.value];
        if (this.secondaryCategory.value)
            cptInfo.categories.push(this.secondaryCategory.value);
        cptInfo.iconName = this.cptIcon.value;
        cptInfo.serviceName = this.serviceName.value;

        // all validity checks have passed at this point
        this.dataError = false;
        this.finalCptId = this.cptId.value;

        const baseInfo: ASBasicInfo = {
            cid: this.cptId.value,
            name: this.cptName.value,
            summary: this.cptSummary.value,
            metadataLicense: this.metadataLicense.value,
            projectLicense: pLicense,
            description: this.cptDescription.value
        };

        this.dataGenerated = true;
        this.dataMetainfo = makeMetainfoService(baseInfo, cptInfo);

        // generate new meson snippets
        if (this.cptForm.value.cbMesonSnippets) {
            this.dataMesonValidate = makeMesonValidateSnippet(baseInfo);
        }
    }
}
