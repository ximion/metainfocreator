/*
 * Copyright (C) 2020-2021 Matthias Klumpp <matthias@tenstral.net>
 *
 * SPDX-License-Identifier: LGPL-3.0+
 */

/** Copy text to the clipboard. */
export function copyText(text: string): void {
    void navigator.clipboard?.writeText(text).catch(() => {
        /* failures are not surfaced to the user. */
    });
}
