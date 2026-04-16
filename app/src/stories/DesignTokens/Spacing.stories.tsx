import type { Meta, StoryObj } from '@storybook/react';
import { SpacingBox, TokenRow, Section } from './TokenShowcase';

const meta: Meta = {
  title: 'Design Tokens/Spacing',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Spacing and border-radius tokens built on a 4px grid system. Consistent spacing ensures visual rhythm across the clinical interface.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

/* ── Token data ── */

const spacingTokens = [
  { name: 'xs', cssVar: '--spacing-xs', size: '4px' },
  { name: 'sm', cssVar: '--spacing-sm', size: '8px' },
  { name: 'md', cssVar: '--spacing-md', size: '12px' },
  { name: 'base', cssVar: '--spacing-base', size: '16px' },
  { name: 'lg', cssVar: '--spacing-lg', size: '24px' },
  { name: 'xl', cssVar: '--spacing-xl', size: '32px' },
  { name: '2xl', cssVar: '--spacing-2xl', size: '48px' },
  { name: '3xl', cssVar: '--spacing-3xl', size: '64px' },
  { name: '4xl', cssVar: '--spacing-4xl', size: '96px' },
];

const radiusTokens = [
  { name: 'none', cssVar: '--radius-none', value: '0px' },
  { name: 'sm', cssVar: '--radius-sm', value: '4px' },
  { name: 'md', cssVar: '--radius-md', value: '8px' },
  { name: 'lg', cssVar: '--radius-lg', value: '12px' },
  { name: 'xl', cssVar: '--radius-xl', value: '16px' },
  { name: 'full', cssVar: '--radius-full', value: '9999px' },
];

const sizeTokens = [
  { name: 'Button SM', cssVar: '--size-button-sm', value: '32px' },
  { name: 'Button MD', cssVar: '--size-button-md', value: '40px' },
  { name: 'Button LG', cssVar: '--size-button-lg', value: '48px' },
  { name: 'Input Height', cssVar: '--size-input-height', value: '44px' },
  { name: 'Icon SM', cssVar: '--size-icon-sm', value: '16px' },
  { name: 'Icon MD', cssVar: '--size-icon-md', value: '20px' },
  { name: 'Icon LG', cssVar: '--size-icon-lg', value: '24px' },
];

const breakpoints = [
  { name: 'Mobile', cssVar: '--breakpoint-mobile', value: '320px' },
  { name: 'Tablet', cssVar: '--breakpoint-tablet', value: '768px' },
  { name: 'Desktop', cssVar: '--breakpoint-desktop', value: '1024px' },
  { name: 'Wide', cssVar: '--breakpoint-wide', value: '1441px' },
];

/* ── Stories ── */

export const SpacingScale: Story = {
  render: () => (
    <Section title="Spacing Scale (4px Grid)">
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
        All spacing tokens follow a 4px base grid for consistent rhythm.
      </p>
      {spacingTokens.map((t) => (
        <SpacingBox key={t.cssVar} name={t.name} cssVar={t.cssVar} size={t.size} />
      ))}
    </Section>
  ),
};

export const BorderRadius: Story = {
  render: () => (
    <Section title="Border Radius">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
        {radiusTokens.map((t) => (
          <div key={t.cssVar} style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: t.value,
                backgroundColor: '#E6F0FA',
                border: '2px solid #0066CC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 600,
                color: '#0066CC',
              }}
            >
              {t.name}
            </div>
            <code style={{ fontSize: '11px', display: 'block', marginTop: '8px', color: '#666' }}>
              {t.cssVar}
            </code>
            <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '2px' }}>{t.value}</div>
          </div>
        ))}
      </div>
    </Section>
  ),
};

export const ComponentSizes: Story = {
  render: () => (
    <Section title="Component Sizes">
      {sizeTokens.map((t) => (
        <TokenRow
          key={t.cssVar}
          name={t.name}
          cssVar={t.cssVar}
          value={t.value}
          preview={
            <div
              style={{
                width: t.value,
                height: t.value,
                backgroundColor: '#CCE0F5',
                borderRadius: '4px',
                border: '1px dashed #0066CC',
              }}
            />
          }
        />
      ))}
    </Section>
  ),
};

export const Breakpoints: Story = {
  render: () => (
    <Section title="Breakpoints">
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
        Responsive breakpoints for mobile-first design.
      </p>
      {breakpoints.map((t) => (
        <TokenRow
          key={t.cssVar}
          name={t.name}
          cssVar={t.cssVar}
          value={t.value}
          preview={
            <div
              style={{
                width: `${Math.min(parseInt(t.value, 10) / 10, 120)}px`,
                height: '20px',
                backgroundColor: '#66A3E0',
                borderRadius: '4px',
              }}
            />
          }
        />
      ))}
    </Section>
  ),
};
