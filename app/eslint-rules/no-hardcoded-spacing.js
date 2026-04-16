/**
 * ESLint Rule: no-hardcoded-spacing
 *
 * Detects hardcoded spacing values (px, rem, em) in style object properties
 * related to layout/spacing. Enforces design token CSS variable usage.
 * Exceptions: 0, 0px, 1px (borders), 100%, 50%, auto, inherit, none.
 */

const HARDCODED_PX_PATTERN = /(?<!\w)(\d+)(px|rem|em)\b/;

const CSS_SPACING_PROPERTIES = new Set([
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'paddingBlock',
  'paddingInline',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'marginBlock',
  'marginInline',
  'gap',
  'rowGap',
  'columnGap',
  'top',
  'right',
  'bottom',
  'left',
  'inset',
  'width',
  'height',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
  'borderRadius',
  'borderWidth',
]);

const ALLOWED_VALUES = new Set([
  '0',
  '0px',
  '1px',
  '100%',
  '50%',
  'auto',
  'inherit',
  'initial',
  'unset',
  'none',
  '0 auto',
]);

const TOKEN_MAP = {
  '4px': 'var(--spacing-xs)',
  '8px': 'var(--spacing-sm)',
  '12px': 'var(--spacing-md)',
  '16px': 'var(--spacing-base)',
  '24px': 'var(--spacing-lg)',
  '32px': 'var(--spacing-xl)',
  '48px': 'var(--spacing-2xl)',
  '64px': 'var(--spacing-3xl)',
  '96px': 'var(--spacing-4xl)',
};

const RADIUS_TOKEN_MAP = {
  '0px': 'var(--radius-none)',
  '4px': 'var(--radius-sm)',
  '8px': 'var(--radius-md)',
  '12px': 'var(--radius-lg)',
  '16px': 'var(--radius-xl)',
  '9999px': 'var(--radius-full)',
};

function getSuggestion(value, propName) {
  const trimmed = value.trim();
  if (propName === 'borderRadius') {
    return RADIUS_TOKEN_MAP[trimmed] || TOKEN_MAP[trimmed] || null;
  }
  return TOKEN_MAP[trimmed] || null;
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow hardcoded spacing/sizing values; require design token CSS variables',
      category: 'Design Tokens',
    },
    messages: {
      noHardcodedSpacing:
        'Hardcoded spacing "{{value}}" in "{{prop}}". Use a design token CSS variable instead.{{suggestion}}',
    },
    schema: [],
    hasSuggestions: true,
  },

  create(context) {
    function checkLiteral(node, propName) {
      if (typeof node.value !== 'string') {
        return;
      }

      const val = node.value.trim();

      if (!CSS_SPACING_PROPERTIES.has(propName)) {
        return;
      }

      if (ALLOWED_VALUES.has(val)) {
        return;
      }

      // Check if value contains hardcoded units
      if (!HARDCODED_PX_PATTERN.test(val)) {
        return;
      }

      // Skip values using var() — already using tokens
      if (val.includes('var(')) {
        return;
      }

      const tokenVar = getSuggestion(val, propName);
      const suggestion = tokenVar ? ` Suggested: ${tokenVar}` : '';

      context.report({
        node,
        messageId: 'noHardcodedSpacing',
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

    function checkNumeric(node, keyName) {
      if (typeof node.value !== 'number' || node.value === 0) {
        return;
      }

      // React inline styles use numeric values (interpreted as px)
      if (CSS_SPACING_PROPERTIES.has(keyName)) {
        const pxVal = `${node.value}px`;
        if (ALLOWED_VALUES.has(pxVal)) {
          return;
        }

        const tokenVar = getSuggestion(pxVal, keyName);
        const suggestion = tokenVar ? ` Suggested: ${tokenVar}` : '';

        context.report({
          node,
          messageId: 'noHardcodedSpacing',
          data: { value: String(node.value), prop: keyName, suggestion },
        });
      }
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
            checkLiteral(node, keyName);
            checkNumeric(node, keyName);
          }
        }
      },
    };
  },
};
