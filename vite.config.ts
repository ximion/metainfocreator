import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        // Replaces Angular's `ng build --base-href`. The freedesktop build sets
        // this to the deployment URL via .env.fdo.
        base: env.VITE_BASE_HREF || '/',
        plugins: [vue()],
        resolve: {
            alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
        },
        build: {
            // same output location the Angular build used
            outDir: 'dist/metainfocreator',
            emptyOutDir: true,
            /*
             * Keep the bundler's own output out of assets/. The static data files
             * in public/assets are served from assets/ (the URL the app fetches and
             * the path update-assets.py writes to), so letting Vite emit its hashed
             * chunks there too would risk a name collision.
             */
            assetsDir: 'static',
        },
        test: {
            environment: 'node',
            include: ['src/**/*.test.ts'],
        },
    };
});
