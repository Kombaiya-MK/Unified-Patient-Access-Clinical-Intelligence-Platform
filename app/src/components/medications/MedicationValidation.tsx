/**
 * Medication Validation Component
 * @module components/medications/MedicationValidation
 * @description Autocomplete input for medication validation with debounce
 * @epic EP-006
 * @story US-033
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { ValidateMedicationResult } from '../../types/clinicalProfile.types';
import { useConflictCheck } from '../../hooks/useConflictCheck';

interface MedicationValidationProps {
  onSelect?: (medication: ValidateMedicationResult) => void;
}

export const MedicationValidation: React.FC<MedicationValidationProps> = ({ onSelect }) => {
  const { validateMedication, validationResult, validating } = useConflictCheck();
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length >= 2) {
      debounceRef.current = setTimeout(() => {
        validateMedication(value);
        setShowSuggestions(true);
      }, 300);
    } else {
      setShowSuggestions(false);
    }
  }, [validateMedication]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSelect = (result: ValidateMedicationResult) => {
    setQuery(result.normalized_name || query);
    setShowSuggestions(false);
    onSelect?.(result);
  };

  return (
    <div style={{ position: 'relative' }}>
      <label htmlFor="med-validation" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
        Validate Medication
      </label>
      <input
        id="med-validation"
        type="text"
        value={query}
        onChange={handleChange}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder="Type medication name..."
        style={{
          width: '100%',
          padding: '0.5rem 0.75rem',
          border: '1px solid #D1D5DB',
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          boxSizing: 'border-box',
        }}
        aria-label="Validate medication name"
        autoComplete="off"
      />
      {validating && (
        <span style={{ position: 'absolute', right: '0.5rem', top: '2.25rem', color: '#9CA3AF', fontSize: '0.75rem' }}>Validating...</span>
      )}

      {showSuggestions && validationResult && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 50,
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '0.375rem',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          padding: '0.75rem',
          marginTop: '0.25rem',
        }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
              {validationResult.is_recognized ? '✅ Recognized' : '⚠️ Not recognized'}
            </span>
            {validationResult.normalized_name && (
              <span style={{ fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                → {validationResult.normalized_name}
              </span>
            )}
          </div>
          {validationResult.suggestions && validationResult.suggestions.length > 0 && (
            <div>
              <div style={{ fontSize: '0.6875rem', color: '#6B7280', marginBottom: '0.25rem' }}>Did you mean:</div>
              {validationResult.suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect({ ...validationResult, normalized_name: suggestion.name })}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.375rem 0.5rem',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                  }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.backgroundColor = '#F3F4F6'; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.backgroundColor = 'transparent'; }}
                >
                  {suggestion.name}
                  <span style={{ fontSize: '0.75rem', color: '#6B7280', marginLeft: '0.5rem' }}>
                    ({(suggestion.similarity * 100).toFixed(0)}% match)
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
