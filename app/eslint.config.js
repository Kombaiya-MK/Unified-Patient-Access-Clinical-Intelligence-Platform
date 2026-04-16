import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import designTokensPlugin from './eslint-rules/index.js';

export default defineConfig([
  globalIgnores([
    'dist',
    'src/styles/tokens/**',
    'src/styles/generated/**',
    'src/design-tokens/**',
    'config/**',
    'eslint-rules/**',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'design-tokens': designTokensPlugin,
    },
    rules: {
      // Design token enforcement
      'design-tokens/no-hardcoded-colors': 'error',
      'design-tokens/no-hardcoded-spacing': 'error',
      'design-tokens/use-design-tokens': 'warn',
      'design-tokens/no-hardcoded-design-values': 'error',

      // TypeScript specific rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      
      // React specific rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      
      // Code quality rules
      'no-console': 'warn',
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'warn',
      'prefer-template': 'warn',
      'prefer-arrow-callback': 'warn',
      'no-param-reassign': 'error',
      'no-duplicate-imports': 'error',
      
      // Airbnb-inspired best practices
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'no-else-return': 'warn',
      'no-unused-expressions': 'error',
      'no-nested-ternary': 'warn',
      'max-depth': ['warn', 4],
      'complexity': ['warn', 10],
    },
  },
  // Disable design-token rules in files that legitimately use hardcoded values
  {
    files: ['**/*.stories.{ts,tsx}', '**/stories/**/*.{ts,tsx}'],
    rules: {
      'design-tokens/no-hardcoded-colors': 'off',
      'design-tokens/no-hardcoded-spacing': 'off',
      'design-tokens/use-design-tokens': 'off',
      'design-tokens/no-hardcoded-design-values': 'off',
    },
  },
]);
