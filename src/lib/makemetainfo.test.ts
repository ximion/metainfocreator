import { describe, it, expect } from 'vitest';

import {
    makeMetainfoGuiApp, makeMetainfoConsoleApp, makeMetainfoAddon, makeMetainfoService,
    GUIAppInfo, ConsoleAppInfo, AddonInfo, ServiceInfo,
} from './makemetainfo';
import { base, nasty } from './fixtures';

/*
 * These are raw-string snapshots on purpose. The generated files contain blank
 * lines and other whitespace artifacts from the templates and prettyXml; people
 * commit the output verbatim, so normalising it here would let that drift
 * unnoticed and silently reshape every generated file in the wild.
 */

describe('makeMetainfoGuiApp', () => {
    it('uses a provided desktop-entry name', () => {
        const info = new GUIAppInfo();
        info.desktopEntryName = 'com.example.test_app.desktop';
        info.scrImages = ['https://example.com/a.png', 'https://example.com/b.png'];
        expect(makeMetainfoGuiApp(base, info, false)).toMatchSnapshot();
    });

    it('generates a self-contained component', () => {
        const info = new GUIAppInfo();
        info.categories = ['Utility', 'Building'];
        info.iconName = 'testapp';
        info.binary = 'testapp';
        info.scrImages = ['https://example.com/a.png'];
        expect(makeMetainfoGuiApp(base, info, true)).toMatchSnapshot();
    });

    it('emits input methods and a minimum display size', () => {
        const info = new GUIAppInfo();
        info.categories = ['Game'];
        info.iconName = 'game';
        info.binary = 'game';
        info.inputPointKeyboard = false;
        info.inputTouch = true;
        info.inputGamepad = true;
        info.inputTablet = true;
        info.minDisplaySize = 640;
        expect(makeMetainfoGuiApp(base, info, true)).toMatchSnapshot();
    });

    it('escapes XML metacharacters', () => {
        const info = new GUIAppInfo();
        info.desktopEntryName = 'x.desktop';
        expect(makeMetainfoGuiApp(nasty, info, false)).toMatchSnapshot();
    });

    it('omits the screenshots block when there are none', () => {
        const info = new GUIAppInfo();
        info.desktopEntryName = 'x.desktop';
        expect(makeMetainfoGuiApp(base, info, false)).toMatchSnapshot();
    });
});

describe('makeMetainfoConsoleApp', () => {
    it('emits categories, icon and binary', () => {
        const info = new ConsoleAppInfo();
        info.categories = ['Development', 'Building'];
        info.iconName = 'tool';
        info.binary = 'tool';
        expect(makeMetainfoConsoleApp(base, info)).toMatchSnapshot();
    });

    it('works without an icon or categories', () => {
        const info = new ConsoleAppInfo();
        info.binary = 'tool';
        expect(makeMetainfoConsoleApp(base, info)).toMatchSnapshot();
    });
});

describe('makeMetainfoAddon', () => {
    it('emits the extends relation and an icon', () => {
        const info = new AddonInfo();
        info.extends = ['com.example.parent_app'];
        info.iconName = 'plugin';
        expect(makeMetainfoAddon(base, info)).toMatchSnapshot();
    });

    it('works without an icon', () => {
        const info = new AddonInfo();
        info.extends = ['com.example.parent_app'];
        expect(makeMetainfoAddon(base, info)).toMatchSnapshot();
    });
});

describe('makeMetainfoService', () => {
    it('emits both categories', () => {
        const info = new ServiceInfo();
        info.categories = ['Network', 'WebDevelopment'];
        info.iconName = 'daemon';
        info.serviceName = 'testd';
        expect(makeMetainfoService(base, info)).toMatchSnapshot();
    });

    it('works with only a primary category', () => {
        const info = new ServiceInfo();
        info.categories = ['Network'];
        info.iconName = 'daemon';
        info.serviceName = 'testd';
        expect(makeMetainfoService(base, info)).toMatchSnapshot();
    });
});
