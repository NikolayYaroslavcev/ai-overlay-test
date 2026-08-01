import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/**', 'src-tauri/target/**', 'node_modules/**'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],

  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  // Mock backend runs under Node, not the browser.
  {
    files: ['server/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Vue SFCs delegate <script> parsing to typescript-eslint so TS rules
  // apply inside components too.
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },

  // Off: shared/ui primitives (Text, Icon, Flex, Stack, Surface, Loader) are
  // intentionally single-word.
  {
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },

  // Feature-Sliced layer boundaries. Each layer may only import from itself
  // and the layers below it, so dependencies always point one direction —
  // this is what makes cycles between layers impossible by construction
  // instead of relying on people remembering the rule. Update this block
  // whenever a layer is added or reordered; nothing else enforces it.
  ...layerBoundaries([
    {
      dir: 'shared',
      forbidden: ['app', 'services', 'composables', 'entities', 'features', 'widgets'],
    },
    { dir: 'services', forbidden: ['app', 'composables', 'entities', 'features', 'widgets'] },
    { dir: 'composables', forbidden: ['app', 'entities', 'features', 'widgets'] },
    { dir: 'entities', forbidden: ['app', 'composables', 'features', 'widgets'] },
    { dir: 'features', forbidden: ['app', 'widgets'] },
    { dir: 'widgets', forbidden: ['app'] },
  ]),

  // Must stay last: turns off stylistic rules that conflict with Prettier.
  eslintConfigPrettier,
);

/**
 * @param {{ dir: string; forbidden: string[] }[]} rules
 * @returns {import('eslint').Linter.Config[]}
 */
function layerBoundaries(rules) {
  return rules.map(({ dir, forbidden }) => ({
    files: [`src/${dir}/**/*.{ts,vue}`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: forbidden.map((layer) => ({
            group: [`@/${layer}/**`],
            message: `src/${dir} may not import from src/${layer} — that would point the dependency arrow the wrong way (${dir} sits below ${layer}). Move the shared code down into shared/, or move this code up into ${layer}.`,
          })),
        },
      ],
    },
  }));
}
