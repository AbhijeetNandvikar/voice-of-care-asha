import React, { useState, useEffect } from 'react';
import { DataTable, type Column } from '../components/DataTable';
import type { PaginatedResponse } from '../types';
import api from '../services/api';
import './SyncLogs.css';

interface SyncLog {
  id: number;
  visit_id: number;
  worker_id: number;
  collection_center_id?: number;
  date_time: string;
  status: 'completed' | 'incomplete' | 'failed';
  error_message?: string;
  meta_data?: Record<string, any>;
  worker_name?: string;
  visit_count?: number;
}

export const SyncLogs: React.FC = () => {
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    fetchSyncLogs();
  }, [currentPage, searchQuery, filterStatus, startDate, endDate]);

  const fetchSyncLogs = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        page_size: pageSize,
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      if (filterStatus) {
        params.status = filterStatus;
      }

      if (startDate) {
        params.start_date = startDate;
      }

      if (endDate) {
        params.end_date = endDate;
      }

      const response = await api.get<PaginatedResponse<SyncLog>>('/sync-logs', { params });
      setSyncLogs(response.data.items || []);
      setTotalCount(response.data.total_count);
    } catch (error) {
      console.error('Failed to fetch sync logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
    fetchSyncLogs();
  };

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'badge-success';
      case 'incomplete':
        return 'badge-warning';
      case 'failed':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  const columns: Column<SyncLog>[] = [
    {
      key: 'worker_name',
      label: 'Worker Name',
      render: (value) => value || 'N/A',
    },
    {
      key: 'visit_count',
      label: 'Visit Count',
      render: (value) => value || 1,
    },
    {
      key: 'date_time',
      label: 'Date & Time',
      render: (value) => {
        try {
          const date = new Date(value);
          return date.toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
        } catch {
          return value;
        }
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`badge ${getStatusBadgeClass(value)}`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    {
      key: 'error_message',
      label: 'Error Message',
      render: (value) => {
        if (!value) return '-';
        return (
          <span className="error-message" title={value}>
            {value.length > 50 ? `${value.substring(0, 50)}...` : value}
          </span>
        );
      },
    },
  ];

  return (
    <div className="sync-logs-page">
      <div className="page-header">
        <h1>Sync Logs</h1>
        <p className="page-description">Monitor data synchronization activities and troubleshoot sync issues</p>
      </div>

      <div className="filter-section">
        <div className="filter-group">
          <label htmlFor="status-filter">Filter by Status:</label>
          <select
            id="status-filter"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              handleFilterChange();
            }}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="incomplete">Incomplete</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="start-date">Start Date:</label>
          <input
            type="date"
            id="start-date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              handleFilterChange();
            }}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="end-date">End Date:</label>
          <input
            type="date"
            id="end-date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              handleFilterChange();
            }}
            className="filter-input"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={syncLogs}
        totalCount={totalCount}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        loading={loading}
        searchPlaceholder="Search sync logs..."
      />
    </div>
  );
};

export default SyncLogs;
