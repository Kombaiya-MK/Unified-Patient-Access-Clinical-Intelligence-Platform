import { useState, type CSSProperties, type ReactNode } from 'react';

/* ── Types ── */

export interface TokenEntry {
  name: string;
  cssVar: string;
  scssVar: string;
  value: string;
  description?: string;
}

/* ── Copy Button ── */

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable in some contexts */
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
        fontSize: '11px',
        cursor: 'pointer',
        lineHeight: '1.4',
        whiteSpace: 'nowrap',
      }}
      aria-label={`Copy ${label}`}
    >
      {copied ? '✓' : label}
    </button>
  );
}

/* ── Code Snippet Row ── */

function CodeSnippet({ cssVar, scssVar }: { cssVar: string; scssVar: string }) {
  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
      <code style={{ fontSize: '11px', color: '#4D4D4D', background: '#F5F5F5', padding: '1px 4px', borderRadius: '3px' }}>
        var({cssVar})
      </code>
      <CopyButton text={`var(${cssVar})`} label="CSS" />
      <code style={{ fontSize: '11px', color: '#4D4D4D', background: '#F5F5F5', padding: '1px 4px', borderRadius: '3px' }}>
        {scssVar}
      </code>
      <CopyButton text={scssVar} label="SCSS" />
    </div>
  );
}

/* ── Contrast helpers ── */

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
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function contrastBadge(ratio: number): { text: string; color: string } {
  if (ratio >= 7) {
    return { text: `AAA ${ratio.toFixed(1)}:1`, color: '#007A3D' };
  }
  if (ratio >= 4.5) {
    return { text: `AA ${ratio.toFixed(1)}:1`, color: '#0066CC' };
  }
  if (ratio >= 3) {
    return { text: `AA-lg ${ratio.toFixed(1)}:1`, color: '#CC6600' };
  }
  return { text: `Fail ${ratio.toFixed(1)}:1`, color: '#DC3545' };
}

/* ── TokenTable ── */

interface TokenTableProps {
  tokens: TokenEntry[];
  renderExample: (token: TokenEntry) => ReactNode;
}

export function TokenTable({ tokens, renderExample }: TokenTableProps) {
  const cell: CSSProperties = {
    padding: '10px 12px',
    borderBottom: '1px solid #f0f0f0',
    verticalAlign: 'middle',
    fontSize: '13px',
  };

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: '2px solid #e5e5e5', textAlign: 'left' }}>
          <th style={{ ...cell, fontWeight: 600 }}>Preview</th>
          <th style={{ ...cell, fontWeight: 600 }}>Token</th>
          <th style={{ ...cell, fontWeight: 600 }}>Value</th>
          <th style={{ ...cell, fontWeight: 600 }}>Code Snippet</th>
        </tr>
      </thead>
      <tbody>
        {tokens.map((token) => (
          <tr key={token.cssVar}>
            <td style={cell}>{renderExample(token)}</td>
            <td style={cell}>
              <div style={{ fontWeight: 600 }}>{token.name}</div>
              {token.description && (
                <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>{token.description}</div>
              )}
            </td>
            <td style={{ ...cell, fontFamily: 'monospace' }}>{token.value}</td>
            <td style={cell}>
              <CodeSnippet cssVar={token.cssVar} scssVar={token.scssVar} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ── Color Swatch for use inside TokenTable ── */

export function ColorSwatch({ color, size = 40 }: { color: string; size?: number }) {
  const ratio = contrastRatio(color, '#FFFFFF');
  const badge = contrastBadge(ratio);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '6px',
          backgroundColor: color,
          border: '1px solid #e5e5e5',
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: '10px', fontWeight: 600, color: badge.color, whiteSpace: 'nowrap' }}>
        {badge.text}
      </span>
    </div>
  );
}

/* ── Spacing Box ── */

export function SpacingBox({ size }: { size: string }) {
  const px = parseInt(size, 10);
  return (
    <div
      style={{
        width: `${Math.min(px, 120)}px`,
        height: '20px',
        backgroundColor: 'var(--color-primary-400, #66A3E0)',
        borderRadius: '3px',
      }}
    />
  );
}

/* ── Radius Box ── */

export function RadiusBox({ radius }: { radius: string }) {
  return (
    <div
      style={{
        width: '60px',
        height: '60px',
        borderRadius: radius,
        backgroundColor: '#E6F0FA',
        border: '2px solid #0066CC',
      }}
    />
  );
}

/* ── Shadow Card ── */

export function ShadowCard({ shadow }: { shadow: string }) {
  return (
    <div
      style={{
        width: '120px',
        height: '72px',
        borderRadius: '8px',
        backgroundColor: '#fff',
        border: '1px solid #f0f0f0',
        boxShadow: shadow === 'none' ? 'none' : shadow,
      }}
    />
  );
}

/* ── Typography Specimen ── */

export function TypographySpecimen({
  fontSize,
  fontWeight,
  fontFamily,
  text = 'The quick brown fox jumps',
}: {
  fontSize?: string;
  fontWeight?: string;
  fontFamily?: string;
  text?: string;
}) {
  return (
    <span
      style={{
        fontSize: fontSize || undefined,
        fontWeight: fontWeight ? Number(fontWeight) : undefined,
        fontFamily: fontFamily || undefined,
        lineHeight: 1.3,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  );
}
