/**
 * ManualIntakePage
 * 
 * File: app/src/pages/ManualIntakePage.tsx
 * Task: US_026 TASK_002 - Frontend Manual Form with Sections
 * 
 * Manual intake form page with auto-save, progress bar,
 * and switch to AI mode functionality.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ManualIntakeForm } from '../components/intake/ManualIntakeForm';
import { AutoSaveIndicator } from '../components/intake/AutoSaveIndicator';
import { SwitchToAIModal } from '../components/intake/SwitchToAIModal';
import { useAutoSave } from '../hooks/useAutoSave';
import { getIncompleteSections } from '../utils/intakeDataMapper';
import { getToken } from '../utils/storage/tokenStorage';
import { useAuth } from '../hooks/useAuth';
import { PatientSelector } from '../components/intake/PatientSelector';
import type { ManualIntakeDraftData } from '../types/aiIntake.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const ManualIntakePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const paramPatientId = searchParams.get('patientId') || (user?.role === 'patient' ? String(user.id) : null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(paramPatientId);
  const patientId = selectedPatientId;
  const appointmentId = searchParams.get('appointmentId');

  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load transferred data from AI mode if available
  const [formData, setFormData] = useState<ManualIntakeDraftData>(() => {
    const transferred = sessionStorage.getItem('intakeTransferData');
    if (transferred) {
      sessionStorage.removeItem('intakeTransferData');
      sessionStorage.removeItem('intakeTransferMode');
      try {
        return JSON.parse(transferred);
      } catch {
        return {};
      }
    }
    return {};
  });

  // Auto-save hook
  const { draftId, lastSavedAt, isSaving, saveError, forceSave } = useAutoSave(
    patientId ? Number(patientId) : null,
    formData,
    appointmentId ? Number(appointmentId) : undefined,
  );

  // Handle form data changes
  const handleFormChange = useCallback((data: ManualIntakeDraftData) => {
    setFormData(data);
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!draftId && !patientId) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Force save first
      await forceSave();

      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/intake/manual/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          draftId,
          intakeMode: sessionStorage.getItem('intakeTransferMode') === 'hybrid' ? 'hybrid' : 'manual',
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.message || 'Submission failed');
      }

      navigate('/patient/dashboard');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  }, [draftId, patientId, forceSave, navigate]);

  // Handle switch to AI
  const handleSwitchToAI = useCallback(async () => {
    await forceSave();
    sessionStorage.setItem('intakeTransferData', JSON.stringify(formData));
    sessionStorage.setItem('intakeTransferMode', 'hybrid');
    navigate(
      `/intake/ai?patientId=${patientId}${appointmentId ? `&appointmentId=${appointmentId}` : ''}`,
    );
  }, [forceSave, formData, navigate, patientId, appointmentId]);

  if (!patientId) {
    return <PatientSelector onSelect={(id) => setSelectedPatientId(id)} />;
  }

  // Calculate progress
  const incomplete = getIncompleteSections(formData);
  const totalSections = 6;
  const completedCount = totalSections - incomplete.length;
  const percentComplete = Math.round((completedCount / totalSections) * 100);

  return (
    <div
      className="manual-intake-page"
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '24px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 600, color: '#1f2937' }}>
          Patient Intake Form
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AutoSaveIndicator isSaving={isSaving} lastSavedAt={lastSavedAt} error={saveError} />
          <button
            onClick={() => setShowSwitchModal(true)}
            style={{
              padding: '6px 14px',
              border: '1px solid #8b5cf6',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              color: '#8b5cf6',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Switch to AI Assistant
          </button>
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
          <span>Progress</span>
          <span>{completedCount}/{totalSections} sections</span>
        </div>
        <div
          style={{
            height: '6px',
            backgroundColor: '#e5e7eb',
            borderRadius: '3px',
            overflow: 'hidden',
          }}
          role="progressbar"
          aria-valuenow={percentComplete}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            style={{
              height: '100%',
              width: `${percentComplete}%`,
              backgroundColor: percentComplete === 100 ? '#10b981' : '#2563eb',
              borderRadius: '3px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Error banner */}
      {submitError && (
        <div
          style={{
            padding: '10px 16px',
            marginBottom: '16px',
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            borderRadius: '8px',
            fontSize: '13px',
          }}
          role="alert"
        >
          {submitError}
        </div>
      )}

      {/* Form */}
      <ManualIntakeForm
        initialData={formData}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Switch Modal */}
      <SwitchToAIModal
        isOpen={showSwitchModal}
        onConfirm={handleSwitchToAI}
        onCancel={() => setShowSwitchModal(false)}
        isSaving={isSaving}
      />
    </div>
  );
};
