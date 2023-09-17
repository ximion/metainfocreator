/*
 * Copyright (C) 2020-2021 Matthias Klumpp <matthias@tenstral.net>
 *
 * SPDX-License-Identifier: LGPL-3.0+
 */

import { Component, OnInit, Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { UntypedFormGroup,  UntypedFormBuilder, UntypedFormControl, Validators } from '@angular/forms';

import { ClipboardService } from './clipboard.service';
import { componentIdValidator, urlValidator, noPathOrSpaceValidator } from './formvalidators';
import { guessComponentId } from './utils';
import { makeMetainfoAddon, ASBasicInfo, AddonInfo } from './makemetainfo';
import { makeMesonValidateSnippet } from './makemeson';
import { makeDesktopEntryData } from './makeauxdata';

@Component({
    selector: 'app-addon',
    templateUrl: './addon.component.html'
})

@Injectable()
export class AddonComponent implements OnInit {
    cptForm: UntypedFormGroup;
    finalCptId: string;

    metadataLicenses: any;
    spdxLicenses: any;

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
    }

    ngOnInit() {
        this.metadataLicenses = this.http.get('assets/metadata-licenses.json');
        this.spdxLicenses = this.http.get('assets/spdx-licenses.json');

        this.createForm();
    }

    createForm() {
        this.cptForm = this.fb.group({
            cptName: ['', Validators.required ],
            cptSummary: ['', Validators.required ],
            cptHomepage: ['', [ Validators.required, urlValidator() ] ],
            cptDescription: ['', Validators.required ],
            cptId: ['', [ Validators.required, Validators.minLength(4), componentIdValidator() ]],
            extendsCptId: ['', [ Validators.required, Validators.minLength(4), componentIdValidator() ]],

            metadataLicense: ['', Validators.required ],
            rbLicenseMode: [''],
            simpleProjectLicense: new UntypedFormControl({value: '', disabled: false}),
            complexProjectLicense: new UntypedFormControl({value: '', disabled: true}),

            cptIcon: ['', noPathOrSpaceValidator() ],

            cbMesonSnippets: ['']
        });

        // some defaults
        this.rbLicenseMode.setValue('simple');

        this.cptName.valueChanges.subscribe(value => {
            if (!this.cptId.dirty)
                this.cptId.setValue(guessComponentId(this.cptHomepage.value, this.cptName.value));
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

    get cptName() { return this.cptForm.get('cptName'); }
    get cptSummary() { return this.cptForm.get('cptSummary'); }

    get cptHomepage() { return this.cptForm.get('cptHomepage'); }

    get cptDescription() { return this.cptForm.get('cptDescription'); }

    get cptId() { return this.cptForm.get('cptId'); }
    get extendsCptId() { return this.cptForm.get('extendsCptId'); }

    get metadataLicense() { return this.cptForm.get('metadataLicense'); }
    get rbLicenseMode() { return this.cptForm.get('rbLicenseMode'); }
    get simpleProjectLicense() { return this.cptForm.get('simpleProjectLicense'); }
    get complexProjectLicense() { return this.cptForm.get('complexProjectLicense'); }

    get cptIcon() { return this.cptForm.get('cptIcon'); }

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

        if (!this.validateField(this.cptName, 'addon name'))
            return;
        if (!this.validateField(this.cptSummary, 'addon summary'))
            return;
        if (!this.validateField(this.cptHomepage, 'homepage'))
            return;
        if (!this.validateField(this.cptDescription, 'long description'))
            return;
        if (!this.validateField(this.cptId, 'component ID'))
            return;
        if (!this.validateField(this.extendsCptId, 'extended app component ID'))
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

        if (!this.validateField(this.cptIcon, 'addon icon', true))
            return;

        const addonInfo: AddonInfo = new AddonInfo();
        addonInfo.extends = [this.extendsCptId.value];
        addonInfo.iconName = this.cptIcon.value;

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
        this.dataMetainfo = makeMetainfoAddon(baseInfo, addonInfo);

        // generate new meson snippets
        if (this.cptForm.value.cbMesonSnippets) {
            this.dataMesonValidate = makeMesonValidateSnippet(baseInfo);
        }
    }
}
