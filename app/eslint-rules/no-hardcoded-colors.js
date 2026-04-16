/**
 * ESLint Rule: no-hardcoded-colors
 *
 * Detects hardcoded color values (hex, rgb, rgba, hsl, hsla, named CSS colors)
 * in style objects and suggests using design token CSS variables instead.
 */

const COLOR_HEX_PATTERN = /#[0-9A-Fa-f]{3,8}\b/;
const COLOR_FUNC_PATTERN = /^(rgb|rgba|hsl|hsla)\s*\(/i;

const CSS_COLOR_PROPERTIES = new Set([
  'color',
  'backgroundColor',
  'borderColor',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'outlineColor',
  'textDecorationColor',
  'fill',
  'stroke',
  'background',
  'boxShadow',
  'textShadow',
  'caretColor',
  'columnRuleColor',
  'accentColor',
]);

const TOKEN_MAP = {
  '#0066CC': 'var(--color-primary-600)',
  '#005BB8': 'var(--color-primary-700)',
  '#004C99': 'var(--color-primary-800)',
  '#003D7A': 'var(--color-primary-900)',
  '#00A86B': 'var(--color-secondary-600)',
  '#DC3545': 'var(--color-error-600)',
  '#00A145': 'var(--color-success-600)',
  '#FF8800': 'var(--color-warning-600)',
  '#0077B6': 'var(--color-info-600)',
  '#1A1A1A': 'var(--color-neutral-900)',
  '#333333': 'var(--color-neutral-800)',
  '#4D4D4D': 'var(--color-neutral-700)',
  '#666666': 'var(--color-neutral-600)',
  '#999999': 'var(--color-neutral-400)',
  '#FFFFFF': 'var(--color-white)',
  '#ffffff': 'var(--color-white)',
  '#000000': 'var(--color-black)',
  '#F5F5F5': 'var(--color-neutral-100)',
  '#E5E5E5': 'var(--color-neutral-200)',
  '#CCCCCC': 'var(--color-neutral-300)',
};

function getTokenSuggestion(value) {
  const upper = value.toUpperCase();
  return TOKEN_MAP[upper] || TOKEN_MAP[value] || null;
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow hardcoded color values; require design token CSS variables',
      category: 'Design Tokens',
    },
    messages: {
      noHardcodedColor:
        'Hardcoded color "{{value}}" detected. Use a design token CSS variable instead.{{suggestion}}',
    },
    schema: [],
    hasSuggestions: true,
  },

  create(context) {
    function checkLiteral(node, propName) {
      if (typeof node.value !== 'string') {
        return;
      }

      const val = node.value;

      if (!CSS_COLOR_PROPERTIES.has(propName)) {
        return;
      }

      const isColor = COLOR_HEX_PATTERN.test(val) || COLOR_FUNC_PATTERN.test(val);
      if (!isColor) {
        return;
      }

      const tokenVar = getTokenSuggestion(val);
      const suggestion = tokenVar ? ` Suggested: ${tokenVar}` : '';

      context.report({
        node,
        messageId: 'noHardcodedColor',
        data: { value: val, suggestion },
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

    function checkTemplateValue(node, value) {
      if (COLOR_HEX_PATTERN.test(value) || COLOR_FUNC_PATTERN.test(value)) {
        context.report({
          node,
          messageId: 'noHardcodedColor',
          data: { value: value.trim(), suggestion: '' },
        });
      }
    }

    return {
      // Detect: style={{ color: '#FF0000' }}
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
          }
        }
      },

      // Detect template literals in style objects: `#FF0000`
      'Property > TemplateLiteral'(node) {
        const prop = node.parent;
        if (prop.type === 'Property' && prop.value === node) {
          const keyName =
            prop.key.type === 'Identifier' ? prop.key.name : null;
          if (keyName && CSS_COLOR_PROPERTIES.has(keyName)) {
            for (const quasi of node.quasis) {
              checkTemplateValue(node, quasi.value.raw);
            }
          }
        }
      },
    };
  },
};
