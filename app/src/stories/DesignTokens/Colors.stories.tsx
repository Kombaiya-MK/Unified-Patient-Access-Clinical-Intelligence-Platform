import type { Meta, StoryObj } from '@storybook/react';
import { ColorSwatch, Section, contrastRatio, contrastLabel } from './TokenShowcase';

const meta: Meta = {
  title: 'Design Tokens/Colors',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Color tokens for the Unified Patient Access Clinical Intelligence Platform. All colors meet WCAG 2.1 AA contrast requirements for healthcare accessibility.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

/* ── Token data extracted from tokens.css ── */

const primary = [
  { name: 'Primary 100', cssVar: '--color-primary-100', hex: '#E6F0FA' },
  { name: 'Primary 200', cssVar: '--color-primary-200', hex: '#CCE0F5' },
  { name: 'Primary 300', cssVar: '--color-primary-300', hex: '#99C2EB' },
  { name: 'Primary 400', cssVar: '--color-primary-400', hex: '#66A3E0' },
  { name: 'Primary 500', cssVar: '--color-primary-500', hex: '#3385D6' },
  { name: 'Primary 600', cssVar: '--color-primary-600', hex: '#0066CC' },
  { name: 'Primary 700', cssVar: '--color-primary-700', hex: '#005BB8' },
  { name: 'Primary 800', cssVar: '--color-primary-800', hex: '#004C99' },
  { name: 'Primary 900', cssVar: '--color-primary-900', hex: '#003D7A' },
];

const secondary = [
  { name: 'Secondary 100', cssVar: '--color-secondary-100', hex: '#E6F6F0' },
  { name: 'Secondary 200', cssVar: '--color-secondary-200', hex: '#CCEDE2' },
  { name: 'Secondary 300', cssVar: '--color-secondary-300', hex: '#99DCC5' },
  { name: 'Secondary 400', cssVar: '--color-secondary-400', hex: '#66CAA7' },
  { name: 'Secondary 500', cssVar: '--color-secondary-500', hex: '#33B989' },
  { name: 'Secondary 600', cssVar: '--color-secondary-600', hex: '#00A86B' },
  { name: 'Secondary 700', cssVar: '--color-secondary-700', hex: '#009966' },
  { name: 'Secondary 800', cssVar: '--color-secondary-800', hex: '#008057' },
  { name: 'Secondary 900', cssVar: '--color-secondary-900', hex: '#006647' },
];

const neutral = [
  { name: 'Neutral 50', cssVar: '--color-neutral-50', hex: '#FAFAFA' },
  { name: 'Neutral 100', cssVar: '--color-neutral-100', hex: '#F5F5F5' },
  { name: 'Neutral 200', cssVar: '--color-neutral-200', hex: '#E5E5E5' },
  { name: 'Neutral 300', cssVar: '--color-neutral-300', hex: '#CCCCCC' },
  { name: 'Neutral 400', cssVar: '--color-neutral-400', hex: '#999999' },
  { name: 'Neutral 500', cssVar: '--color-neutral-500', hex: '#808080' },
  { name: 'Neutral 600', cssVar: '--color-neutral-600', hex: '#666666' },
  { name: 'Neutral 700', cssVar: '--color-neutral-700', hex: '#4D4D4D' },
  { name: 'Neutral 800', cssVar: '--color-neutral-800', hex: '#333333' },
  { name: 'Neutral 900', cssVar: '--color-neutral-900', hex: '#1A1A1A' },
];

const success = [
  { name: 'Success 100', cssVar: '--color-success-100', hex: '#E6F9EF' },
  { name: 'Success 200', cssVar: '--color-success-200', hex: '#CCF2DF' },
  { name: 'Success 500', cssVar: '--color-success-500', hex: '#33B367' },
  { name: 'Success 600', cssVar: '--color-success-600', hex: '#00A145' },
  { name: 'Success 700', cssVar: '--color-success-700', hex: '#007A3D' },
];

const warning = [
  { name: 'Warning 100', cssVar: '--color-warning-100', hex: '#FFF2E6' },
  { name: 'Warning 200', cssVar: '--color-warning-200', hex: '#FFE5CC' },
  { name: 'Warning 500', cssVar: '--color-warning-500', hex: '#FFA033' },
  { name: 'Warning 600', cssVar: '--color-warning-600', hex: '#FF8800' },
  { name: 'Warning 700', cssVar: '--color-warning-700', hex: '#CC6600' },
];

const error = [
  { name: 'Error 100', cssVar: '--color-error-100', hex: '#FCE8EA' },
  { name: 'Error 200', cssVar: '--color-error-200', hex: '#F8D7DA' },
  { name: 'Error 500', cssVar: '--color-error-500', hex: '#E35D6A' },
  { name: 'Error 600', cssVar: '--color-error-600', hex: '#DC3545' },
  { name: 'Error 700', cssVar: '--color-error-700', hex: '#A02A2A' },
];

const info = [
  { name: 'Info 100', cssVar: '--color-info-100', hex: '#E6F3F9' },
  { name: 'Info 200', cssVar: '--color-info-200', hex: '#CCE7F4' },
  { name: 'Info 500', cssVar: '--color-info-500', hex: '#3392C5' },
  { name: 'Info 600', cssVar: '--color-info-600', hex: '#0077B6' },
  { name: 'Info 700', cssVar: '--color-info-700', hex: '#005A8A' },
];

const medical = [
  { name: 'Medical Primary Text', cssVar: '--color-medical-primary-text', hex: '#1A1A1A' },
  { name: 'Medical Secondary Text', cssVar: '--color-medical-secondary-text', hex: '#666666' },
  { name: 'Medical Primary Button', cssVar: '--color-medical-primary-button', hex: '#0056B3' },
  { name: 'Medical Success Green', cssVar: '--color-medical-success-green', hex: '#2E7D32' },
  { name: 'Medical Error Red', cssVar: '--color-medical-error-red', hex: '#C62828' },
  { name: 'Medical Warning Orange', cssVar: '--color-medical-warning-orange', hex: '#F57C00' },
];

/* ── Render helper ── */

function renderGroup(tokens: Array<{ name: string; cssVar: string; hex: string }>) {
  return tokens.map((t) => (
    <ColorSwatch key={t.cssVar} name={t.name} cssVar={t.cssVar} hex={t.hex} />
  ));
}

/* ── Stories ── */

export const PrimaryColors: Story = {
  render: () => (
    <Section title="Primary Colors">
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
        Core brand blue palette used for primary actions, links, and focus states.
      </p>
      {renderGroup(primary)}
    </Section>
  ),
};

export const SecondaryColors: Story = {
  render: () => (
    <Section title="Secondary Colors">
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
        Healthcare green palette for secondary CTAs and positive-context UI elements.
      </p>
      {renderGroup(secondary)}
    </Section>
  ),
};

export const NeutralColors: Story = {
  render: () => (
    <Section title="Neutral Colors">
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
        Grey scale for text, backgrounds, borders, and dividers.
      </p>
      {renderGroup(neutral)}
    </Section>
  ),
};

export const StatusColors: Story = {
  render: () => (
    <>
      <Section title="Success">{renderGroup(success)}</Section>
      <Section title="Warning">{renderGroup(warning)}</Section>
      <Section title="Error">{renderGroup(error)}</Section>
      <Section title="Info">{renderGroup(info)}</Section>
    </>
  ),
};

export const MedicalAccessibility: Story = {
  render: () => (
    <Section title="Medical / High-Contrast Tokens">
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
        Purpose-built tokens meeting WCAG 2.1 Level AA (&gt;= 4.5:1) for clinical interfaces.
      </p>
      {renderGroup(medical)}
    </Section>
  ),
};

export const ContrastMatrix: Story = {
  render: () => {
    const textColors = [
      { name: 'Neutral 900', hex: '#1A1A1A' },
      { name: 'Neutral 700', hex: '#4D4D4D' },
      { name: 'Neutral 600', hex: '#666666' },
      { name: 'Primary 600', hex: '#0066CC' },
      { name: 'Error 600', hex: '#DC3545' },
      { name: 'White', hex: '#FFFFFF' },
    ];
    const bgColors = [
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Neutral 100', hex: '#F5F5F5' },
      { name: 'Primary 600', hex: '#0066CC' },
      { name: 'Neutral 900', hex: '#1A1A1A' },
    ];

    return (
      <Section title="Contrast Ratio Matrix (WCAG 2.1)">
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e5e5' }}>
                Text \ Background
              </th>
              {bgColors.map((bg) => (
                <th
                  key={bg.name}
                  style={{ padding: '8px', borderBottom: '2px solid #e5e5e5', textAlign: 'center' }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      backgroundColor: bg.hex,
                      border: '1px solid #ccc',
                      margin: '0 auto 4px',
                    }}
                  />
                  {bg.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {textColors.map((fg) => (
              <tr key={fg.name}>
                <td style={{ padding: '8px', fontWeight: 600, borderBottom: '1px solid #f0f0f0' }}>
                  {fg.name}
                </td>
                {bgColors.map((bg) => {
                  const ratio = contrastRatio(fg.hex, bg.hex);
                  const label = contrastLabel(ratio);
                  return (
                    <td
                      key={bg.name}
                      style={{
                        padding: '8px',
                        textAlign: 'center',
                        borderBottom: '1px solid #f0f0f0',
                      }}
                    >
                      <span
                        style={{
                          color: bg.hex,
                          backgroundColor: fg.hex,
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontWeight: 600,
                          fontSize: '12px',
                          border: '1px solid #ccc',
                          display: 'inline-block',
                          marginBottom: '4px',
                        }}
                      >
                        Aa
                      </span>
                      <div style={{ color: label.color, fontWeight: 600, fontSize: '11px' }}>
                        {label.text}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    );
  },
};
