/**
 * Drop Zone Component
 * Drag-and-drop upload area with dashed border and file browse capability.
 * @module components/documents/DropZone
 * @task US_028 TASK_002
 */

import React, { useRef, useCallback } from 'react';
import { UPLOAD_CONFIG } from '../../types/document.types';

interface DropZoneProps {
  onFiles: (files: File[]) => void;
  isDragActive: boolean;
  setIsDragActive: (active: boolean) => void;
  disabled?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFiles,
  isDragActive,
  setIsDragActive,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragActive(true);
  }, [disabled, setIsDragActive]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, [setIsDragActive]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onFiles(files);
  }, [disabled, onFiles, setIsDragActive]);

  const handleClick = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) onFiles(files);
    if (inputRef.current) inputRef.current.value = '';
  }, [onFiles]);

  const accept = UPLOAD_CONFIG.allowedExtensions.join(',');

  return (
    <div
      role="button"
      tabIndex={0}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
      style={{
        border: `2px dashed ${isDragActive ? '#3b82f6' : '#d1d5db'}`,
        borderRadius: 12,
        padding: '48px 24px',
        textAlign: 'center',
        backgroundColor: isDragActive ? '#eff6ff' : '#f9fafb',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        opacity: disabled ? 0.5 : 1,
        minHeight: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
      }}
    >
      <div style={{ fontSize: 48, color: isDragActive ? '#3b82f6' : '#9ca3af' }}>☁️</div>
      {isDragActive ? (
        <p style={{ fontSize: 16, fontWeight: 600, color: '#3b82f6' }}>Drop files to upload</p>
      ) : (
        <>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>
            Drag files here or click to browse
          </p>
          <p style={{ fontSize: 13, color: '#6b7280' }}>
            Accepted: PDF, PNG, JPG, DOCX (max 10MB each)
          </p>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleChange}
        style={{ display: 'none' }}
        aria-label="Upload files"
      />
    </div>
  );
};
