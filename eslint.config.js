import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';

export default tseslint.config(
    { ignores: ['dist/**', 'node_modules/**', 'src/lib/__snapshots__/**'] },

    js.configs.recommended,
    ...tseslint.configs.recommended,
    ...pluginVue.configs['flat/recommended'],

    {
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: { ...globals.browser },
        },
        rules: {
            // carried over from the previous .eslintrc.json
            '@typescript-eslint/no-unused-vars': 'off',
        },
    },

    {
        // Vue single-file components need the TypeScript parser for <script lang="ts">
        files: ['**/*.vue'],
        languageOptions: {
            parserOptions: { parser: tseslint.parser },
        },
        rules: {
            /*
             * The templates are a faithful port of the Angular ones and keep their
             * original hand-written formatting, so the opinionated layout rules are
             * off. Turning them on would reformat every template wholesale and make
             * the port impossible to review against the Angular original.
             */
            'vue/max-attributes-per-line': 'off',
            'vue/singleline-html-element-content-newline': 'off',
            'vue/html-indent': 'off',
            'vue/html-self-closing': 'off',
            'vue/attributes-order': 'off',
            'vue/html-closing-bracket-newline': 'off',
            'vue/first-attribute-linebreak': 'off',
            'vue/multiline-html-element-content-newline': 'off',
            'vue/html-closing-bracket-spacing': 'off',
        },
    },

    {
        files: ['src/lib/**/*.ts'],
        /*
         * The generator library was carried over verbatim from the Angular app so
         * its output stays byte-identical; it is not restyled here. That includes
         * leaving its now-redundant eslint-disable comments in place.
         */
        linterOptions: { reportUnusedDisableDirectives: 'off' },
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },
);
