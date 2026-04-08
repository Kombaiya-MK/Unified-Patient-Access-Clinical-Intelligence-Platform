/**
 * File Size Formatting Utility
 * @module utils/formatFileSize
 * @task US_028 TASK_002
 */

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
  return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
}

export function formatEta(seconds: number): string {
  if (seconds < 60) return `${Math.ceil(seconds)}s remaining`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} min remaining`;
}
