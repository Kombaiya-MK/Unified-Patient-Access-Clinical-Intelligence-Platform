import type { Meta, StoryObj } from '@storybook/react';
import { TokenRow, Section } from './TokenShowcase';

const meta: Meta = {
  title: 'Design Tokens/Typography',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Typography tokens for font families, sizes, weights, line heights, and letter spacing. Based on the Inter typeface for optimal screen readability in clinical UIs.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

/* ── Token data ── */

const fontFamilies = [
  { name: 'Heading', cssVar: '--typography-font-family-heading', value: "Inter, -apple-system, …, sans-serif" },
  { name: 'Body', cssVar: '--typography-font-family-body', value: "Inter, -apple-system, …, sans-serif" },
  { name: 'Mono', cssVar: '--typography-font-family-mono', value: "Fira Code, Consolas, …, monospace" },
];

const fontSizes = [
  { name: 'xs', cssVar: '--typography-font-size-xs', value: '12px', usage: 'Caption, helper text' },
  { name: 'sm', cssVar: '--typography-font-size-sm', value: '14px', usage: 'Body small, labels' },
  { name: 'base', cssVar: '--typography-font-size-base', value: '16px', usage: 'Default body text' },
  { name: 'lg', cssVar: '--typography-font-size-lg', value: '18px', usage: 'Body large, H4' },
  { name: 'xl', cssVar: '--typography-font-size-xl', value: '20px', usage: 'H3' },
  { name: '2xl', cssVar: '--typography-font-size-2xl', value: '24px', usage: 'H2' },
  { name: '3xl', cssVar: '--typography-font-size-3xl', value: '32px', usage: 'H1 page titles' },
  { name: '4xl', cssVar: '--typography-font-size-4xl', value: '48px', usage: 'Display large' },
];

const fontWeights = [
  { name: 'Regular', cssVar: '--typography-font-weight-regular', value: '400', usage: 'Body text' },
  { name: 'Medium', cssVar: '--typography-font-weight-medium', value: '500', usage: 'Labels, emphasis' },
  { name: 'Semibold', cssVar: '--typography-font-weight-semibold', value: '600', usage: 'Headings' },
  { name: 'Bold', cssVar: '--typography-font-weight-bold', value: '700', usage: 'Display, H1' },
];

const lineHeights = [
  { name: 'Tight', cssVar: '--typography-line-height-tight', value: '1.2' },
  { name: 'Snug', cssVar: '--typography-line-height-snug', value: '1.25' },
  { name: 'Normal', cssVar: '--typography-line-height-normal', value: '1.33' },
  { name: 'Relaxed', cssVar: '--typography-line-height-relaxed', value: '1.43' },
  { name: 'Loose', cssVar: '--typography-line-height-loose', value: '1.5' },
  { name: 'Spacious', cssVar: '--typography-line-height-spacious', value: '1.56' },
  { name: 'Extra', cssVar: '--typography-line-height-extra', value: '1.8' },
];

const letterSpacings = [
  { name: 'Tight', cssVar: '--typography-letter-spacing-tight', value: '-0.5px' },
  { name: 'Snug', cssVar: '--typography-letter-spacing-snug', value: '-0.25px' },
  { name: 'Normal', cssVar: '--typography-letter-spacing-normal', value: '0px' },
  { name: 'Wide', cssVar: '--typography-letter-spacing-wide', value: '0.1px' },
  { name: 'Wider', cssVar: '--typography-letter-spacing-wider', value: '0.18px' },
  { name: 'Widest', cssVar: '--typography-letter-spacing-widest', value: '1px' },
];

/* ── Stories ── */

export const FontFamilies: Story = {
  render: () => (
    <Section title="Font Families">
      {fontFamilies.map((t) => (
        <TokenRow
          key={t.cssVar}
          name={t.name}
          cssVar={t.cssVar}
          value={t.value}
          preview={
            <span style={{ fontFamily: `var(${t.cssVar})`, fontSize: '20px' }}>
              Aa Bb Cc 123
            </span>
          }
        />
      ))}
    </Section>
  ),
};

export const FontSizes: Story = {
  render: () => (
    <Section title="Font Sizes">
      {fontSizes.map((t) => (
        <TokenRow
          key={t.cssVar}
          name={`${t.name} — ${t.usage}`}
          cssVar={t.cssVar}
          value={t.value}
          preview={
            <span style={{ fontSize: t.value, lineHeight: 1.2, whiteSpace: 'nowrap' }}>
              Patient Record
            </span>
          }
        />
      ))}
    </Section>
  ),
};

export const FontWeights: Story = {
  render: () => (
    <Section title="Font Weights">
      {fontWeights.map((t) => (
        <TokenRow
          key={t.cssVar}
          name={`${t.name} — ${t.usage}`}
          cssVar={t.cssVar}
          value={t.value}
          preview={
            <span style={{ fontWeight: Number(t.value), fontSize: '18px' }}>
              Appointment Scheduled
            </span>
          }
        />
      ))}
    </Section>
  ),
};

export const LineHeights: Story = {
  render: () => (
    <Section title="Line Heights">
      {lineHeights.map((t) => (
        <TokenRow
          key={t.cssVar}
          name={t.name}
          cssVar={t.cssVar}
          value={t.value}
          preview={
            <div
              style={{
                lineHeight: t.value,
                fontSize: '14px',
                width: '180px',
                backgroundColor: '#E6F0FA',
                padding: '4px 8px',
                borderRadius: '4px',
              }}
            >
              Multi-line text sample for line height preview
            </div>
          }
        />
      ))}
    </Section>
  ),
};

export const LetterSpacing: Story = {
  render: () => (
    <Section title="Letter Spacing">
      {letterSpacings.map((t) => (
        <TokenRow
          key={t.cssVar}
          name={t.name}
          cssVar={t.cssVar}
          value={t.value}
          preview={
            <span
              style={{
                letterSpacing: t.value,
                fontSize: '16px',
                textTransform: t.name === 'Widest' ? 'uppercase' : undefined,
              }}
            >
              Clinical Dashboard
            </span>
          }
        />
      ))}
    </Section>
  ),
};

export const TypeScale: Story = {
  render: () => (
    <Section title="Type Scale Preview">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '48px', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.5px' }}>
          Display (4xl / Bold)
        </div>
        <div style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.25px' }}>
          H1 – Page Title (3xl / Bold)
        </div>
        <div style={{ fontSize: '24px', fontWeight: 600, lineHeight: 1.33 }}>
          H2 – Section Heading (2xl / Semibold)
        </div>
        <div style={{ fontSize: '20px', fontWeight: 600, lineHeight: 1.43 }}>
          H3 – Sub-section (xl / Semibold)
        </div>
        <div style={{ fontSize: '18px', fontWeight: 500, lineHeight: 1.33 }}>
          H4 – Card Title (lg / Medium)
        </div>
        <div style={{ fontSize: '16px', fontWeight: 400, lineHeight: 1.5 }}>
          Body – Default text size used for paragraphs and form inputs. (base / Regular)
        </div>
        <div style={{ fontSize: '14px', fontWeight: 400, lineHeight: 1.43 }}>
          Body Small – Table cells, sidebar labels, helper. (sm / Regular)
        </div>
        <div style={{ fontSize: '12px', fontWeight: 400, lineHeight: 1.33, color: '#666' }}>
          Caption – Timestamps, meta info, fine print. (xs / Regular)
        </div>
      </div>
    </Section>
  ),
};
