/**
 * ManualIntakeForm Component
 * 
 * File: app/src/components/intake/ManualIntakeForm.tsx
 * Task: US_026 TASK_002 - Frontend Manual Form with Sections
 * 
 * Multi-section accordion form for manual patient intake.
 * Sections: Chief Complaint, Medical History, Medications,
 * Allergies, Family History, Emergency Contact.
 */
import React, { useState, useCallback } from 'react';
import { FormSection } from './FormSection';
import type { ManualIntakeDraftData, MedicationEntry, AllergyEntry } from '../../types/aiIntake.types';

interface ManualIntakeFormProps {
  initialData?: ManualIntakeDraftData;
  onChange: (data: ManualIntakeDraftData) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const ManualIntakeForm: React.FC<ManualIntakeFormProps> = ({
  initialData,
  onChange,
  onSubmit,
  isSubmitting,
}) => {
  const [data, setData] = useState<ManualIntakeDraftData>(
    initialData || {
      chiefComplaint: '',
      medicalHistory: [],
      medications: [],
      allergies: [],
      familyHistory: [],
      emergencyContact: undefined,
      additionalNotes: '',
    },
  );

  const updateField = useCallback(
    <K extends keyof ManualIntakeDraftData>(field: K, value: ManualIntakeDraftData[K]) => {
      setData((prev) => {
        const updated = { ...prev, [field]: value };
        onChange(updated);
        return updated;
      });
    },
    [onChange],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '4px',
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {/* Chief Complaint */}
      <FormSection
        title="Chief Complaint"
        isCompleted={!!data.chiefComplaint && data.chiefComplaint.trim().length >= 10}
        defaultOpen
      >
        <label style={labelStyle} htmlFor="chiefComplaint">
          What brings you in today? (min 10 characters)
        </label>
        <textarea
          id="chiefComplaint"
          value={data.chiefComplaint || ''}
          onChange={(e) => updateField('chiefComplaint', e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
          placeholder="Describe your main concern..."
          required
          minLength={10}
        />
      </FormSection>

      {/* Medical History */}
      <FormSection
        title="Medical History"
        isCompleted={(data.medicalHistory?.length || 0) > 0}
      >
        <label style={labelStyle}>Past medical conditions</label>
        <ListInput
          items={data.medicalHistory || []}
          onChange={(items) => updateField('medicalHistory', items)}
          placeholder="e.g., Type 2 Diabetes"
          inputStyle={inputStyle}
        />
      </FormSection>

      {/* Medications */}
      <FormSection
        title="Current Medications"
        isCompleted={(data.medications?.length || 0) > 0}
      >
        <label style={labelStyle}>List your current medications</label>
        <MedicationInput
          medications={data.medications || []}
          onChange={(meds) => updateField('medications', meds)}
          inputStyle={inputStyle}
        />
      </FormSection>

      {/* Allergies */}
      <FormSection
        title="Allergies"
        isCompleted={(data.allergies?.length || 0) > 0}
      >
        <label style={labelStyle}>Known allergies</label>
        <AllergyInput
          allergies={data.allergies || []}
          onChange={(allergies) => updateField('allergies', allergies)}
          inputStyle={inputStyle}
        />
      </FormSection>

      {/* Family History */}
      <FormSection
        title="Family History"
        isCompleted={(data.familyHistory?.length || 0) > 0}
      >
        <label style={labelStyle}>Family medical history</label>
        <ListInput
          items={data.familyHistory || []}
          onChange={(items) => updateField('familyHistory', items)}
          placeholder="e.g., Father - heart disease"
          inputStyle={inputStyle}
        />
      </FormSection>

      {/* Emergency Contact */}
      <FormSection
        title="Emergency Contact"
        isCompleted={!!data.emergencyContact?.name}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            <label style={labelStyle} htmlFor="ecName">Name</label>
            <input
              id="ecName"
              type="text"
              value={data.emergencyContact?.name || ''}
              onChange={(e) =>
                updateField('emergencyContact', {
                  ...(data.emergencyContact || {}),
                  name: e.target.value,
                })
              }
              style={inputStyle}
              placeholder="Contact name"
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="ecRelationship">Relationship</label>
            <input
              id="ecRelationship"
              type="text"
              value={data.emergencyContact?.relationship || ''}
              onChange={(e) =>
                updateField('emergencyContact', {
                  ...(data.emergencyContact || { name: '' }),
                  relationship: e.target.value,
                })
              }
              style={inputStyle}
              placeholder="e.g., Spouse, Parent"
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="ecPhone">Phone</label>
            <input
              id="ecPhone"
              type="tel"
              value={data.emergencyContact?.phone || ''}
              onChange={(e) =>
                updateField('emergencyContact', {
                  ...(data.emergencyContact || { name: '' }),
                  phone: e.target.value,
                })
              }
              style={inputStyle}
              placeholder="(555) 123-4567"
            />
          </div>
        </div>
      </FormSection>

      {/* Additional Notes */}
      <FormSection title="Additional Notes" isCompleted={!!data.additionalNotes}>
        <label style={labelStyle} htmlFor="additionalNotes">
          Anything else you'd like us to know?
        </label>
        <textarea
          id="additionalNotes"
          value={data.additionalNotes || ''}
          onChange={(e) => updateField('additionalNotes', e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
          placeholder="Optional additional information..."
        />
      </FormSection>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || !data.chiefComplaint || data.chiefComplaint.trim().length < 10}
        style={{
          padding: '12px 24px',
          backgroundColor:
            isSubmitting || !data.chiefComplaint || data.chiefComplaint.trim().length < 10
              ? '#9ca3af'
              : '#10b981',
          color: '#ffffff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          cursor:
            isSubmitting || !data.chiefComplaint || data.chiefComplaint.trim().length < 10
              ? 'not-allowed'
              : 'pointer',
          marginTop: '8px',
        }}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Intake'}
      </button>
    </form>
  );
};

/* ------- Sub-components ------- */

const ListInput: React.FC<{
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  inputStyle: React.CSSProperties;
}> = ({ items, onChange, placeholder, inputStyle }) => {
  const [newItem, setNewItem] = useState('');

  const addItem = () => {
    const trimmed = newItem.trim();
    if (trimmed) {
      onChange([...items, trimmed]);
      setNewItem('');
    }
  };

  return (
    <div>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ flex: 1, fontSize: '14px', color: '#1f2937' }}>{item}</span>
          <button
            type="button"
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}
            aria-label={`Remove ${item}`}
          >
            ✕
          </button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())}
          style={{ ...inputStyle, flex: 1 }}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={addItem}
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            backgroundColor: '#f9fafb',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
};

const MedicationInput: React.FC<{
  medications: MedicationEntry[];
  onChange: (meds: MedicationEntry[]) => void;
  inputStyle: React.CSSProperties;
}> = ({ medications, onChange, inputStyle }) => {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');

  const addMed = () => {
    if (name.trim()) {
      onChange([...medications, { name: name.trim(), dosage: dosage.trim() || undefined, frequency: frequency.trim() || undefined }]);
      setName('');
      setDosage('');
      setFrequency('');
    }
  };

  return (
    <div>
      {medications.map((med, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ flex: 1, fontSize: '14px', color: '#1f2937' }}>
            {med.name}{med.dosage ? ` (${med.dosage})` : ''}{med.frequency ? ` - ${med.frequency}` : ''}
          </span>
          <button
            type="button"
            onClick={() => onChange(medications.filter((_, idx) => idx !== i))}
            style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}
            aria-label={`Remove ${med.name}`}
          >
            ✕
          </button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={{ ...inputStyle, flex: '2 1 120px' }} placeholder="Medication name" />
        <input type="text" value={dosage} onChange={(e) => setDosage(e.target.value)} style={{ ...inputStyle, flex: '1 1 80px' }} placeholder="Dosage" />
        <input type="text" value={frequency} onChange={(e) => setFrequency(e.target.value)} style={{ ...inputStyle, flex: '1 1 80px' }} placeholder="Frequency" />
        <button
          type="button"
          onClick={addMed}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', backgroundColor: '#f9fafb', cursor: 'pointer', fontSize: '14px' }}
        >
          Add
        </button>
      </div>
    </div>
  );
};

const AllergyInput: React.FC<{
  allergies: AllergyEntry[];
  onChange: (allergies: AllergyEntry[]) => void;
  inputStyle: React.CSSProperties;
}> = ({ allergies, onChange, inputStyle }) => {
  const [allergen, setAllergen] = useState('');
  const [reaction, setReaction] = useState('');

  const addAllergy = () => {
    if (allergen.trim()) {
      onChange([...allergies, { allergen: allergen.trim(), reaction: reaction.trim() || undefined }]);
      setAllergen('');
      setReaction('');
    }
  };

  return (
    <div>
      {allergies.map((a, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ flex: 1, fontSize: '14px', color: '#1f2937' }}>
            {a.allergen}{a.reaction ? ` - ${a.reaction}` : ''}
          </span>
          <button
            type="button"
            onClick={() => onChange(allergies.filter((_, idx) => idx !== i))}
            style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}
            aria-label={`Remove ${a.allergen}`}
          >
            ✕
          </button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input type="text" value={allergen} onChange={(e) => setAllergen(e.target.value)} style={{ ...inputStyle, flex: 2 }} placeholder="Allergen" />
        <input type="text" value={reaction} onChange={(e) => setReaction(e.target.value)} style={{ ...inputStyle, flex: 2 }} placeholder="Reaction (optional)" />
        <button
          type="button"
          onClick={addAllergy}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', backgroundColor: '#f9fafb', cursor: 'pointer', fontSize: '14px' }}
        >
          Add
        </button>
      </div>
    </div>
  );
};
