/**
 * Style Dictionary Configuration
 *
 * Transforms tokens.json into platform-specific exports:
 * CSS custom properties, SCSS variables, JS/TS modules, iOS JSON, Android XML.
 *
 * Output: dist/tokens/ (distributable exports for all platforms)
 *
 * Usage:
 *   node src/design-tokens/build.js
 */

import StyleDictionary from 'style-dictionary';
import androidSnakeCase from './transforms/android-snake-case.js';
import iosCapitalize from './transforms/ios-capitalize.js';

const DIST_PATH = 'dist/tokens/';

function isColorToken(token) {
  return token.path[0] === 'color';
}

function toCamelCase(path) {
  return path
    .map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');
}

const config = {
  source: ['src/design-tokens/tokens.json'],

  hooks: {
    transforms: {
      [androidSnakeCase.name]: androidSnakeCase,
      [iosCapitalize.name]: iosCapitalize,
    },

    formats: {
      'ios/grouped-json': ({ dictionary }) => {
        const groups = {};
        for (const token of dictionary.allTokens) {
          const category = token.path[0];
          const groupKey = category.charAt(0).toUpperCase() + category.slice(1) + 'Tokens';
          const tokenKey = toCamelCase(token.path.slice(1));
          if (!groups[groupKey]) {
            groups[groupKey] = {};
          }
          groups[groupKey][tokenKey] = token.value;
        }
        return JSON.stringify(groups, null, 2) + '\n';
      },

      'android/all-resources-xml': ({ dictionary }) => {
        const lines = [];
        for (const token of dictionary.allTokens) {
          const name = token.name;
          const value = token.value;
          const category = token.path[0];

          if (category === 'color') {
            lines.push(`    <color name="${name}">${value}</color>`);
          } else if (category === 'spacing' || category === 'radius' || category === 'size') {
            const dp = String(value).replace('px', 'dp');
            lines.push(`    <dimen name="${name}">${dp}</dimen>`);
          } else if (category === 'typography') {
            lines.push(`    <string name="${name}">${value}</string>`);
          } else {
            lines.push(`    <string name="${name}">${value}</string>`);
          }
        }

        return [
          '<?xml version="1.0" encoding="utf-8"?>',
          '<!-- Do not edit directly, this file was auto-generated. -->',
          '<resources>',
          ...lines,
          '</resources>',
          '',
        ].join('\n');
      },
    },
  },

  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: DIST_PATH,
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          options: {
            outputReferences: true,
            selector: ':root',
          },
        },
      ],
    },
    scss: {
      transformGroup: 'scss',
      buildPath: DIST_PATH,
      files: [
        {
          destination: 'tokens.scss',
          format: 'scss/variables',
          options: {
            outputReferences: true,
          },
        },
      ],
    },
    javascript: {
      transformGroup: 'js',
      buildPath: DIST_PATH,
      files: [
        {
          destination: 'tokens.js',
          format: 'javascript/es6',
        },
      ],
    },
    ios: {
      transforms: ['name/ios-capitalize'],
      buildPath: DIST_PATH,
      files: [
        {
          destination: 'tokens.ios.json',
          format: 'ios/grouped-json',
        },
      ],
    },
    android: {
      transforms: ['name/android-snake-case'],
      buildPath: DIST_PATH,
      files: [
        {
          destination: 'tokens.android.xml',
          format: 'android/all-resources-xml',
        },
      ],
    },
  },
};

export default config;
