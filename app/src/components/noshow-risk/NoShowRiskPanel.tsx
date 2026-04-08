/**
 * No-Show Risk Panel Component
 *
 * Displays current risk, trend, and attendance summary for patient profile.
 *
 * @module NoShowRiskPanel
 * @task US_038 TASK_003
 */

import React, { useState, useEffect } from 'react';
import { getRiskTrend, getAttendanceSummary, calculateRisk } from '../../services/risk.service';
import type { RiskTrendPoint, AttendanceSummary as AttSummary } from '../../types/risk.types';

interface NoShowRiskPanelProps {
  patientId: number;
  latestAppointmentId?: number;
  currentRiskScore?: number;
  currentCategory?: string;
  calculatedAt?: string;
}

export const NoShowRiskPanel: React.FC<NoShowRiskPanelProps> = ({
  patientId,
  latestAppointmentId,
  currentRiskScore,
  currentCategory,
  calculatedAt,
}) => {
  const [trend, setTrend] = useState<RiskTrendPoint[]>([]);
  const [attendance, setAttendance] = useState<AttSummary | null>(null);
  const [recalculating, setRecalculating] = useState(false);
  const [score, setScore] = useState(currentRiskScore);
  const [category, setCategory] = useState(currentCategory);

  useEffect(() => {
    getRiskTrend(patientId).then(setTrend).catch(() => {});
    getAttendanceSummary(patientId).then(setAttendance).catch(() => {});
  }, [patientId]);

  const handleRecalculate = async () => {
    if (!latestAppointmentId) return;
    try {
      setRecalculating(true);
      const result = await calculateRisk(latestAppointmentId);
      setScore(result.riskScore);
      setCategory(result.category);
    } catch {
      // non-critical
    } finally {
      setRecalculating(false);
    }
  };

  const categoryColors: Record<string, string> = {
    low: '#10b981', medium: '#f59e0b', high: '#ef4444',
  };

  return (
    <div style={{
      background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', padding: 20,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>No-Show Risk Assessment</h3>
        {latestAppointmentId && (
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            style={{
              padding: '6px 14px', borderRadius: 6, border: '1px solid #3b82f6',
              background: recalculating ? '#93c5fd' : '#3b82f6',
              color: '#fff', cursor: recalculating ? 'not-allowed' : 'pointer', fontSize: 13,
            }}
          >
            {recalculating ? 'Calculating...' : 'Recalculate Risk'}
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Current Risk */}
        <div style={{ textAlign: 'center', padding: 16, background: '#f9fafb', borderRadius: 8 }}>
          <div style={{
            fontSize: 48, fontWeight: 700,
            color: category ? categoryColors[category] || '#6b7280' : '#6b7280',
          }}>
            {score != null ? `${score}%` : '—'}
          </div>
          {category && (
            <span style={{
              display: 'inline-block', padding: '2px 10px', borderRadius: 12,
              fontSize: 13, fontWeight: 600,
              backgroundColor: categoryColors[category] || '#6b7280', color: '#fff',
            }}>
              {category.charAt(0).toUpperCase() + category.slice(1)} Risk
            </span>
          )}
          {calculatedAt && (
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
              Last calculated: {new Date(calculatedAt).toLocaleDateString()}
            </p>
          )}
          {score == null && (
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              Risk not calculated yet.
            </p>
          )}
        </div>

        {/* Attendance Summary + Trend Preview */}
        <div>
          {attendance && (
            <div style={{ padding: 16, background: '#f9fafb', borderRadius: 8, marginBottom: 12 }}>
              <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600 }}>Attendance Summary</h4>
              <p style={{ fontSize: 14, margin: 0 }}>
                <strong>{attendance.noShowCount}</strong> no-show{attendance.noShowCount !== 1 ? 's' : ''} / <strong>{attendance.totalAppointments}</strong> total
                = <strong>{attendance.noShowRate}%</strong> rate
              </p>
            </div>
          )}

          {trend.length > 0 && (
            <div style={{ padding: 16, background: '#f9fafb', borderRadius: 8 }}>
              <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600 }}>Risk Trend (12 months)</h4>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 40 }}>
                {trend.slice(-12).map((pt, i) => (
                  <div
                    key={i}
                    title={`${pt.date}: ${pt.riskScore}%`}
                    style={{
                      flex: 1, height: `${Math.max(4, pt.riskScore * 0.4)}px`,
                      backgroundColor: pt.riskScore > 50 ? '#ef4444' : pt.riskScore > 20 ? '#f59e0b' : '#10b981',
                      borderRadius: 2,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
