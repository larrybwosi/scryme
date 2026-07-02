import React from 'react';
import { cn } from '.@repo/ui/components/ui/lib/utils';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  isLoading?: boolean;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  className,
}: PaginationProps) {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = startPage + maxVisiblePages - 1;

      if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push('...');
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push('...');
        }
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handlePageChange = (page: number) => {
    if (!isLoading) {
      onPageChange(page);
    }
  };

  const handlePageSizeChange = (size: number) => {
    if (!isLoading && onPageSizeChange) {
      onPageSizeChange(size);
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-4 mt-6',
        isLoading && 'opacity-75 pointer-events-none',
        className
      )}
    >
      <div className="text-sm text-muted-foreground">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Loading...</span>
          </div>
        ) : (
          <>
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems}{' '}
            entries
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          className={cn(
            'inline-flex items-center justify-center rounded-md p-2 text-sm font-medium disabled:opacity-50 disabled:pointer-events-none hover:bg-accent hover:text-accent-foreground',
            isLoading && 'cursor-not-allowed'
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {getPageNumbers().map((page, index) =>
          page === '...' ? (
            <span key={index} className="px-3 py-1 text-sm">
              ...
            </span>
          ) : (
            <button
              key={index}
              onClick={() => handlePageChange(page as number)}
              disabled={isLoading}
              className={cn(
                'inline-flex items-center justify-center rounded-md px-3 py-1 text-sm font-medium transition-colors',
                currentPage === page
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground',
                isLoading && 'cursor-not-allowed'
              )}
            >
              {isLoading && currentPage === page ? (
                <div className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>{page}</span>
                </div>
              ) : (
                page
              )}
            </button>
          )
        )}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          className={cn(
            'inline-flex items-center justify-center rounded-md p-2 text-sm font-medium disabled:opacity-50 disabled:pointer-events-none hover:bg-accent hover:text-accent-foreground',
            isLoading && 'cursor-not-allowed'
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {onPageSizeChange && (
        <div className="flex items-center gap-2 text-sm">
          <span>Items per page:</span>
          <select
            value={pageSize}
            onChange={e => handlePageSizeChange(Number(e.target.value))}
            disabled={isLoading}
            className={cn(
              'rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isLoading && 'cursor-not-allowed opacity-50'
            )}
          >
            {[10, 25, 50, 100].map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
