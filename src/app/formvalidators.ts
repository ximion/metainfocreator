/*
 * Copyright (C) 2020 Matthias Klumpp <matthias@tenstral.net>
 *
 * SPDX-License-Identifier: LGPL-3.0+
 */

import { ValidatorFn, AbstractControl } from '@angular/forms';
import { componentIdValid, isAcceptableUrl, isDesktopFilename, isNoPath } from './utils';

export function componentIdValidator(): ValidatorFn
{
    return (control: AbstractControl): {[key: string]: any} | null => {
        const res = componentIdValid(control.value);
        return res.valid ? null : {'forbiddenId': {value: res.message}};
    };
}

export function urlValidator(): ValidatorFn
{
    return (control: AbstractControl): {[key: string]: any} | null => {
        return isAcceptableUrl(control.value) ? null : {'invalidUrl': {value: control.value}};
    };
}

export function desktopEntryValidator(): ValidatorFn
{
    return (control: AbstractControl): {[key: string]: any} | null => {
        return isDesktopFilename(control.value) ? null : {'invalidName': {value: control.value}};
    };
}

export function noPathValidator(): ValidatorFn
{
    return (control: AbstractControl): {[key: string]: any} | null => {
        return isNoPath(control.value) ? null : {'invalidName': {value: control.value}};
    };
}

export function noSpaceValidator(): ValidatorFn
{
    return (control: AbstractControl): {[key: string]: any} | null => {
        if (!control.value)
            return null;
        return control.value.includes(' ') ? {'invalidName': {value: control.value}} : null;
    };
}

export function noPathOrSpaceValidator(): ValidatorFn
{
    return (control: AbstractControl): {[key: string]: any} | null => {
        if (!control.value)
            return null;
        return (isNoPath(control.value) && !control.value.includes(' '))? null : {'invalidName': {value: control.value}};
    };
}
