import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Tests for no-hardcoded-design-values ESLint rule.
 *
 * Uses a lightweight AST-simulation approach since ESLint RuleTester
 * requires CJS context. We validate the rule metadata and detection
 * logic by invoking the rule's create() with a mock context.
 */

const loadRule = async () => (await import('../no-hardcoded-design-values.js')).default;

describe('no-hardcoded-design-values', () => {
  let rule;

  beforeEach(async () => {
    rule = await loadRule();
  });

  // ── Metadata ─────────────────────────────────────────────────────────────

  it('exports valid rule metadata', () => {
    expect(rule.meta.type).toBe('suggestion');
    expect(rule.meta.hasSuggestions).toBe(true);
    expect(rule.meta.messages.noHardcodedDesignValue).toBeDefined();
  });

  // ── Color Detection ──────────────────────────────────────────────────────

  describe('color detection', () => {
    it('reports hex color in color property', () => {
      const reports = [];
      const visitors = rule.create({
        report: (info) => reports.push(info),
      });

      const literal = { type: 'Literal', value: '#FF0000' };
      const prop = {
        type: 'Property',
        key: { type: 'Identifier', name: 'color' },
        value: literal,
      };
      literal.parent = prop;

      visitors['Property > Literal'](literal);
      expect(reports.length).toBe(1);
      expect(reports[0].data.category).toBe('color');
      expect(reports[0].data.value).toBe('#FF0000');
    });

    it('reports hex color in backgroundColor', () => {
      const reports = [];
      const visitors = rule.create({
        report: (info) => reports.push(info),
      });

      const literal = { type: 'Literal', value: '#333333' };
      const prop = {
        type: 'Property',
        key: { type: 'Identifier', name: 'backgroundColor' },
        value: literal,
      };
      literal.parent = prop;

      visitors['Property > Literal'](literal);
      expect(reports.length).toBe(1);
      expect(reports[0].data.suggestion).toContain('var(--color-neutral-800)');
    });

    it('reports rgb() color function', () => {
      const reports = [];
      const visitors = rule.create({
        report: (info) => reports.push(info),
      });

      const literal = { type: 'Literal', value: 'rgb(255, 0, 0)' };
      const prop = {
        type: 'Property',
        key: { type: 'Identifier', name: 'color' },
        value: literal,
      };
      literal.parent = prop;

      visitors['Property > Literal'](literal);
      expect(reports.length).toBe(1);
      expect(reports[0].data.category).toBe('color');
    });

    it('does not report color in non-color property', () => {
      const reports = [];
      const visitors = rule.create({
        report: (info) => reports.push(info),
      });

      const literal = { type: 'Literal', value: '#FF0000' };
      const prop = {
        type: 'Property',
        key: { type: 'Identifier', name: 'padding' },
        value: literal,
      };
      literal.parent = prop;

      visitors['Property > Literal'](literal);
      expect(reports.length).toBe(0);
    });
  });

  // ── Spacing Detection ────────────────────────────────────────────────────

  describe('spacing detection', () => {
    it('reports hardcoded px in padding', () => {
      const reports = [];
      const visitors = rule.create({
        report: (info) => reports.push(info),
      });

      const literal = { type: 'Literal', value: '16px' };
      const prop = {
        type: 'Property',
        key: { type: 'Identifier', name: 'padding' },
        value: literal,
      };
      literal.parent = prop;

      visitors['Property > Literal'](literal);
      expect(reports.length).toBe(1);
      expect(reports[0].data.category).toBe('spacing');
      expect(reports[0].data.suggestion).toContain('var(--spacing-base)');
    });

    it('reports hardcoded rem in margin', () => {
      const reports = [];
      const visitors = rule.create({
        report: (info) => reports.push(info),
      });

      const literal = { type: 'Literal', value: '2rem' };
      const prop = {
        type: 'Property',
        key: { type: 'Identifier', name: 'margin' },
        value: literal,
      };
      literal.parent = prop;

      visitors['Property > Literal'](literal);
      expect(reports.length).toBe(1);
      expect(reports[0].data.category).toBe('spacing');
    });

    it('allows 0, 0px, 1px, auto, inherit', () => {
      const allowedValues = ['0', '0px', '1px', 'auto', 'inherit'];

      for (const val of allowedValues) {
        const reports = [];
        const visitors = rule.create({
          report: (info) => reports.push(info),
        });

        const literal = { type: 'Literal', value: val };
        const prop = {
          type: 'Property',
          key: { type: 'Identifier', name: 'padding' },
          value: literal,
        };
        literal.parent = prop;

        visitors['Property > Literal'](literal);
        expect(reports.length).toBe(0);
      }
    });

    it('allows var() references', () => {
      const reports = [];
      const visitors = rule.create({
        report: (info) => reports.push(info),
      });

      const literal = { type: 'Literal', value: 'var(--spacing-base)' };
      const prop = {
        type: 'Property',
        key: { type: 'Identifier', name: 'padding' },
        value: literal,
      };
      literal.parent = prop;

      visitors['Property > Literal'](literal);
      expect(reports.length).toBe(0);
    });

    it('reports numeric spacing values (React inline style)', () => {
      const reports = [];
      const visitors = rule.create({
        report: (info) => reports.push(info),
      });

      const literal = { type: 'Literal', value: 16 };
      const prop = {
        type: 'Property',
        key: { type: 'Identifier', name: 'padding' },
        value: literal,
      };
      literal.parent = prop;

      visitors['Property > Literal'](literal);
      expect(reports.length).toBe(1);
      expect(reports[0].data.category).toBe('spacing');
    });

    it('does not report numeric 0', () => {
      const reports = [];
      const visitors = rule.create({
        report: (info) => reports.push(info),
      });

      const literal = { type: 'Literal', value: 0 };
      const prop = {
        type: 'Property',
        key: { type: 'Identifier', name: 'margin' },
        value: literal,
      };
      literal.parent = prop;

      visitors['Property > Literal'](literal);
      expect(reports.length).toBe(0);
    });

    it('suggests borderRadius token for borderRadius property', () => {
      const reports = [];
      const visitors = rule.create({
        report: (info) => reports.push(info),
      });

      const literal = { type: 'Literal', value: '8px' };
      const prop = {
        type: 'Property',
        key: { type: 'Identifier', name: 'borderRadius' },
        value: literal,
      };
      literal.parent = prop;

      visitors['Property > Literal'](literal);
      expect(reports.length).toBe(1);
      expect(reports[0].data.suggestion).toContain('var(--radius-md)');
    });
  });

  // ── Typography Detection ─────────────────────────────────────────────────

  describe('typography detection', () => {
    it('reports hardcoded font-family', () => {
      const reports = [];
      const visitors = rule.create({
        report: (info) => reports.push(info),
      });

      const literal = { type: 'Literal', value: 'Arial, sans-serif' };
      const prop = {
        type: 'Property',
        key: { type: 'Identifier', name: 'fontFamily' },
        value: literal,
      };
      literal.parent = prop;

      visitors['Property > Literal'](literal);
      expect(reports.length).toBe(1);
      expect(reports[0].data.category).toBe('typography');
    });

    it('reports hardcoded font-size with token suggestion', () => {
      const reports = [];
      const visitors = rule.create({
        report: (info) => reports.push(info),
      });

      const literal = { type: 'Literal', value: '14px' };
      const prop = {
        type: 'Property',
        key: { type: 'Identifier', name: 'fontSize' },
        value: literal,
      };
      literal.parent = prop;

      visitors['Property > Literal'](literal);
      expect(reports.length).toBe(1);
      expect(reports[0].data.suggestion).toContain('var(--typography-font-size-sm)');
    });

    it('reports numeric font-weight with token suggestion', () => {
      const reports = [];
      const visitors = rule.create({
        report: (info) => reports.push(info),
      });

      const literal = { type: 'Literal', value: '700' };
      const prop = {
        type: 'Property',
        key: { type: 'Identifier', name: 'fontWeight' },
        value: literal,
      };
      literal.parent = prop;

      visitors['Property > Literal'](literal);
      expect(reports.length).toBe(1);
      expect(reports[0].data.suggestion).toContain('var(--typography-font-weight-bold)');
    });

    it('allows inherit/initial/unset for font properties', () => {
      const allowedValues = ['inherit', 'initial', 'unset'];

      for (const val of allowedValues) {
        const reports = [];
        const visitors = rule.create({
          report: (info) => reports.push(info),
        });

        const literal = { type: 'Literal', value: val };
        const prop = {
          type: 'Property',
          key: { type: 'Identifier', name: 'fontSize' },
          value: literal,
        };
        literal.parent = prop;

        visitors['Property > Literal'](literal);
        expect(reports.length).toBe(0);
      }
    });

    it('allows var() for font properties', () => {
      const reports = [];
      const visitors = rule.create({
        report: (info) => reports.push(info),
      });

      const literal = { type: 'Literal', value: 'var(--typography-font-size-base)' };
      const prop = {
        type: 'Property',
        key: { type: 'Identifier', name: 'fontSize' },
        value: literal,
      };
      literal.parent = prop;

      visitors['Property > Literal'](literal);
      expect(reports.length).toBe(0);
    });

    it('reports hardcoded lineHeight', () => {
      const reports = [];
      const visitors = rule.create({
        report: (info) => reports.push(info),
      });

      const literal = { type: 'Literal', value: 1.5 };
      const prop = {
        type: 'Property',
        key: { type: 'Identifier', name: 'lineHeight' },
        value: literal,
      };
      literal.parent = prop;

      visitors['Property > Literal'](literal);
      expect(reports.length).toBe(1);
      expect(reports[0].data.category).toBe('typography');
    });
  });

  // ── Unmonitored Properties ───────────────────────────────────────────────

  describe('unmonitored properties', () => {
    it('ignores non-style properties', () => {
      const reports = [];
      const visitors = rule.create({
        report: (info) => reports.push(info),
      });

      const literal = { type: 'Literal', value: '#FF0000' };
      const prop = {
        type: 'Property',
        key: { type: 'Identifier', name: 'id' },
        value: literal,
      };
      literal.parent = prop;

      visitors['Property > Literal'](literal);
      expect(reports.length).toBe(0);
    });

    it('ignores non-Property parent nodes', () => {
      const reports = [];
      const visitors = rule.create({
        report: (info) => reports.push(info),
      });

      const literal = { type: 'Literal', value: '#FF0000' };
      const prop = {
        type: 'ArrayExpression',
        value: literal,
      };
      literal.parent = prop;

      visitors['Property > Literal'](literal);
      expect(reports.length).toBe(0);
    });
  });

  // ── Suggestion (Autofix) ─────────────────────────────────────────────────

  describe('autofix suggestions', () => {
    it('provides suggestion with fix function for known color token', () => {
      const reports = [];
      const visitors = rule.create({
        report: (info) => reports.push(info),
      });

      const literal = { type: 'Literal', value: '#0066CC' };
      const prop = {
        type: 'Property',
        key: { type: 'Identifier', name: 'color' },
        value: literal,
      };
      literal.parent = prop;

      visitors['Property > Literal'](literal);
      expect(reports.length).toBe(1);
      expect(reports[0].suggest).toBeDefined();
      expect(reports[0].suggest[0].desc).toContain('var(--color-primary-600)');
    });

    it('provides suggestion with fix function for known spacing token', () => {
      const reports = [];
      const visitors = rule.create({
        report: (info) => reports.push(info),
      });

      const literal = { type: 'Literal', value: '24px' };
      const prop = {
        type: 'Property',
        key: { type: 'Identifier', name: 'gap' },
        value: literal,
      };
      literal.parent = prop;

      visitors['Property > Literal'](literal);
      expect(reports.length).toBe(1);
      expect(reports[0].suggest).toBeDefined();
      expect(reports[0].suggest[0].desc).toContain('var(--spacing-lg)');
    });

    it('does not provide suggestion for unknown values', () => {
      const reports = [];
      const visitors = rule.create({
        report: (info) => reports.push(info),
      });

      const literal = { type: 'Literal', value: '#ABCDEF' };
      const prop = {
        type: 'Property',
        key: { type: 'Identifier', name: 'color' },
        value: literal,
      };
      literal.parent = prop;

      visitors['Property > Literal'](literal);
      expect(reports.length).toBe(1);
      expect(reports[0].suggest).toBeUndefined();
    });
  });
});
