import React, { useState, useEffect, useCallback, useRef } from 'react';
import './DataTable.css';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSearch: (query: string) => void;
  onFilter?: (filters: Record<string, any>) => void;
  onExport?: () => void;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  searchPlaceholder?: string;
  filters?: Array<{
    key: string;
    label: string;
    options: Array<{ value: string; label: string }>;
  }>;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data = [],
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onSearch,
  onFilter,
  onExport,
  onRowClick,
  loading = false,
  searchPlaceholder = 'Search...',
  filters = [],
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const debounceTimerRef = useRef<number | null>(null);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  // Debounced search handler
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);

      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = window.setTimeout(() => {
        onSearch(value);
      }, 300);
    },
    [onSearch]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Handle filter change
  const handleFilterChange = (filterKey: string, value: string) => {
    const newFilters = { ...activeFilters };
    
    if (value === '') {
      delete newFilters[filterKey];
    } else {
      newFilters[filterKey] = value;
    }

    setActiveFilters(newFilters);
    
    if (onFilter) {
      onFilter(newFilters);
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalCount);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Get nested value from object using dot notation
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  };

  return (
    <div className="data-table-container">
      {/* Toolbar */}
      <div className="data-table-toolbar">
        <div className="toolbar-left">
          {/* Search Input */}
          <div className="search-input-wrapper">
            <input
              type="text"
              className="search-input"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>

          {/* Filters */}
          {filters.map((filter) => (
            <div key={filter.key} className="filter-wrapper">
              <select
                className="filter-select"
                value={activeFilters[filter.key] || ''}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              >
                <option value="">{filter.label}</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="toolbar-right">
          {/* Export Button */}
          {onExport && (
            <button className="export-button" onClick={onExport}>
              📥 Export
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {loading ? (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((column, index) => (
                  <th key={index}>
                    {column.label}
                    {column.sortable && <span className="sort-icon">⇅</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="no-data">
                    No data available
                  </td>
                </tr>
              ) : (
                data.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={onRowClick ? 'clickable-row' : ''}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((column, colIndex) => {
                      const value = getNestedValue(row, column.key as string);
                      return (
                        <td key={colIndex}>
                          {column.render ? column.render(value, row) : value}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && data.length > 0 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Showing {startIndex} to {endIndex} of {totalCount} entries
          </div>

          <div className="pagination-controls">
            <button
              className="pagination-button"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>

            {getPageNumbers().map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span className="pagination-ellipsis">...</span>
                ) : (
                  <button
                    className={`pagination-button ${
                      page === currentPage ? 'active' : ''
                    }`}
                    onClick={() => onPageChange(page as number)}
                  >
                    {page}
                  </button>
                )}
              </React.Fragment>
            ))}

            <button
              className="pagination-button"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
