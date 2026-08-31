import { describe, it, expect } from 'vitest';

import { makeDesktopEntryData } from './makeauxdata';
import { GUIAppInfo } from './makemetainfo';
import { base, nasty } from './fixtures';

describe('makeDesktopEntryData', () => {
    const info = new GUIAppInfo();
    info.categories = ['Utility', 'Building'];
    info.iconName = 'testapp';
    info.binary = 'testapp';

    it('builds a desktop entry', () => {
        expect(makeDesktopEntryData(base, info)).toMatchSnapshot();
    });

    it('passes metacharacters through unescaped, as desktop entries are not XML', () => {
        expect(makeDesktopEntryData(nasty, info)).toMatchSnapshot();
    });
});
