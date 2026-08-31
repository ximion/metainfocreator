/*
 * Copyright (C) 2020-2021 Matthias Klumpp <matthias@tenstral.net>
 *
 * SPDX-License-Identifier: LGPL-3.0+
 */

import type { Directive, DirectiveBinding } from 'vue';

import hljs from 'highlight.js/lib/core';
import xml from 'highlight.js/lib/languages/xml';
import python from 'highlight.js/lib/languages/python';
import ini from 'highlight.js/lib/languages/ini';

/*
 * Meson is highlighted with the Python grammar, and
 * desktop-entry & TOML files with the INI grammar.
 * highlight.js ships no grammar for either of the real formats.
 */
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('meson', python);
hljs.registerLanguage('toml', ini);

export interface HighlightBinding {
    code: string;
    lang: 'xml' | 'meson' | 'toml';
}

function render(el: HTMLElement, binding: DirectiveBinding<HighlightBinding>) {
    const { code, lang } = binding.value;
    el.classList.add('hljs');
    el.innerHTML = code ? hljs.highlight(code, { language: lang }).value : '';
}

export const highlight: Directive<HTMLElement, HighlightBinding> = {
    mounted: render,
    updated: render,
};
