/*
 * Copyright (C) 2020-2021 Matthias Klumpp <matthias@tenstral.net>
 *
 * SPDX-License-Identifier: LGPL-3.0+
 */

import { componentIdValid, isAcceptableUrl, isDesktopFilename, isNoPath } from '../lib/utils';
import type { Validator } from './useForm';

/*
 * The error keys below (required, minlength, min, max, pattern, forbiddenId,
 * invalidUrl, invalidName) are the same ones Angular's Validators produced.
 * Templates branch on them by name, so they must not be renamed.
 */

function isEmpty(v: unknown): boolean {
    return v === null || v === undefined || v === '';
}

export function required(): Validator {
    return (v) => (isEmpty(v) ? { required: {} } : null);
}

/* The length/range/pattern validators all skip empty values, exactly as Angular
   does - a field that is not `required` must show no hint while it is blank. */

export function minLength(n: number): Validator {
    return (v) => (isEmpty(v) || String(v).length >= n ? null : { minlength: { value: String(n) } });
}

export function min(n: number): Validator {
    return (v) => (isEmpty(v) || !(parseFloat(String(v)) < n) ? null : { min: { value: String(n) } });
}

export function max(n: number): Validator {
    return (v) => (isEmpty(v) || !(parseFloat(String(v)) > n) ? null : { max: { value: String(n) } });
}

export function pattern(re: RegExp): Validator {
    return (v) => (isEmpty(v) || re.test(String(v)) ? null : { pattern: {} });
}

/* Application-specific validators. These delegate to the pure predicates in
   lib/utils.ts, which are shared with the generator code and unit-tested. */

export function componentId(): Validator {
    return (v) => {
        const res = componentIdValid(String(v ?? ''));
        return res.valid ? null : { forbiddenId: { value: res.message } };
    };
}

export function url(): Validator {
    return (v) => (isAcceptableUrl(String(v ?? '')) ? null : { invalidUrl: { value: String(v ?? '') } });
}

export function desktopEntry(): Validator {
    return (v) => (isDesktopFilename(String(v ?? '')) ? null : { invalidName: { value: String(v ?? '') } });
}

export function noPathOrSpace(): Validator {
    return (v) => {
        const s = String(v ?? '');
        if (!s)
            return null;
        return isNoPath(s) && !s.includes(' ') ? null : { invalidName: { value: s } };
    };
}
