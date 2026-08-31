/*
 * Shared fixture data for the generator tests.
 * These values mirror the baseline capture used to verify the Angular -> Vue
 * port, so the snapshots encode the behaviour the Angular app had.
 */

import type { ASBasicInfo } from './makemetainfo';

export const base: ASBasicInfo = {
    cid: 'com.example.test_app',
    name: 'Test App',
    summary: 'A test application for checking things',
    metadataLicense: 'FSFAP',
    projectLicense: 'GPL-3.0-or-later',
    description: 'First paragraph with `code` and *emphasis*.\n\nSecond paragraph.\nSame para, newline folded.',
    homepage: 'https://example.com/testapp',
};

/** Exercises the XML escaping path. */
export const nasty: ASBasicInfo = {
    ...base,
    name: 'Ampersand & <Angle> "Quote" \'Apos\'',
    summary: 'a < b && c > d',
    description: 'Escape & this <tag> too.',
};
