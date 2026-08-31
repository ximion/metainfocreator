import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        // Where the application will be served from; the freedesktop build sets
        // this to its deployment URL via .env.fdo.
        base: env.VITE_BASE_HREF || '/',
        plugins: [vue()],
        resolve: {
            alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
        },
        build: {
            // kept out of the repository root, next to the other build artifacts
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
