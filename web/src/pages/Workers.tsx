import React, { useState, useEffect } from 'react';
import { DataTable, type Column } from '../components/DataTable';
import { DetailModal } from '../components/DetailModal';
import type { Worker, PaginatedResponse } from '../types';
import api from '../services/api';
import './Workers.css';

interface AddWorkerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddWorkerForm: React.FC<AddWorkerFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    aadhar_id: '',
    address: '',
    worker_type: 'asha_worker' as Worker['worker_type'],
    collection_center_id: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!formData.first_name || !formData.last_name || !formData.phone_number || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        collection_center_id: formData.collection_center_id ? parseInt(formData.collection_center_id) : undefined,
      };

      await api.post('/workers', payload);
      
      // Reset form
      setFormData({
        first_name: '',
        last_name: '',
        phone_number: '',
        email: '',
        aadhar_id: '',
        address: '',
        worker_type: 'asha_worker',
        collection_center_id: '',
        password: '',
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create worker');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Worker</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="worker-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">First Name *</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="last_name">Last Name *</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone_number">Phone Number *</label>
              <input
                type="tel"
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                pattern="[0-9]{10}"
                placeholder="10-digit mobile number"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="aadhar_id">Aadhar ID</label>
              <input
                type="text"
                id="aadhar_id"
                name="aadhar_id"
                value={formData.aadhar_id}
                onChange={handleChange}
                pattern="[0-9]{12}"
                placeholder="12-digit Aadhar number"
              />
            </div>

            <div className="form-group">
              <label htmlFor="worker_type">Worker Type *</label>
              <select
                id="worker_type"
                name="worker_type"
                value={formData.worker_type}
                onChange={handleChange}
                required
              >
                <option value="asha_worker">ASHA Worker</option>
                <option value="medical_officer">Medical Officer</option>
                <option value="anm">ANM</option>
                <option value="aaw">AAW</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="collection_center_id">Collection Center ID</label>
              <input
                type="number"
                id="collection_center_id"
                name="collection_center_id"
                value={formData.collection_center_id}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                minLength={8}
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Worker'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const Workers: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        page_size: pageSize,
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await api.get<PaginatedResponse<Worker>>('/workers', { params });
      setWorkers(response.data.items);
      setTotalCount(response.data.total);
    } catch (error) {
      console.error('Failed to fetch workers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [currentPage, searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowClick = (worker: Worker) => {
    setSelectedWorker(worker);
  };

  const handleAddSuccess = () => {
    fetchWorkers();
  };

  const columns: Column<Worker>[] = [
    {
      key: 'first_name',
      label: 'Name',
      render: (_, row) => `${row.first_name} ${row.last_name}`,
    },
    {
      key: 'worker_id',
      label: 'Worker ID',
    },
    {
      key: 'worker_type',
      label: 'Worker Type',
      render: (value) => {
        const typeLabels: Record<string, string> = {
          asha_worker: 'ASHA Worker',
          medical_officer: 'Medical Officer',
          anm: 'ANM',
          aaw: 'AAW',
        };
        return typeLabels[value] || value;
      },
    },
    {
      key: 'phone_number',
      label: 'Phone',
    },
    {
      key: 'collection_center_id',
      label: 'Collection Center',
      render: (value) => value || 'N/A',
    },
  ];

  const detailFields = selectedWorker
    ? [
        { label: 'Worker ID', value: selectedWorker.worker_id, type: 'text' as const },
        { label: 'Name', value: `${selectedWorker.first_name} ${selectedWorker.last_name}`, type: 'text' as const },
        { label: 'Worker Type', value: selectedWorker.worker_type, type: 'text' as const },
        { label: 'Phone', value: selectedWorker.phone_number, type: 'text' as const },
        { label: 'Email', value: selectedWorker.email || 'N/A', type: 'text' as const },
        { label: 'Aadhar ID', value: selectedWorker.aadhar_id || 'N/A', type: 'text' as const },
        { label: 'Address', value: selectedWorker.address || 'N/A', type: 'text' as const },
        { label: 'Collection Center ID', value: selectedWorker.collection_center_id || 'N/A', type: 'text' as const },
        { label: 'Created At', value: selectedWorker.created_at, type: 'date' as const },
        { label: 'Updated At', value: selectedWorker.updated_at, type: 'date' as const },
        { label: 'Metadata', value: selectedWorker.meta_data, type: 'json' as const },
      ]
    : [];

  return (
    <div className="workers-page">
      <div className="page-header">
        <h1>Workers Management</h1>
        <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
          + Add Worker
        </button>
      </div>

      <DataTable
        columns={columns}
        data={workers}
        totalCount={totalCount}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        onRowClick={handleRowClick}
        loading={loading}
        searchPlaceholder="Search by name or worker ID..."
      />

      <DetailModal
        title="Worker Details"
        fields={detailFields}
        isOpen={!!selectedWorker}
        onClose={() => setSelectedWorker(null)}
      />

      <AddWorkerForm
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />
    </div>
  );
};

export default Workers;
