// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils';

import GuiAppView from './GuiAppView.vue';
import ConsoleAppView from './ConsoleAppView.vue';
import AddonView from './AddonView.vue';
import ServiceView from './ServiceView.vue';

/*
 * These cover the form behaviour that the generator unit tests cannot reach:
 * the value guessing, the enable/disable interlocks and the ordered submit
 * gate. They exist so that the views can be refactored without silently
 * changing how the forms behave.
 */

vi.mock('../lib/loadasset', () => ({
    loadAsset: vi.fn(async (name: string) => {
        switch (name) {
        case 'metadata-licenses.json':
            return [{ id: 'FSFAP', name: 'FSF All Permissive License' }];
        case 'spdx-licenses.json':
            return [{ id: 'GPL-3.0-or-later', name: 'GNU GPL v3.0 or later', free: true }];
        case 'categories-primary.json':
            return [{ name: 'Utility', desc: 'Utility' }, { name: 'Development', desc: 'Development' }];
        case 'categories-secondary.json':
            return [
                { name: 'Clock', desc: 'Clock', parents: ['Utility'] },
                { name: 'Building', desc: 'Building', parents: ['Development'] },
            ];
        default:
            return [];
        }
    }),
}));

const mountView = async (component: unknown) => {
    const wrapper = mount(component as never, {
        global: {
            stubs: { RouterLink: { template: '<a><slot /></a>' } },
            directives: { highlight: {} },
        },
    });
    await flushPromises();
    return wrapper;
};

/* Locating controls by their placeholder keeps these tests independent of the
   surrounding markup, which is what the refactoring will move around. */
const field = (w: VueWrapper, placeholder: string) => w.find(`[placeholder="${placeholder}"]`);
const value = (w: VueWrapper, placeholder: string) =>
    (field(w, placeholder).element as HTMLInputElement).value;

const selects = (w: VueWrapper) => w.findAll('select');
const generate = async (w: VueWrapper) => {
    await w.findAll('a.button').filter((a) => a.text().includes('Generate Metadata'))[0].trigger('click');
    await flushPromises();
};
const errorText = (w: VueWrapper) => {
    const box = w.find('.notification.is-danger');
    return box.exists() ? box.text() : null;
};
const generated = (w: VueWrapper) => w.find('.panel.is-success').exists();

beforeEach(() => vi.clearAllMocks());

describe('component-ID and icon guessing', () => {
    it('guesses the component ID from homepage and name', async () => {
        const w = await mountView(ConsoleAppView);
        await field(w, 'The human-readable name of your application').setValue('Test App');
        await field(w, 'The website where this application is hosted.').setValue('https://example.com/testapp');

        expect(value(w, 'Reverse-DNS string uniquely identifying your application.')).toBe('com.example.test_app');
    });

    it('stops guessing the ID for good once the user edits it', async () => {
        const w = await mountView(ConsoleAppView);
        const idPlaceholder = 'Reverse-DNS string uniquely identifying your application.';

        await field(w, 'The human-readable name of your application').setValue('Test App');
        await field(w, 'The website where this application is hosted.').setValue('https://example.com/testapp');
        expect(value(w, idPlaceholder)).toBe('com.example.test_app');

        // the user takes over the field
        await field(w, idPlaceholder).setValue('org.example.Chosen');

        // ...so later edits to the name must not overwrite their choice again
        await field(w, 'The human-readable name of your application').setValue('Completely Different');
        expect(value(w, idPlaceholder)).toBe('org.example.Chosen');
    });

    it('fills the icon name from the application name', async () => {
        const w = await mountView(ConsoleAppView);
        await field(w, 'The human-readable name of your application').setValue('Test App');

        expect(value(w, 'Stock icon name without file extension')).toBe('testapp');
    });

    it('stops filling the icon once the user edits it', async () => {
        const w = await mountView(ConsoleAppView);
        const iconPlaceholder = 'Stock icon name without file extension';

        await field(w, 'The human-readable name of your application').setValue('Test App');
        await field(w, iconPlaceholder).setValue('custom-icon');
        await field(w, 'The human-readable name of your application').setValue('Other Name');

        expect(value(w, iconPlaceholder)).toBe('custom-icon');
    });

    it('does not fill the icon on the addon form', async () => {
        const w = await mountView(AddonView);
        await field(w, 'The human-readable name of your addon').setValue('Test Addon');

        expect(value(w, 'Stock icon name without file extension')).toBe('');
    });
});

describe('license mode', () => {
    it('keeps the simple license select visible but disabled in SPDX mode', async () => {
        const w = await mountView(ConsoleAppView);
        const spdxPlaceholder = 'A SPDX license expression, e.g. GPL-3.0-or-later and MPL-2.0';

        // simple mode is the default
        expect(selects(w)[1].attributes('disabled')).toBeUndefined();
        expect(field(w, spdxPlaceholder).exists()).toBe(false);

        await w.findAll('input[type="radio"]')[1].setValue();

        // the select stays in the DOM, greyed out, and the expression field appears
        expect(selects(w)[1].attributes('disabled')).toBeDefined();
        expect(field(w, spdxPlaceholder).exists()).toBe(true);
    });
});

describe('category filtering', () => {
    it('offers only secondary categories belonging to the primary one', async () => {
        const w = await mountView(ConsoleAppView);
        await selects(w)[2].setValue('Utility');

        const options = selects(w)[3].findAll('option').map((o) => o.attributes('value'));
        expect(options).toEqual(['', 'Clock']);
    });

    it('clears an already chosen secondary category when the primary changes', async () => {
        const w = await mountView(ConsoleAppView);
        await selects(w)[2].setValue('Utility');
        await selects(w)[3].setValue('Clock');
        expect((selects(w)[3].element as HTMLSelectElement).value).toBe('Clock');

        await selects(w)[2].setValue('Development');
        expect((selects(w)[3].element as HTMLSelectElement).value).toBe('');
    });

    it('does not complain about a secondary category the user never touched', async () => {
        const w = await mountView(ConsoleAppView);
        // choosing a primary category clears the secondary one behind the scenes;
        // doing so must not count as the user having filled it in, or they are
        // scolded for leaving a field blank that they never visited
        await selects(w)[2].setValue('Utility');

        expect(w.text()).not.toContain('A secondary category must be selected');
    });

    it('does complain once the user has picked a secondary category and it is cleared', async () => {
        const w = await mountView(ConsoleAppView);
        await selects(w)[2].setValue('Utility');
        await selects(w)[3].setValue('Clock');
        await selects(w)[2].setValue('Development');

        // the user has been in this field, so the reminder is warranted
        expect(w.text()).toContain('A secondary category must be selected');
    });
});

describe('the ordered submit gate', () => {
    it('reports one failure at a time, in the original field order', async () => {
        const w = await mountView(GuiAppView);
        const messages: (string | null)[] = [];

        await generate(w);
        messages.push(errorText(w));

        await field(w, 'The human-readable name of your application').setValue('Test App');
        await generate(w);
        messages.push(errorText(w));

        await field(w, 'A short text summarizing what the application does').setValue('A summary');
        await generate(w);
        messages.push(errorText(w));

        await field(w, 'The website where this application is hosted.').setValue('not-a-url');
        await generate(w);
        messages.push(errorText(w));

        expect(messages).toEqual([
            'Unable to generate metadata:No value set for application name!',
            'Unable to generate metadata:No value set for application summary!',
            'Unable to generate metadata:No value set for homepage!',
            'Unable to generate metadata:Value for homepage is invalid!',
        ]);
    });

    it('reports a missing project license separately', async () => {
        const w = await mountView(ConsoleAppView);
        await field(w, 'The human-readable name of your application').setValue('Test App');
        await field(w, 'A short text summarizing what the application does').setValue('A summary');
        await field(w, 'The website where this application is hosted.').setValue('https://example.com/testapp');
        await field(w, 'Long description of this software.').setValue('Description.');
        await selects(w)[0].setValue('FSFAP');

        await generate(w);
        expect(errorText(w)).toContain('No project license has been selected.');
    });
});

describe('GUI app launchable modes', () => {
    const desktopEntryPlaceholder = 'myapplication.desktop';

    it('asks for a desktop-entry filename in "provided" mode', async () => {
        const w = await mountView(GuiAppView);

        expect(field(w, desktopEntryPlaceholder).exists()).toBe(true);
        expect(w.text()).not.toContain('Launchable Details');
    });

    it('asks for categories and a binary in the generating modes', async () => {
        const w = await mountView(GuiAppView);
        await w.findAll('input[type="radio"][value="generate"]')[0].setValue();

        expect(field(w, desktopEntryPlaceholder).exists()).toBe(false);
        expect(w.text()).toContain('Launchable Details');
        expect(w.text()).toContain('Categorization');
    });
});

describe('GUI app input method interlock', () => {
    const boxes = (w: VueWrapper) => w.findAll('input[type="checkbox"]');

    it('forces mouse & keyboard on while it is the only input method', async () => {
        const w = await mountView(GuiAppView);
        const mouseKeys = boxes(w)[0].element as HTMLInputElement;

        expect(mouseKeys.checked).toBe(true);
        expect(mouseKeys.disabled).toBe(true);
    });

    it('releases it once another input method is selected', async () => {
        const w = await mountView(GuiAppView);
        await boxes(w)[1].setValue(true);   // touch

        const mouseKeys = boxes(w)[0].element as HTMLInputElement;
        expect(mouseKeys.disabled).toBe(false);
        expect(mouseKeys.checked).toBe(true);
    });

    it('locks it again when the other methods are cleared', async () => {
        const w = await mountView(GuiAppView);
        await boxes(w)[1].setValue(true);
        await boxes(w)[1].setValue(false);

        const mouseKeys = boxes(w)[0].element as HTMLInputElement;
        expect(mouseKeys.disabled).toBe(true);
        expect(mouseKeys.checked).toBe(true);
    });
});

describe('optional fields', () => {
    it('generates addon metadata with no icon', async () => {
        const w = await mountView(AddonView);
        await field(w, 'The human-readable name of your addon').setValue('Test Addon');
        await field(w, 'A short text summarizing what the addon does').setValue('An addon');
        await field(w, 'The website where this addon is hosted.').setValue('https://example.com/addon');
        await field(w, 'Long description of this software.').setValue('Description.');
        await w.findAll('[placeholder="Reverse-DNS string uniquely identifying your addon."]')[1]
            .setValue('com.example.parent_app');
        await selects(w)[0].setValue('FSFAP');
        await selects(w)[1].setValue('GPL-3.0-or-later');

        await generate(w);

        expect(errorText(w)).toBeNull();
        expect(generated(w)).toBe(true);
    });

    it('generates service metadata with no secondary category', async () => {
        const w = await mountView(ServiceView);
        await field(w, 'The human-readable name of your service').setValue('Test Daemon');
        await field(w, 'A short text summarizing what the service does').setValue('A daemon');
        await field(w, 'The website where this service source code is hosted.').setValue('https://example.com/testd');
        await field(w, 'Long description of this software.').setValue('Description.');
        await selects(w)[0].setValue('FSFAP');
        await selects(w)[1].setValue('GPL-3.0-or-later');
        await selects(w)[2].setValue('Utility');
        await field(w, 'System service name').setValue('testd');

        await generate(w);

        expect(errorText(w)).toBeNull();
        expect(generated(w)).toBe(true);
        // only the primary category ends up in the metadata
        expect(w.text()).toContain('MetaInfo File');
    });
});
