/*
 * Copyright (C) 2020-2021 Matthias Klumpp <matthias@tenstral.net>
 *
 * SPDX-License-Identifier: LGPL-3.0+
 */

import type { Directive, DirectiveBinding } from 'vue';
import type { HLJSApi } from 'highlight.js';

export interface HighlightBinding {
    code: string;
    lang: 'xml' | 'meson' | 'toml';
}

/*
 * Nothing is highlighted until the user has generated a file, so the
 * highlighter and its grammars are fetched on demand instead of riding along in
 * the initial bundle. The promise is kept so the work happens only once.
 */
let engine: Promise<HLJSApi> | null = null;

function highlighter(): Promise<HLJSApi> {
    if (!engine) {
        engine = (async () => {
            const [core, xml, python, ini] = await Promise.all([
                import('highlight.js/lib/core'),
                import('highlight.js/lib/languages/xml'),
                import('highlight.js/lib/languages/python'),
                import('highlight.js/lib/languages/ini'),
            ]);

            const hljs = core.default;
            hljs.registerLanguage('xml', xml.default);
            // highlight.js has no grammar for Meson or for desktop-entry files,
            // so they borrow the closest ones that exist.
            hljs.registerLanguage('meson', python.default);
            hljs.registerLanguage('toml', ini.default);
            return hljs;
        })();
    }
    return engine;
}

/** What each element is currently meant to show, so that a slow load cannot
 *  overwrite a newer value once it finally arrives. */
const wanted = new WeakMap<HTMLElement, string>();

async function render(el: HTMLElement, binding: DirectiveBinding<HighlightBinding>) {
    const { code, lang } = binding.value;

    el.classList.add('hljs');
    wanted.set(el, code);

    if (!code) {
        el.textContent = '';
        return;
    }

    // show the plain text straight away, then colour it in once we can
    el.textContent = code;

    const hljs = await highlighter();
    if (wanted.get(el) !== code)
        return;

    el.innerHTML = hljs.highlight(code, { language: lang }).value;
}

export const highlight: Directive<HTMLElement, HighlightBinding> = {
    mounted: render,
    updated: render,
};
