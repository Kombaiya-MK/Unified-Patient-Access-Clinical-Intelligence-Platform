/**
 * PatientSelector
 *
 * Inline search-and-select for staff/admin/doctor to pick a patient
 * before starting an intake workflow.
 */
import React, { useState, useEffect, useRef } from 'react';
import { getToken } from '../../utils/storage/tokenStorage';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface Patient {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
}

interface Props {
  onSelect: (patientId: string) => void;
}

export const PatientSelector: React.FC<Props> = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const token = getToken();
        const res = await fetch(
          `${API_BASE_URL}/staff/patients/search?name=${encodeURIComponent(query)}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} },
        );
        if (res.ok) {
          const json = await res.json();
          setResults(json.patients || json.data || []);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
        setSearched(true);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div style={{ maxWidth: 480, margin: '60px auto', padding: 24, textAlign: 'center' }}>
      <h2 style={{ marginBottom: 8, color: '#111827' }}>Select a Patient</h2>
      <p style={{ color: '#6b7280', marginBottom: 20 }}>
        Search by name to start the intake process.
      </p>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search patient name..."
        aria-label="Search patients"
        style={{
          width: '100%', padding: '10px 14px', fontSize: 15,
          border: '1px solid #d1d5db', borderRadius: 8,
          outline: 'none', boxSizing: 'border-box',
        }}
        autoFocus
      />

      {loading && <p style={{ marginTop: 12, color: '#9ca3af' }}>Searching...</p>}

      {!loading && searched && results.length === 0 && (
        <p style={{ marginTop: 12, color: '#9ca3af' }}>No patients found.</p>
      )}

      {results.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, marginTop: 12, textAlign: 'left' }}>
          {results.map((p) => (
            <li key={p.id} style={{ marginBottom: 6 }}>
              <button
                type="button"
                onClick={() => onSelect(p.userId || p.id)}
                style={{
                  width: '100%', padding: '10px 14px', textAlign: 'left',
                  border: '1px solid #e5e7eb', borderRadius: 8,
                  background: '#f9fafb', cursor: 'pointer', fontSize: 14,
                }}
              >
                <strong>{p.fullName || `${p.firstName} ${p.lastName}`}</strong>
                {p.email && <span style={{ color: '#6b7280', marginLeft: 8 }}>{p.email}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
