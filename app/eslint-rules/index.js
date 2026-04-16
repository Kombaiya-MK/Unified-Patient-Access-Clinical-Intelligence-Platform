/**
 * Local ESLint plugin: design-tokens
 *
 * Aggregates custom rules that enforce design token usage across the codebase.
 */

import noHardcodedColors from './no-hardcoded-colors.js';
import noHardcodedSpacing from './no-hardcoded-spacing.js';
import useDesignTokens from './use-design-tokens.js';
import noHardcodedDesignValues from './no-hardcoded-design-values.js';

const plugin = {
  meta: {
    name: 'eslint-plugin-design-tokens',
    version: '1.1.0',
  },
  rules: {
    'no-hardcoded-colors': noHardcodedColors,
    'no-hardcoded-spacing': noHardcodedSpacing,
    'use-design-tokens': useDesignTokens,
    'no-hardcoded-design-values': noHardcodedDesignValues,
  },
};

export default plugin;
