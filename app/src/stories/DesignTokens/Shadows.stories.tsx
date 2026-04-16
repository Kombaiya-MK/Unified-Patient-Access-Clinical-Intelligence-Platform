import type { Meta, StoryObj } from '@storybook/react';
import { ShadowCard, Section } from './TokenShowcase';

const meta: Meta = {
  title: 'Design Tokens/Shadows',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Elevation shadow tokens from Level 0 (flat) to Level 5 (maximum) plus focus-ring and button-active states. Used for depth hierarchy in clinical UIs.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

/* ── Token data ── */

const elevations = [
  { name: 'Level 0', cssVar: '--shadow-level-0', value: 'none', usage: 'Inline elements' },
  {
    name: 'Level 1',
    cssVar: '--shadow-level-1',
    value: '0px 1px 3px rgba(0,0,0,0.12), 0px 1px 2px rgba(0,0,0,0.24)',
    usage: 'Cards, list items',
  },
  {
    name: 'Level 2',
    cssVar: '--shadow-level-2',
    value: '0px 3px 6px rgba(0,0,0,0.15), 0px 2px 4px rgba(0,0,0,0.12)',
    usage: 'Dropdowns, popovers',
  },
  {
    name: 'Level 3',
    cssVar: '--shadow-level-3',
    value: '0px 10px 20px rgba(0,0,0,0.15), 0px 3px 6px rgba(0,0,0,0.10)',
    usage: 'Modals, drawers',
  },
  {
    name: 'Level 4',
    cssVar: '--shadow-level-4',
    value: '0px 15px 25px rgba(0,0,0,0.15), 0px 5px 10px rgba(0,0,0,0.05)',
    usage: 'Tooltips on modals',
  },
  {
    name: 'Level 5',
    cssVar: '--shadow-level-5',
    value: '0px 20px 40px rgba(0,0,0,0.2)',
    usage: 'Critical alerts',
  },
];

const specialShadows = [
  {
    name: 'Focus Ring',
    cssVar: '--shadow-focus-ring',
    value: '0 0 0 2px #FFFFFF, 0 0 0 4px #0066CC',
    usage: 'Keyboard focus indicator',
  },
  {
    name: 'Button Active',
    cssVar: '--shadow-button-active',
    value: 'inset 0px 2px 4px rgba(0,0,0,0.2)',
    usage: 'Button pressed state',
  },
];

/* ── Stories ── */

export const ElevationScale: Story = {
  render: () => (
    <Section title="Elevation Scale">
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
        Progressive shadow depth for visual hierarchy. Higher levels indicate elements closer to the
        user in z-space.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
        {elevations.map((s) => (
          <div key={s.cssVar}>
            <ShadowCard name={s.name} cssVar={s.cssVar} value={s.value} />
            <div style={{ fontSize: '12px', color: '#666', maxWidth: '160px', textAlign: 'center' }}>
              {s.usage}
            </div>
          </div>
        ))}
      </div>
    </Section>
  ),
};

export const SpecialShadows: Story = {
  render: () => (
    <Section title="Special Shadows">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
        <div>
          <div
            style={{
              width: '200px',
              height: '44px',
              borderRadius: '8px',
              border: '2px solid #0066CC',
              backgroundColor: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: specialShadows[0].value,
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Focus Ring
          </div>
          <code
            style={{ fontSize: '11px', color: '#666', display: 'block', marginTop: '8px' }}
          >
            {specialShadows[0].cssVar}
          </code>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
            {specialShadows[0].usage}
          </div>
        </div>

        <div>
          <button
            style={{
              width: '200px',
              height: '40px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#0066CC',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              boxShadow: specialShadows[1].value,
              cursor: 'pointer',
            }}
          >
            Active / Pressed
          </button>
          <code
            style={{ fontSize: '11px', color: '#666', display: 'block', marginTop: '8px' }}
          >
            {specialShadows[1].cssVar}
          </code>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
            {specialShadows[1].usage}
          </div>
        </div>
      </div>
    </Section>
  ),
};

export const UsageGuidelines: Story = {
  render: () => (
    <Section title="Shadow Usage Guidelines">
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '14px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e5e5e5' }}>
            <th style={{ textAlign: 'left', padding: '8px 12px' }}>Level</th>
            <th style={{ textAlign: 'left', padding: '8px 12px' }}>z-index Range</th>
            <th style={{ textAlign: 'left', padding: '8px 12px' }}>Use Case</th>
          </tr>
        </thead>
        <tbody>
          {[
            { level: '0', z: '0', use: 'Inline elements, no elevation needed' },
            { level: '1', z: '1–10', use: 'Cards, list items, subtle elevation' },
            { level: '2', z: '10–100', use: 'Dropdowns, popovers, menus' },
            { level: '3', z: '100–1000', use: 'Modals, drawers, overlays' },
            { level: '4', z: '1000–5000', use: 'Tooltips stacked on modals' },
            { level: '5', z: '5000+', use: 'Critical alerts, emergency banners' },
          ].map((row) => (
            <tr key={row.level} style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ padding: '8px 12px', fontWeight: 600 }}>Level {row.level}</td>
              <td style={{ padding: '8px 12px' }}><code>{row.z}</code></td>
              <td style={{ padding: '8px 12px' }}>{row.use}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  ),
};
