/**
 * Audit Log Pagination Component
 * 
 * File: app/src/components/AuditLogPagination.tsx
 * Task: US_011 TASK_004 - Frontend Admin Audit Log Viewer (Pagination)
 * 
 * Purpose: Pagination controls for navigating audit logs
 * 
 * Features:
 * - Previous/Next buttons
 * - Page number display
 * - Jump to page
 * - Results count display
 * - WCAG 2.2 AA accessible
 */

import React, { useState } from 'react';

interface AuditLogPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const AuditLogPagination: React.FC<AuditLogPaginationProps> = ({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}) => {
  const [jumpToPage, setJumpToPage] = useState<string>('');

  /**
   * Calculate result range
   */
  const startResult = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const endResult = Math.min(page * pageSize, total);

  /**
   * Handle previous page
   */
  const handlePrevious = () => {
    if (page > 1) {
      onPageChange(page - 1);
    }
  };

  /**
   * Handle next page
   */
  const handleNext = () => {
    if (page < totalPages) {
      onPageChange(page + 1);
    }
  };

  /**
   * Handle jump to page
   */
  const handleJumpToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPage = parseInt(jumpToPage, 10);
    
    if (targetPage >= 1 && targetPage <= totalPages) {
      onPageChange(targetPage);
      setJumpToPage('');
    }
  };

  /**
   * Generate page numbers to display
   */
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow + 2) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);
      
      // Calculate start and end of visible page range
      let start = Math.max(2, page - 1);
      let end = Math.min(totalPages - 1, page + 1);
      
      // Adjust if near boundaries
      if (page <= 3) {
        end = Math.min(maxPagesToShow, totalPages - 1);
      } else if (page >= totalPages - 2) {
        start = Math.max(2, totalPages - maxPagesToShow + 1);
      }
      
      // Add ellipsis if needed
      if (start > 2) {
        pages.push('...');
      }
      
      // Add visible pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pages.push('...');
      }
      
      // Show last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  if (totalPages <= 1) {
    return null; // Don't show pagination if only one page
  }

  return (
    <div className="audit-log-pagination" role="navigation" aria-label="Pagination">
      {/* Results count */}
      <div className="results-info" aria-live="polite">
        Showing {startResult} to {endResult} of {total} results
      </div>

      {/* Pagination controls */}
      <div className="pagination-controls">
        {/* Previous button */}
        <button
          className="pagination-btn"
          onClick={handlePrevious}
          disabled={page === 1}
          aria-label="Go to previous page"
        >
          <svg
            className="pagination-icon"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Previous
        </button>

        {/* Page numbers */}
        <div className="page-numbers" role="group" aria-label="Page numbers">
          {getPageNumbers().map((pageNum, index) => {
            if (pageNum === '...') {
              return (
                <span key={`ellipsis-${index}`} className="page-ellipsis" aria-hidden="true">
                  ...
                </span>
              );
            }
            
            return (
              <button
                key={pageNum}
                className={`page-number ${pageNum === page ? 'active' : ''}`}
                onClick={() => onPageChange(pageNum as number)}
                aria-label={`Go to page ${pageNum}`}
                aria-current={pageNum === page ? 'page' : undefined}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next button */}
        <button
          className="pagination-btn"
          onClick={handleNext}
          disabled={page === totalPages}
          aria-label="Go to next page"
        >
          Next
          <svg
            className="pagination-icon"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Jump to page */}
      <form className="jump-to-page" onSubmit={handleJumpToPage}>
        <label htmlFor="page-jump" className="sr-only">
          Jump to page
        </label>
        <input
          type="number"
          id="page-jump"
          className="page-jump-input"
          placeholder="Page..."
          min="1"
          max={totalPages}
          value={jumpToPage}
          onChange={(e) => setJumpToPage(e.target.value)}
          aria-label="Enter page number to jump to"
        />
        <button type="submit" className="page-jump-btn" aria-label="Jump to page">
          Go
        </button>
      </form>

      <style>{`
        .audit-log-pagination {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          background: #fff;
          border-top: 1px solid #e5e7eb;
          gap: 1rem;
        }

        .results-info {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .pagination-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.5rem 0.75rem;
          background: #fff;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 0.875rem;
          color: #374151;
          cursor: pointer;
          transition: background-color 0.15s, border-color 0.15s;
        }

        .pagination-btn:hover:not(:disabled) {
          background-color: #f9fafb;
          border-color: #9ca3af;
        }

        .pagination-btn:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-icon {
          width: 1rem;
          height: 1rem;
        }

        .page-numbers {
          display: flex;
          gap: 0.25rem;
        }

        .page-number {
          padding: 0.5rem 0.75rem;
          background: #fff;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 0.875rem;
          color: #374151;
          cursor: pointer;
          transition: background-color 0.15s, border-color 0.15s, color 0.15s;
          min-width: 2.5rem;
        }

        .page-number:hover {
          background-color: #f9fafb;
          border-color: #9ca3af;
        }

        .page-number:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .page-number.active {
          background-color: #3b82f6;
          border-color: #3b82f6;
          color: #fff;
          font-weight: 600;
        }

        .page-ellipsis {
          padding: 0.5rem 0.75rem;
          color: #9ca3af;
        }

        .jump-to-page {
          display: flex;
          gap: 0.5rem;
        }

        .page-jump-input {
          width: 80px;
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 0.875rem;
        }

        .page-jump-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .page-jump-btn {
          padding: 0.5rem 0.75rem;
          background-color: #3b82f6;
          border: none;
          border-radius: 4px;
          color: #fff;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.15s;
        }

        .page-jump-btn:hover {
          background-color: #2563eb;
        }

        .page-jump-btn:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }

        @media (max-width: 768px) {
          .audit-log-pagination {
            flex-direction: column;
            align-items: stretch;
          }

          .pagination-controls {
            flex-direction: column;
            width: 100%;
          }

          .page-numbers {
            justify-content: center;
            flex-wrap: wrap;
          }

          .jump-to-page {
            width: 100%;
          }

          .page-jump-input {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default AuditLogPagination;
