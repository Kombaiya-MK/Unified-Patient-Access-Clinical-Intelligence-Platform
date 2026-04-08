/**
 * Code Search Box Component
 * @module components/medical-coding/CodeSearchBox
 * @description Searchable input for finding ICD-10/CPT codes
 * @epic EP-006
 * @story US-032
 */

import React, { useState, useCallback } from 'react';
import { useMedicalCoding } from '../../hooks/useMedicalCoding';
import type { CodeSearchResult } from '../../types/clinicalProfile.types';

interface CodeSearchBoxProps {
  appointmentId: string;
  onSelect?: (code: CodeSearchResult) => void;
}

export const CodeSearchBox: React.FC<CodeSearchBoxProps> = ({ onSelect }) => {
  const { searchCodes } = useMedicalCoding();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CodeSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    setSearching(true);
    try {
      const found = await searchCodes(searchQuery);
      setResults(found);
      setShowResults(true);
    } finally {
      setSearching(false);
    }
  }, [searchCodes]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    // Debounce calls
    const timer = setTimeout(() => handleSearch(value), 300);
    return () => clearTimeout(timer);
  };

  return (
    <div style={{ position: 'relative', marginBottom: '1rem' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="search"
          value={query}
          onChange={handleInputChange}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Search ICD-10 or CPT codes..."
          aria-label="Search medical codes"
          style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            paddingLeft: '2rem',
            border: '1px solid #D1D5DB',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            boxSizing: 'border-box',
          }}
        />
        <span style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}>🔍</span>
        {searching && (
          <span style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', fontSize: '0.75rem' }}>
            Searching...
          </span>
        )}
      </div>

      {showResults && results.length > 0 && (
        <ul
          role="listbox"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 50,
            maxHeight: '300px',
            overflowY: 'auto',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '0.375rem',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            margin: 0,
            padding: 0,
            listStyle: 'none',
          }}
        >
          {results.map(result => (
            <li
              key={`${result.code_type}-${result.code}`}
              role="option"
              onClick={() => { onSelect?.(result); setShowResults(false); setQuery(''); }}
              style={{
                padding: '0.5rem 0.75rem',
                cursor: 'pointer',
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
                borderBottom: '1px solid #F3F4F6',
              }}
              onMouseEnter={e => { (e.target as HTMLElement).style.backgroundColor = '#F3F4F6'; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.backgroundColor = '#FFFFFF'; }}
            >
              <span style={{
                padding: '0.125rem 0.375rem',
                borderRadius: '0.25rem',
                fontSize: '0.6875rem',
                fontWeight: 600,
                backgroundColor: result.code_type === 'ICD-10' ? '#EDE9FE' : '#FEF3C7',
                color: result.code_type === 'ICD-10' ? '#5B21B6' : '#92400E',
                flexShrink: 0,
              }}>
                {result.code_type}
              </span>
              <span style={{ fontFamily: 'monospace', fontWeight: 500, fontSize: '0.875rem', flexShrink: 0 }}>{result.code}</span>
              <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>{result.description}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
