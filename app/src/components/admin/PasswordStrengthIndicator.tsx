/**
 * PasswordStrengthIndicator Component
 * 
 * Real-time password strength meter showing Weak/Medium/Strong.
 * Evaluates based on length, uppercase, number, special char.
 * 
 * @module PasswordStrengthIndicator
 * @task US_035 TASK_002
 */

import React from 'react';

interface PasswordStrengthIndicatorProps {
  password: string;
}

type Strength = 'weak' | 'medium' | 'strong';

function calculateStrength(password: string): { strength: Strength; score: number } {
  if (!password) return { strength: 'weak', score: 0 };

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[@$!%*?&]/.test(password)) score++;

  if (score <= 1) return { strength: 'weak', score };
  if (score <= 3) return { strength: 'medium', score };
  return { strength: 'strong', score };
}

const STRENGTH_CONFIG: Record<Strength, { color: string; width: string; label: string }> = {
  weak: { color: '#ef4444', width: '33%', label: 'Weak' },
  medium: { color: '#f59e0b', width: '66%', label: 'Medium' },
  strong: { color: '#22c55e', width: '100%', label: 'Strong' },
};

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  if (!password) return null;

  const { strength } = calculateStrength(password);
  const config = STRENGTH_CONFIG[strength];

  return (
    <div style={{ marginTop: '4px' }} aria-live="polite">
      <div
        style={{
          height: '4px',
          backgroundColor: '#e5e7eb',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: config.width,
            backgroundColor: config.color,
            borderRadius: '2px',
            transition: 'width 0.3s, background-color 0.3s',
          }}
          role="progressbar"
          aria-valuenow={strength === 'weak' ? 33 : strength === 'medium' ? 66 : 100}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Password strength: ${config.label}`}
        />
      </div>
      <span style={{ fontSize: '0.7rem', color: config.color, fontWeight: 500 }}>
        {config.label}
      </span>
    </div>
  );
};
