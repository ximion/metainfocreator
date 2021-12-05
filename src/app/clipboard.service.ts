/*
 * Copyright (C) 2020-2021 Matthias Klumpp <matthias@tenstral.net>
 *
 * SPDX-License-Identifier: LGPL-3.0+
 */

import { Injectable } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';

@Injectable()
export class ClipboardService{
    constructor(private clipboard: Clipboard) {}

    copyText(text: string) {
        this.clipboard.copy(text);
    }
}
