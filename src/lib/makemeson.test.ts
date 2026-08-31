import { describe, it, expect } from 'vitest';

import { makeMesonValidateSnippet, makeMesonMItoDESnippet, makeMesonL10NSnippet } from './makemeson';
import { base } from './fixtures';

describe('meson snippets', () => {
    it('builds the validation testcase', () => {
        expect(makeMesonValidateSnippet(base)).toMatchSnapshot();
    });

    it('builds the metainfo-to-desktop-entry snippet', () => {
        expect(makeMesonMItoDESnippet(base)).toMatchSnapshot();
    });

    it('builds the localization snippet', () => {
        expect(makeMesonL10NSnippet(base)).toMatchSnapshot();
    });
});
