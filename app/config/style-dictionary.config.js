/**
 * Style Dictionary Configuration
 *
 * Transforms design token source JSON files into multi-platform outputs:
 * CSS custom properties, SCSS variables, JS/TS modules, iOS JSON, Android XML.
 *
 * Usage:
 *   npx style-dictionary build --config app/config/style-dictionary.config.js
 *
 * Or via npm script:
 *   npm run tokens:build
 */

const SOURCE_DIR = 'src/styles/tokens';
const BUILD_DIR  = 'src/styles/generated/';

function isColorToken(token) {
  return token.path[0] === 'color';
}

/** @type {import('style-dictionary').Config} */
export default {
  source: [
    `${SOURCE_DIR}/colors.json`,
    `${SOURCE_DIR}/typography.json`,
    `${SOURCE_DIR}/spacing.json`,
  ],

  hooks: {
    formats: {
      'ios/json': ({ dictionary }) => {
        const tokens = {};
        for (const token of dictionary.allTokens) {
          tokens[token.name] = {
            value: token.value,
            ...(token.comment ? { comment: token.comment } : {}),
          };
        }
        return JSON.stringify(tokens, null, 2) + '\n';
      },

      'android/colors-xml': ({ dictionary }) => {
        const colorTokens = dictionary.allTokens.filter(isColorToken);
        const lines = colorTokens.map(
          (token) => `    <color name="${token.name}">${token.value}</color>`,
        );
        return [
          '<?xml version="1.0" encoding="utf-8"?>',
          '<!-- Do not edit directly, this file was auto-generated. -->',
          '<resources>',
          ...lines,
          '</resources>',
          '',
        ].join('\n');
      },

      'typescript/declarations': ({ dictionary }) => {
        const header = '/**\n * Do not edit directly, this file was auto-generated.\n */\n\n';
        const declarations = dictionary.allTokens
          .map((token) => `export const ${token.name}: string;`)
          .join('\n');
        return header + declarations + '\n';
      },
    },
  },

  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: BUILD_DIR,
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
      buildPath: BUILD_DIR,
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
    js: {
      transformGroup: 'js',
      buildPath: BUILD_DIR,
      files: [
        {
          destination: 'tokens.js',
          format: 'javascript/es6',
        },
      ],
    },
    ts: {
      transformGroup: 'js',
      buildPath: BUILD_DIR,
      files: [
        {
          destination: 'tokens.d.ts',
          format: 'typescript/declarations',
        },
      ],
    },
    ios: {
      transformGroup: 'js',
      buildPath: `${BUILD_DIR}ios/`,
      files: [
        {
          destination: 'tokens.json',
          format: 'ios/json',
        },
      ],
    },
    android: {
      transformGroup: 'js',
      buildPath: `${BUILD_DIR}android/`,
      files: [
        {
          destination: 'colors.xml',
          format: 'android/colors-xml',
        },
      ],
    },
  },
};
