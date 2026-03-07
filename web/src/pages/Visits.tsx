import React, { useState, useEffect } from 'react';
import { DataTable, type Column } from '../components/DataTable';
import { VisitDetailModal } from '../components/VisitDetailModal';
import type { Visit, Worker, PaginatedResponse } from '../types';
import api from '../services/api';
import { formatDate } from '../utils/dateUtils';
import './Visits.css';

interface VisitWithDetails extends Visit {
  beneficiary_name?: string;
  beneficiary_mcts_id?: string;
  worker_name?: string;
}

export const Visits: React.FC = () => {
  const [visits, setVisits] = useState<VisitWithDetails[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWorker, setFilterWorker] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedVisit, setSelectedVisit] = useState<VisitWithDetails | null>(null);

  useEffect(() => {
    fetchWorkers();
  }, []);

  useEffect(() => {
    fetchVisits();
  }, [currentPage, searchQuery, filterWorker, startDate, endDate]);

  const fetchWorkers = async () => {
    try {
      const response = await api.get<PaginatedResponse<Worker>>('/workers', {
        params: { page: 1, page_size: 1000 },
      });
      setWorkers((response.data.items || []).filter(w => w.worker_type === 'asha_worker'));
    } catch (error) {
      console.error('Failed to fetch workers:', error);
      setWorkers([]);
    }
  };

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        page_size: pageSize,
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      if (filterWorker) {
        params.worker_id = parseInt(filterWorker);
      }

      if (startDate) {
        params.start_date = startDate;
      }

      if (endDate) {
        params.end_date = endDate;
      }

      const response = await api.get<PaginatedResponse<VisitWithDetails>>('/visits', { params });
      setVisits(response.data.items || []);
      setTotalCount(response.data.total_count);
    } catch (error) {
      console.error('Failed to fetch visits:', error);
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

  const handleRowClick = (visit: VisitWithDetails) => {
    setSelectedVisit(visit);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const columns: Column<VisitWithDetails>[] = [
    {
      key: 'beneficiary_name',
      label: 'Beneficiary Name',
    },
    {
      key: 'worker_name',
      label: 'ASHA Worker',
    },
    {
      key: 'visit_type',
      label: 'Visit Type',
      render: (value) => {
        const typeLabels: Record<string, string> = {
          hbnc: 'HBNC',
          anc: 'ANC',
          pnc: 'PNC',
        };
        return typeLabels[value] || value;
      },
    },
    {
      key: 'day_number',
      label: 'Day Number',
      render: (value) => value ? `Day ${value}` : 'N/A',
    },
    {
      key: 'visit_date_time',
      label: 'Visit Date',
      render: (value) => formatDate(value),
    },
    {
      key: 'is_synced',
      label: 'Sync Status',
      render: (value) => (
        <span className={`badge ${value ? 'badge-success' : 'badge-warning'}`}>
          {value ? 'Synced' : 'Pending'}
        </span>
      ),
    },
  ];

  return (
    <div className="visits-page">
      <div className="page-header">
        <h1>Visits Management</h1>
      </div>

      <div className="filter-section">
        <div className="filter-group">
          <label htmlFor="worker-filter">Filter by Worker:</label>
          <select
            id="worker-filter"
            value={filterWorker}
            onChange={(e) => {
              setFilterWorker(e.target.value);
              handleFilterChange();
            }}
            className="filter-select"
          >
            <option value="">All Workers</option>
            {workers.map(worker => (
              <option key={worker.id} value={worker.id}>
                {worker.first_name} {worker.last_name} ({worker.worker_id})
              </option>
            ))}
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
        data={visits}
        totalCount={totalCount}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        onRefresh={fetchVisits}
        onRowClick={handleRowClick}
        loading={loading}
        searchPlaceholder="Search by MCTS ID..."
      />

      {selectedVisit && (
        <VisitDetailModal
          visitId={selectedVisit.id}
          isOpen={!!selectedVisit}
          onClose={() => setSelectedVisit(null)}
        />
      )}
    </div>
  );
};

export default Visits;
