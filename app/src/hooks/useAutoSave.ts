/**
 * useAutoSave Hook
 * 
 * File: app/src/hooks/useAutoSave.ts
 * Task: US_026 TASK_002 - Frontend Manual Form with Sections
 * 
 * Auto-saves form data at 30-second intervals via API.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { getToken } from '../utils/storage/tokenStorage';
import type { ManualIntakeDraftData, DraftSaveResponse } from '../types/aiIntake.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const AUTO_SAVE_INTERVAL_MS = 30_000; // 30 seconds

interface UseAutoSaveReturn {
  draftId: number | null;
  lastSavedAt: string | null;
  isSaving: boolean;
  saveError: string | null;
  forceSave: () => Promise<void>;
}

export function useAutoSave(
  patientId: number | null,
  draftData: ManualIntakeDraftData,
  appointmentId?: number,
): UseAutoSaveReturn {
  const [draftId, setDraftId] = useState<number | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const prevDataRef = useRef<string>('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveDraftRef = useRef<() => Promise<void>>();

  // Reset state when patientId changes
  useEffect(() => {
    setDraftId(null);
    setLastSavedAt(null);
    setSaveError(null);
    prevDataRef.current = '';
  }, [patientId]);

  const saveDraft = useCallback(async () => {
    if (!patientId) return;

    const serialized = JSON.stringify(draftData);
    // Skip if data hasn't changed
    if (serialized === prevDataRef.current) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const token = getToken();
      const url = draftId
        ? `${API_BASE_URL}/intake/manual/draft/${draftId}`
        : `${API_BASE_URL}/intake/manual/draft`;
      const method = draftId ? 'PUT' : 'POST';

      const body = draftId
        ? { draftData }
        : { patientId, appointmentId, draftData };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.message || 'Failed to save draft');
      }

      const result = await response.json();
      const data: DraftSaveResponse = result.data;

      if (data.draftId) setDraftId(data.draftId);
      setLastSavedAt(data.lastSavedAt);
      prevDataRef.current = serialized;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Auto-save failed';
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  }, [patientId, draftData, draftId, appointmentId]);

  // Keep saveDraftRef current without re-creating the interval
  saveDraftRef.current = saveDraft;

  // Auto-save interval — stable, does not reset on every keystroke
  useEffect(() => {
    if (!patientId) return;

    intervalRef.current = setInterval(() => {
      saveDraftRef.current?.();
    }, AUTO_SAVE_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [patientId]);

  return {
    draftId,
    lastSavedAt,
    isSaving,
    saveError,
    forceSave: saveDraft,
  };
}
