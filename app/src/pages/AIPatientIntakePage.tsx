/**
 * AIPatientIntakePage
 * 
 * File: app/src/pages/AIPatientIntakePage.tsx
 * Task: US_025 TASK_003 - Frontend AI Chat Interface
 * 
 * Two-panel layout: AI chat on left, data summary on right.
 * Includes switch to manual mode functionality.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AIChatInterface } from '../components/intake/AIChatInterface';
import { DataSummaryPanel } from '../components/intake/DataSummaryPanel';
import { SwitchToManualModal } from '../components/intake/SwitchToManualModal';
import { AIFallbackAlert } from '../components/circuit-breaker/AIFallbackAlert';
import { useCircuitBreakerStatus } from '../hooks/useCircuitBreakerStatus';
import { useAIConversation } from '../hooks/useAIConversation';
import { aiDataToManualForm } from '../utils/intakeDataMapper';
import { useAuth } from '../hooks/useAuth';
import { PatientSelector } from '../components/intake/PatientSelector';
import { CollapsibleSection } from '../components/Forms/CollapsibleSection';
import { useBreakpoint } from '../hooks/useBreakpoint';
import '../styles/form-responsive.css';

export const AIPatientIntakePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const paramPatientId = searchParams.get('patientId') || (user?.role === 'patient' ? String(user.id) : null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(paramPatientId);
  const patientId = selectedPatientId;
  const appointmentId = searchParams.get('appointmentId');

  const {
    messages,
    extractedData,
    progress,
    conversationId,
    isLoading,
    error,
    contextFields,
    startConversation,
    sendMessage,
    submitConversation,
  } = useAIConversation();

  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const { statuses } = useCircuitBreakerStatus();
  const isIntakeCircuitOpen = statuses.some((s) => s.service === 'ai-intake' && s.state === 'open');
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile';

  // Start conversation on mount
  useEffect(() => {
    if (patientId) {
      startConversation(
        Number(patientId),
        appointmentId ? Number(appointmentId) : undefined,
      );
    }
  }, [patientId, appointmentId, startConversation]);

  // Handle switch to manual
  const handleSwitchToManual = useCallback(() => {
    const formData = aiDataToManualForm(extractedData);
    // Store in sessionStorage for the manual page to pick up
    sessionStorage.setItem('intakeTransferData', JSON.stringify(formData));
    sessionStorage.setItem('intakeTransferMode', 'hybrid');
    navigate(
      `/intake/manual?patientId=${patientId}${appointmentId ? `&appointmentId=${appointmentId}` : ''}`,
    );
  }, [extractedData, navigate, patientId, appointmentId]);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    const result = await submitConversation('ai');
    if (result) {
      navigate('/patient/dashboard');
    }
  }, [submitConversation, navigate]);

  if (!patientId) {
    return <PatientSelector onSelect={(id) => setSelectedPatientId(id)} />;
  }

  return (
    <div
      className="ai-intake-page"
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        height: '100vh',
        backgroundColor: '#ffffff',
      }}
    >
      {/* Left Panel - Chat */}
      <div style={{ flex: '1 1 60%', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* AI Fallback Alert – US_041 TASK_002 */}
        <AIFallbackAlert service="ai-intake" isActive={isIntakeCircuitOpen} />

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
          }}
        >
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1f2937' }}>
            AI Patient Intake
          </h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowSwitchModal(true)}
              style={{
                padding: '6px 14px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                color: '#374151',
                fontSize: '13px',
                cursor: 'pointer',
                minHeight: '44px',
              }}
            >
              Switch to Manual
            </button>
            {progress.percentComplete === 100 && (
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                style={{
                  padding: '6px 14px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                }}
              >
                Submit Intake
              </button>
            )}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div
            style={{
              padding: '8px 16px',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              fontSize: '13px',
              borderBottom: '1px solid #fecaca',
            }}
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Chat interface */}
        <AIChatInterface
          messages={messages}
          progress={progress}
          contextFields={contextFields}
          isLoading={isLoading}
          onSendMessage={sendMessage}
        />
      </div>

      {/* Right Panel - Data Summary */}
      <div style={{ flex: isMobile ? 'none' : '0 0 340px', borderLeft: isMobile ? 'none' : '1px solid #e5e7eb', borderTop: isMobile ? '1px solid #e5e7eb' : 'none' }}>
        {isMobile ? (
          <CollapsibleSection title="Collected Data Summary" defaultOpen={false}>
            <DataSummaryPanel extractedData={extractedData} progress={progress} />
          </CollapsibleSection>
        ) : (
          <DataSummaryPanel extractedData={extractedData} progress={progress} />
        )}
      </div>

      {/* Switch Modal */}
      <SwitchToManualModal
        isOpen={showSwitchModal}
        onConfirm={handleSwitchToManual}
        onCancel={() => setShowSwitchModal(false)}
        fieldsCollected={
          Object.keys(extractedData).filter(
            (k) => extractedData[k] !== undefined && extractedData[k] !== null,
          ).length
        }
      />
    </div>
  );
};
