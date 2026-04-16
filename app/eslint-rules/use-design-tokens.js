/**
 * ESLint Rule: use-design-tokens
 *
 * Detects hardcoded font-family, font-size, and font-weight values in
 * style objects and enforces usage of typography design tokens.
 */

const FONT_FAMILY_PATTERN = /^(Arial|Helvetica|Verdana|Georgia|Times|Courier|Consolas|Monaco|sans-serif|serif|monospace|Inter|Roboto|Segoe UI)/i;

const CSS_FONT_PROPERTIES = new Set([
  'fontFamily',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
]);

const ALLOWED_FONT_WEIGHTS = new Set([
  'normal',
  'bold',
  'bolder',
  'lighter',
  'inherit',
  'initial',
  'unset',
]);

const FONT_SIZE_PATTERN = /^\d+(px|rem|em|pt)$/;
const NUMERIC_WEIGHT_PATTERN = /^[1-9]00$/;

const FONT_SIZE_TOKEN_MAP = {
  '12px': 'var(--typography-font-size-xs)',
  '14px': 'var(--typography-font-size-sm)',
  '16px': 'var(--typography-font-size-base)',
  '18px': 'var(--typography-font-size-lg)',
  '20px': 'var(--typography-font-size-xl)',
  '24px': 'var(--typography-font-size-2xl)',
  '32px': 'var(--typography-font-size-3xl)',
  '48px': 'var(--typography-font-size-4xl)',
};

const FONT_WEIGHT_TOKEN_MAP = {
  '400': 'var(--typography-font-weight-regular)',
  '500': 'var(--typography-font-weight-medium)',
  '600': 'var(--typography-font-weight-semibold)',
  '700': 'var(--typography-font-weight-bold)',
};

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow hardcoded font properties; require typography design tokens',
      category: 'Design Tokens',
    },
    messages: {
      noHardcodedFont:
        'Hardcoded "{{prop}}" value "{{value}}" detected. Use a typography design token instead.{{suggestion}}',
    },
    schema: [],
    hasSuggestions: true,
  },

  create(context) {
    function checkProperty(node, propName) {
      const val = typeof node.value === 'number' ? String(node.value) : node.value;

      if (typeof val !== 'string') {
        return;
      }

      if (!CSS_FONT_PROPERTIES.has(propName)) {
        return;
      }

      // Skip values already using var()
      if (val.includes('var(')) {
        return;
      }

      // Skip inherit/initial/unset
      if (['inherit', 'initial', 'unset'].includes(val)) {
        return;
      }

      let shouldReport = false;
      let tokenVar = null;

      if (propName === 'fontFamily' && FONT_FAMILY_PATTERN.test(val)) {
        shouldReport = true;
      } else if (propName === 'fontSize') {
        if (FONT_SIZE_PATTERN.test(val)) {
          shouldReport = true;
          tokenVar = FONT_SIZE_TOKEN_MAP[val] || null;
        } else if (typeof node.value === 'number') {
          shouldReport = true;
          tokenVar = FONT_SIZE_TOKEN_MAP[`${node.value}px`] || null;
        }
      } else if (propName === 'fontWeight') {
        if (NUMERIC_WEIGHT_PATTERN.test(val) || typeof node.value === 'number') {
          shouldReport = true;
          tokenVar = FONT_WEIGHT_TOKEN_MAP[val] || null;
        } else if (!ALLOWED_FONT_WEIGHTS.has(val)) {
          shouldReport = true;
        }
      } else if (propName === 'lineHeight' || propName === 'letterSpacing') {
        // Flag hardcoded numeric line-height / letter-spacing outside token references
        if (typeof node.value === 'number' || /^-?\d+(\.\d+)?(px|em|rem)?$/.test(val)) {
          shouldReport = true;
        }
      }

      if (!shouldReport) {
        return;
      }

      const suggestion = tokenVar ? ` Suggested: ${tokenVar}` : '';

      context.report({
        node,
        messageId: 'noHardcodedFont',
        data: { value: val, prop: propName, suggestion },
        ...(tokenVar
          ? {
              suggest: [
                {
                  desc: `Replace with ${tokenVar}`,
                  fix(fixer) {
                    return fixer.replaceText(node, `'${tokenVar}'`);
                  },
                },
              ],
            }
          : {}),
      });
    }

    return {
      'Property > Literal'(node) {
        const prop = node.parent;
        if (prop.type === 'Property' && prop.value === node) {
          const keyName =
            prop.key.type === 'Identifier'
              ? prop.key.name
              : prop.key.type === 'Literal'
                ? String(prop.key.value)
                : null;

          if (keyName) {
            checkProperty(node, keyName);
          }
        }
      },
    };
  },
};
