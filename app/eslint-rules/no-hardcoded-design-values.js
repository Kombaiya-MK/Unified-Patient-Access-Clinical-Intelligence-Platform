/**
 * ESLint Rule: no-hardcoded-design-values
 *
 * Comprehensive rule that detects ALL hardcoded design values in style objects:
 * - Colors (hex, rgb, rgba, hsl, hsla, named CSS colors)
 * - Spacing/sizing (px, rem, em units)
 * - Typography (font-family, font-size, font-weight, line-height, letter-spacing)
 *
 * Enforces usage of design token CSS variables for all visual properties.
 * Combines the logic of: no-hardcoded-colors, no-hardcoded-spacing, use-design-tokens.
 */

// ── Color Detection ──────────────────────────────────────────────────────────

const COLOR_HEX_PATTERN = /#[0-9A-Fa-f]{3,8}\b/;
const COLOR_FUNC_PATTERN = /^(rgb|rgba|hsl|hsla)\s*\(/i;

const CSS_COLOR_PROPERTIES = new Set([
  'color', 'backgroundColor', 'borderColor',
  'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
  'outlineColor', 'textDecorationColor', 'fill', 'stroke',
  'background', 'boxShadow', 'textShadow',
  'caretColor', 'columnRuleColor', 'accentColor',
]);

const COLOR_TOKEN_MAP = {
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

// ── Spacing Detection ────────────────────────────────────────────────────────

const HARDCODED_PX_PATTERN = /(?<!\w)(\d+)(px|rem|em)\b/;

const CSS_SPACING_PROPERTIES = new Set([
  'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'paddingBlock', 'paddingInline',
  'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'marginBlock', 'marginInline',
  'gap', 'rowGap', 'columnGap',
  'top', 'right', 'bottom', 'left', 'inset',
  'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
  'borderRadius', 'borderWidth',
]);

const ALLOWED_VALUES = new Set([
  '0', '0px', '1px', '100%', '50%',
  'auto', 'inherit', 'initial', 'unset', 'none', '0 auto',
]);

const SPACING_TOKEN_MAP = {
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

// ── Typography Detection ─────────────────────────────────────────────────────

const FONT_FAMILY_PATTERN = /^(Arial|Helvetica|Verdana|Georgia|Times|Courier|Consolas|Monaco|sans-serif|serif|monospace|Inter|Roboto|Segoe UI)/i;

const CSS_FONT_PROPERTIES = new Set([
  'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing',
]);

const ALLOWED_FONT_WEIGHTS = new Set([
  'normal', 'bold', 'bolder', 'lighter', 'inherit', 'initial', 'unset',
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

// ── All monitored properties ─────────────────────────────────────────────────

const ALL_MONITORED_PROPERTIES = new Set([
  ...CSS_COLOR_PROPERTIES,
  ...CSS_SPACING_PROPERTIES,
  ...CSS_FONT_PROPERTIES,
]);

// ── Helpers ──────────────────────────────────────────────────────────────────

function getColorSuggestion(value) {
  const upper = value.toUpperCase();
  return COLOR_TOKEN_MAP[upper] || COLOR_TOKEN_MAP[value] || null;
}

function getSpacingSuggestion(value, propName) {
  const trimmed = value.trim();
  if (propName === 'borderRadius') {
    return RADIUS_TOKEN_MAP[trimmed] || SPACING_TOKEN_MAP[trimmed] || null;
  }
  return SPACING_TOKEN_MAP[trimmed] || null;
}

function getFontSuggestion(value, propName) {
  if (propName === 'fontSize') {
    return FONT_SIZE_TOKEN_MAP[value] || null;
  }
  if (propName === 'fontWeight') {
    return FONT_WEIGHT_TOKEN_MAP[value] || null;
  }
  return null;
}

// ── Rule Definition ──────────────────────────────────────────────────────────

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow hardcoded design values (colors, spacing, typography); require design token CSS variables',
      category: 'Design Tokens',
    },
    messages: {
      noHardcodedDesignValue:
        'Hardcoded {{category}} "{{value}}" in "{{prop}}". Use a design token CSS variable instead.{{suggestion}}',
    },
    schema: [],
    hasSuggestions: true,
  },

  create(context) {
    function report(node, category, value, prop, tokenVar) {
      const suggestion = tokenVar ? ` Suggested: ${tokenVar}` : '';

      context.report({
        node,
        messageId: 'noHardcodedDesignValue',
        data: { category, value, prop, suggestion },
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

    function checkColorValue(node, propName, val) {
      if (!CSS_COLOR_PROPERTIES.has(propName)) {
        return false;
      }

      const isColor = COLOR_HEX_PATTERN.test(val) || COLOR_FUNC_PATTERN.test(val);
      if (!isColor) {
        return false;
      }

      const tokenVar = getColorSuggestion(val);
      report(node, 'color', val, propName, tokenVar);
      return true;
    }

    function checkSpacingValue(node, propName, val) {
      if (!CSS_SPACING_PROPERTIES.has(propName)) {
        return false;
      }

      const trimmed = val.trim();

      if (ALLOWED_VALUES.has(trimmed)) {
        return false;
      }

      if (!HARDCODED_PX_PATTERN.test(trimmed)) {
        return false;
      }

      if (trimmed.includes('var(')) {
        return false;
      }

      const tokenVar = getSpacingSuggestion(trimmed, propName);
      report(node, 'spacing', trimmed, propName, tokenVar);
      return true;
    }

    function checkSpacingNumericValue(node, propName, numValue) {
      if (!CSS_SPACING_PROPERTIES.has(propName)) {
        return false;
      }

      if (numValue === 0) {
        return false;
      }

      const pxVal = `${numValue}px`;
      if (ALLOWED_VALUES.has(pxVal)) {
        return false;
      }

      const tokenVar = getSpacingSuggestion(pxVal, propName);
      report(node, 'spacing', String(numValue), propName, tokenVar);
      return true;
    }

    function checkFontValue(node, propName, val) {
      if (!CSS_FONT_PROPERTIES.has(propName)) {
        return false;
      }

      if (val.includes('var(')) {
        return false;
      }

      if (['inherit', 'initial', 'unset'].includes(val)) {
        return false;
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
        if (typeof node.value === 'number' || /^-?\d+(\.\d+)?(px|em|rem)?$/.test(val)) {
          shouldReport = true;
        }
      }

      if (!shouldReport) {
        return false;
      }

      report(node, 'typography', val, propName, tokenVar);
      return true;
    }

    function checkNode(node, propName) {
      const val = typeof node.value === 'string' ? node.value : null;
      const numVal = typeof node.value === 'number' ? node.value : null;

      if (val !== null) {
        // Try each category in order; stop at first match
        if (checkColorValue(node, propName, val)) {
          return;
        }
        if (checkSpacingValue(node, propName, val)) {
          return;
        }
        checkFontValue(node, propName, val);
      } else if (numVal !== null) {
        // Numeric: could be spacing (React px) or font property
        if (checkSpacingNumericValue(node, propName, numVal)) {
          return;
        }
        checkFontValue(node, propName, String(numVal));
      }
    }

    return {
      'Property > Literal'(node) {
        const prop = node.parent;
        if (prop.type !== 'Property' || prop.value !== node) {
          return;
        }

        const keyName =
          prop.key.type === 'Identifier'
            ? prop.key.name
            : prop.key.type === 'Literal'
              ? String(prop.key.value)
              : null;

        if (keyName && ALL_MONITORED_PROPERTIES.has(keyName)) {
          checkNode(node, keyName);
        }
      },

      'Property > TemplateLiteral'(node) {
        const prop = node.parent;
        if (prop.type !== 'Property' || prop.value !== node) {
          return;
        }

        const keyName =
          prop.key.type === 'Identifier' ? prop.key.name : null;

        if (keyName && CSS_COLOR_PROPERTIES.has(keyName)) {
          for (const quasi of node.quasis) {
            const raw = quasi.value.raw;
            if (COLOR_HEX_PATTERN.test(raw) || COLOR_FUNC_PATTERN.test(raw)) {
              context.report({
                node,
                messageId: 'noHardcodedDesignValue',
                data: {
                  category: 'color',
                  value: raw.trim(),
                  prop: keyName,
                  suggestion: '',
                },
              });
            }
          }
        }
      },
    };
  },
};
