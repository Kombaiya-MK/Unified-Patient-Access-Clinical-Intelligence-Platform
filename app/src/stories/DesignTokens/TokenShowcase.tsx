import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

/* ── Contrast ratio helpers (WCAG 2.1 relative luminance) ── */

function hexToLinear(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return [
    toLinear(parseInt(clean.substring(0, 2), 16) / 255),
    toLinear(parseInt(clean.substring(2, 4), 16) / 255),
    toLinear(parseInt(clean.substring(4, 6), 16) / 255),
  ];
}

function luminance(hex: string): number {
  const [r, g, b] = hexToLinear(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(fg: string, bg: string): number {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function contrastLabel(ratio: number): { text: string; color: string } {
  if (ratio >= 7) return { text: `AAA (${ratio.toFixed(2)}:1)`, color: '#007A3D' };
  if (ratio >= 4.5) return { text: `AA (${ratio.toFixed(2)}:1)`, color: '#0066CC' };
  if (ratio >= 3) return { text: `AA-lg (${ratio.toFixed(2)}:1)`, color: '#CC6600' };
  return { text: `Fail (${ratio.toFixed(2)}:1)`, color: '#DC3545' };
}

/* ── Copy button ── */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard not available in some contexts */
    }
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        border: '1px solid var(--color-border-default, #ccc)',
        borderRadius: '4px',
        background: copied ? 'var(--color-bg-success, #E6F9EF)' : 'var(--color-bg-secondary, #f5f5f5)',
        padding: '2px 8px',
        fontSize: '12px',
        cursor: 'pointer',
        lineHeight: '1.4',
      }}
      aria-label={`Copy ${text}`}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

/* ── Color Swatch ── */

interface ColorSwatchProps {
  name: string;
  cssVar: string;
  hex: string;
  contrastBg?: string;
}

export function ColorSwatch({ name, cssVar, hex, contrastBg = '#FFFFFF' }: ColorSwatchProps) {
  const ratio = contrastRatio(hex, contrastBg);
  const label = contrastLabel(ratio);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '8px',
          backgroundColor: hex,
          border: '1px solid #e5e5e5',
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '14px' }}>{name}</div>
        <code style={{ fontSize: '12px', color: '#666' }}>{cssVar}</code>
      </div>
      <code style={{ fontSize: '13px', fontFamily: 'monospace', color: '#4D4D4D' }}>{hex}</code>
      <span
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: label.color,
          whiteSpace: 'nowrap',
        }}
      >
        {label.text}
      </span>
      <CopyButton text={`var(${cssVar})`} />
    </div>
  );
}

/* ── Token Row (generic) ── */

interface TokenRowProps {
  name: string;
  cssVar: string;
  value: string;
  preview?: ReactNode;
}

export function TokenRow({ name, cssVar, value, preview }: TokenRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '10px 0',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      {preview && <div style={{ flexShrink: 0 }}>{preview}</div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '14px' }}>{name}</div>
        <code style={{ fontSize: '12px', color: '#666' }}>{cssVar}</code>
      </div>
      <code style={{ fontSize: '13px', fontFamily: 'monospace', color: '#4D4D4D' }}>{value}</code>
      <CopyButton text={`var(${cssVar})`} />
    </div>
  );
}

/* ── Section Wrapper ── */

interface SectionProps {
  title: string;
  children: ReactNode;
}

export function Section({ title, children }: SectionProps) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <h3
        style={{
          fontSize: '18px',
          fontWeight: 600,
          borderBottom: '2px solid var(--color-primary-600, #0066CC)',
          paddingBottom: '8px',
          marginBottom: '16px',
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

/* ── Spacing Box ── */

interface SpacingBoxProps {
  name: string;
  cssVar: string;
  size: string;
}

export function SpacingBox({ name, cssVar, size }: SpacingBoxProps) {
  const px = parseInt(size, 10);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '6px 0' }}>
      <div
        style={{
          width: `${Math.min(px, 120)}px`,
          height: '24px',
          backgroundColor: 'var(--color-primary-400, #66A3E0)',
          borderRadius: '4px',
          flexShrink: 0,
        }}
      />
      <div style={{ minWidth: '60px', fontWeight: 600, fontSize: '14px' }}>{name}</div>
      <code style={{ fontSize: '13px', color: '#4D4D4D' }}>{size}</code>
      <code style={{ fontSize: '12px', color: '#666' }}>{cssVar}</code>
      <CopyButton text={`var(${cssVar})`} />
    </div>
  );
}

/* ── Shadow Card ── */

interface ShadowCardProps {
  name: string;
  cssVar: string;
  value: string;
}

export function ShadowCard({ name, cssVar, value }: ShadowCardProps) {
  const style: CSSProperties = {
    width: '160px',
    height: '100px',
    borderRadius: '8px',
    backgroundColor: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #f0f0f0',
    boxShadow: value === 'none' ? 'none' : value,
  };

  return (
    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
      <div style={style}>
        <div style={{ fontWeight: 600, fontSize: '14px' }}>{name}</div>
      </div>
      <div style={{ marginTop: '8px' }}>
        <code style={{ fontSize: '11px', color: '#666' }}>{cssVar}</code>
      </div>
      <CopyButton text={`var(${cssVar})`} />
    </div>
  );
}
