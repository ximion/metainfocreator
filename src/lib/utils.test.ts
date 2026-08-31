import { describe, it, expect } from 'vitest';

import {
    guessComponentId, componentIdValid, isAcceptableUrl, isDesktopFilename,
    isNoPath, arrayAddIfNotEmpty, filterCategoriesByPrimary,
    type SecondaryCategory,
} from './utils';

describe('guessComponentId', () => {
    it.each([
        ['https://example.com/testapp', 'Test App', 'com.example.test_app'],
        ['https://github.com/ximion/appstream', 'AppStream', 'io.github.ximion.appstream'],
        ['example.com', 'No Scheme', 'com.example.no_scheme'],
    ])('maps %s + %s', (homepage, name, expected) => {
        expect(guessComponentId(homepage, name)).toBe(expected);
    });

    /*
     * Known pre-existing quirk, pinned here so it cannot change silently:
     * a `www.` host reverses to `org.freedesktop.www`, and stripping "www"
     * leaves its separating dot behind. The resulting ID has an empty segment,
     * which componentIdValid() then rejects - so the guess offered to the user
     * is immediately flagged invalid. Fixing it is a behaviour change and is
     * deliberately out of scope for the port.
     */
    it('leaves an empty segment behind when stripping a www host', () => {
        expect(guessComponentId('https://www.freedesktop.org/software/appstream/', 'MetaInfo Creator'))
            .toBe('org.freedesktop..metainfo_creator');
    });

    it('returns an empty string without a homepage', () => {
        expect(guessComponentId('', 'Whatever')).toBe('');
    });

    it('replaces hyphens and colons with underscores', () => {
        expect(guessComponentId('https://example.com/x', 'Dash-Name')).toBe('com.example.dash_name');
        expect(guessComponentId('https://example.com/x', 'Colon:Name')).toBe('com.example.colon_name');
    });

    it('strips non-ASCII characters', () => {
        expect(guessComponentId('https://example.com/x', 'Ümlaut Äpp')).toBe('com.example.mlaut_pp');
    });

    it('strips XML-hostile characters', () => {
        expect(guessComponentId('https://example.com/x', 'Amp&<>"\'Chars')).toBe('com.example.ampchars');
    });
});

describe('componentIdValid', () => {
    it('accepts a well-formed rDNS id', () => {
        expect(componentIdValid('com.example.my_app')).toEqual({ valid: true, message: null });
    });

    it.each([
        ['', 'ID was empty'],
        ['com.example', 'ID does not follow the reverse-DNS scheme'],
        ['com..app', 'ID contains an empty segment.'],
        ['com.example.äpp', 'ID contains non-ASCII characters.'],
        ['com.example.my app', 'ID contains spaces.'],
        ['com.example.my-app', 'ID contains hyphens.'],
        ['com.example.my@app', 'ID contains invalid character: @'],
    ])('rejects %s', (cid, message) => {
        expect(componentIdValid(cid)).toEqual({ valid: false, message });
    });
});

describe('isAcceptableUrl', () => {
    it('accepts http and https, and treats empty as acceptable', () => {
        expect(isAcceptableUrl('https://x.y')).toBe(true);
        expect(isAcceptableUrl('http://x.y')).toBe(true);
        expect(isAcceptableUrl('')).toBe(true);
    });

    it('rejects other schemes and bare hosts', () => {
        expect(isAcceptableUrl('ftp://x.y')).toBe(false);
        expect(isAcceptableUrl('x.y')).toBe(false);
    });
});

describe('isDesktopFilename', () => {
    it('requires a .desktop suffix with no path or space', () => {
        expect(isDesktopFilename('a.desktop')).toBe(true);
        expect(isDesktopFilename('a b.desktop')).toBe(false);
        expect(isDesktopFilename('p/a.desktop')).toBe(false);
        expect(isDesktopFilename('a.txt')).toBe(false);
        expect(isDesktopFilename('')).toBe(false);
    });
});

describe('isNoPath', () => {
    it('treats empty as acceptable and rejects slashes', () => {
        expect(isNoPath('')).toBe(true);
        expect(isNoPath('name')).toBe(true);
        expect(isNoPath('a/b')).toBe(false);
    });
});

describe('arrayAddIfNotEmpty', () => {
    it('trims strings and skips empty values', () => {
        const arr: unknown[] = [];
        expect(arrayAddIfNotEmpty(arr, ' x ')).toBe(true);
        expect(arrayAddIfNotEmpty(arr, '')).toBe(false);
        expect(arrayAddIfNotEmpty(arr, '   ')).toBe(false);
        expect(arrayAddIfNotEmpty(arr, null)).toBe(false);
        expect(arrayAddIfNotEmpty(arr, 0)).toBe(false);
        expect(arrayAddIfNotEmpty(arr, 'y')).toBe(true);
        expect(arr).toEqual(['x', 'y']);
    });
});

describe('filterCategoriesByPrimary', () => {
    const cats = [
        { name: 'Building', desc: 'Building', parents: ['Development'] },
        { name: 'Debugger', desc: 'Debugger', parents: ['Development'] },
        { name: 'Clock', desc: 'Clock', parents: ['Utility'] },
        { name: 'NoParents', desc: 'NoParents', parents: [] },
        { name: 'NullParents', desc: 'NullParents' } as SecondaryCategory,
    ];

    it('keeps parentless categories plus those naming the primary', () => {
        expect(filterCategoriesByPrimary(cats, 'Development').map((c) => c.name))
            .toEqual(['Building', 'Debugger', 'NoParents', 'NullParents']);
        expect(filterCategoriesByPrimary(cats, 'Utility').map((c) => c.name))
            .toEqual(['Clock', 'NoParents', 'NullParents']);
        expect(filterCategoriesByPrimary(cats, 'Nothing').map((c) => c.name))
            .toEqual(['NoParents', 'NullParents']);
    });
});
