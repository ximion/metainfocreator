// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

import { highlight } from './highlight';

const Host = {
    props: ['code', 'lang'],
    template: '<pre><code v-highlight="{ code, lang }"></code></pre>',
};

const mountWith = (code: string, lang: string) =>
    mount(Host, { props: { code, lang }, global: { directives: { highlight } } });

/* The highlighter is imported on demand, so the first test to need it has to
   wait for a real module load rather than a single microtask flush. */
const highlighted = (w: ReturnType<typeof mountWith>) =>
    vi.waitFor(() => {
        const html = w.find('code').html();
        expect(html).toContain('hljs-');
        return html;
    });

describe('the highlight directive', () => {
    it('shows the plain text before the highlighter has loaded', () => {
        const w = mountWith('<component/>', 'xml');
        expect(w.find('code').text()).toBe('<component/>');
    });

    it('marks up XML once the highlighter arrives', async () => {
        const w = mountWith('<component type="desktop-application"/>', 'xml');

        expect(await highlighted(w)).toContain('hljs-tag');
        expect(w.find('code').text()).toBe('<component type="desktop-application"/>');
    });

    it('highlights Meson snippets, which borrow the Python grammar', async () => {
        const w = mountWith("test('validate metainfo file', ascli_exe)", 'meson');

        expect(await highlighted(w)).toContain('hljs-string');
    });

    it('highlights desktop entries, which borrow the INI grammar', async () => {
        const w = mountWith('[Desktop Entry]\nType=Application', 'toml');

        expect(await highlighted(w)).toContain('hljs-section');
    });

    it('renders nothing for empty input', async () => {
        const w = mountWith('', 'xml');
        await flushPromises();

        expect(w.find('code').text()).toBe('');
    });

    it('escapes markup rather than injecting it', async () => {
        const w = mountWith('<script>alert(1)</script>', 'xml');
        await highlighted(w);

        expect(w.find('code').element.querySelector('script')).toBeNull();
    });
});
