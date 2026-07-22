/**
 * Flat ESLint config — mirrors the image-cache-pro core repo, plus the React
 * plugins (react, react-hooks). Formatting is Prettier's job (run separately
 * via `pnpm lint` / `lint-fix`).
 */
import eslintJs from '@eslint/js'
import vitest from '@vitest/eslint-plugin'
import { defineConfig } from 'eslint/config'
import eslintConfigPrettier from 'eslint-config-prettier'
import { importX } from 'eslint-plugin-import-x'
import reactHooks from 'eslint-plugin-react-hooks'
import unusedImports from 'eslint-plugin-unused-imports'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const ignores = [
  '**/node_modules/**',
  '**/dist/**',
  '**/coverage/**',
  '**/storybook-static/**',
  '**/*.d.ts',
  '**/vite.config.ts.timestamp-*.mjs',
]

export default defineConfig(
  { ignores },

  eslintJs.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  // NOTE: eslint-plugin-react's own rules crash on ESLint 10 (removed
  // context APIs) — react-hooks (the correctness-critical plugin) is
  // ESLint-10-ready and enabled below.
  reactHooks.configs.flat.recommended,

  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.js', '*.mjs', '.storybook/*.ts'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.es2025,
        ...globals.node,
      },
    },
    settings: {
      'import-x/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
    plugins: {
      'import-x': importX,
      'unused-imports': unusedImports,
    },
    rules: {
      'no-console': 'error',
      'import-x/no-duplicates': 'error',
      'import-x/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          pathGroups: [{ pattern: '@/**', group: 'internal' }],
          pathGroupsExcludedImportTypes: ['builtin'],
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'unused-imports/no-unused-imports': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          disallowTypeAnnotations: false,
          fixStyle: 'inline-type-imports',
        },
      ],
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: 'block-like', next: 'block-like' },
      ],
    },
  },

  // Plain JS (config files): type-aware rules need a TS program — skip them
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // Tests: vitest plugin + relaxed rules
  {
    files: ['**/*.{test,spec}.{ts,tsx}', '**/testing/**/*.{ts,tsx}'],
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/max-nested-describe': ['error', { max: 3 }],
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },

  // Stories: looser docs-oriented code
  {
    files: ['**/*.stories.tsx'],
    rules: {
      'no-console': 'off',
    },
  },

  // Prettier last — disables conflicting stylistic rules
  eslintConfigPrettier,
)
