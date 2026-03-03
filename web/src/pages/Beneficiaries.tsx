import React, { useState, useEffect } from 'react';
import { DataTable, type Column } from '../components/DataTable';
import { DetailModal } from '../components/DetailModal';
import type { Beneficiary, Worker, PaginatedResponse } from '../types';
import api from '../services/api';
import './Beneficiaries.css';

interface AddBeneficiaryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddBeneficiaryForm: React.FC<AddBeneficiaryFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    mcts_id: '',
    phone_number: '',
    aadhar_id: '',
    address: '',
    age: '',
    weight: '',
    beneficiary_type: 'individual' as Beneficiary['beneficiary_type'],
    assigned_asha_id: '',
  });
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchWorkers();
    }
  }, [isOpen]);

  const fetchWorkers = async () => {
    try {
      const response = await api.get<PaginatedResponse<Worker>>('/workers', {
        params: { page: 1, page_size: 100 },
      });
      setWorkers(response.data.items.filter(w => w.worker_type === 'asha_worker'));
    } catch (err) {
      console.error('Failed to fetch workers:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!formData.first_name || !formData.last_name || !formData.mcts_id) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        mcts_id: formData.mcts_id,
        phone_number: formData.phone_number || undefined,
        aadhar_id: formData.aadhar_id || undefined,
        address: formData.address || undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        beneficiary_type: formData.beneficiary_type,
        assigned_asha_id: formData.assigned_asha_id ? parseInt(formData.assigned_asha_id) : undefined,
      };

      await api.post('/beneficiaries', payload);
      
      // Reset form
      setFormData({
        first_name: '',
        last_name: '',
        mcts_id: '',
        phone_number: '',
        aadhar_id: '',
        address: '',
        age: '',
        weight: '',
        beneficiary_type: 'individual',
        assigned_asha_id: '',
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create beneficiary');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Beneficiary</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="beneficiary-form">
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
              <label htmlFor="mcts_id">MCTS ID *</label>
              <input
                type="text"
                id="mcts_id"
                name="mcts_id"
                value={formData.mcts_id}
                onChange={handleChange}
                placeholder="Unique MCTS identifier"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone_number">Phone Number</label>
              <input
                type="tel"
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                pattern="[0-9]{10}"
                placeholder="10-digit mobile number"
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
              <label htmlFor="beneficiary_type">Beneficiary Type *</label>
              <select
                id="beneficiary_type"
                name="beneficiary_type"
                value={formData.beneficiary_type}
                onChange={handleChange}
                required
              >
                <option value="individual">Individual</option>
                <option value="child">Child</option>
                <option value="mother_child">Mother & Child</option>
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
              <label htmlFor="age">Age</label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                min="0"
                placeholder="Age in years"
              />
            </div>

            <div className="form-group">
              <label htmlFor="weight">Weight (kg)</label>
              <input
                type="number"
                id="weight"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="Weight in kilograms"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="assigned_asha_id">Assigned ASHA Worker</label>
            <select
              id="assigned_asha_id"
              name="assigned_asha_id"
              value={formData.assigned_asha_id}
              onChange={handleChange}
            >
              <option value="">Select ASHA Worker</option>
              {workers.map(worker => (
                <option key={worker.id} value={worker.id}>
                  {worker.first_name} {worker.last_name} ({worker.worker_id})
                </option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Beneficiary'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const Beneficiaries: React.FC = () => {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchWorkers();
  }, []);

  useEffect(() => {
    fetchBeneficiaries();
  }, [currentPage, searchQuery, filterType]);

  const fetchWorkers = async () => {
    try {
      const response = await api.get<PaginatedResponse<Worker>>('/workers', {
        params: { page: 1, page_size: 1000 },
      });
      setWorkers(response.data.items);
    } catch (error) {
      console.error('Failed to fetch workers:', error);
    }
  };

  const fetchBeneficiaries = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        page_size: pageSize,
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      if (filterType) {
        params.beneficiary_type = filterType;
      }

      const response = await api.get<PaginatedResponse<Beneficiary>>('/beneficiaries', { params });
      setBeneficiaries(response.data.items);
      setTotalCount(response.data.total);
    } catch (error) {
      console.error('Failed to fetch beneficiaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleFilter = (filters: Record<string, any>) => {
    if (filters.beneficiary_type !== undefined) {
      setFilterType(filters.beneficiary_type);
      setCurrentPage(1);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowClick = (beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary);
  };

  const handleAddSuccess = () => {
    fetchBeneficiaries();
  };

  const getWorkerName = (workerId?: number) => {
    if (!workerId) return 'N/A';
    const worker = workers.find(w => w.id === workerId);
    return worker ? `${worker.first_name} ${worker.last_name}` : 'N/A';
  };

  const columns: Column<Beneficiary>[] = [
    {
      key: 'first_name',
      label: 'Name',
      render: (_, row) => `${row.first_name} ${row.last_name}`,
    },
    {
      key: 'mcts_id',
      label: 'MCTS ID',
    },
    {
      key: 'beneficiary_type',
      label: 'Beneficiary Type',
      render: (value) => {
        const typeLabels: Record<string, string> = {
          individual: 'Individual',
          child: 'Child',
          mother_child: 'Mother & Child',
        };
        return typeLabels[value] || value;
      },
    },
    {
      key: 'assigned_asha_id',
      label: 'Assigned ASHA Worker',
      render: (value) => getWorkerName(value),
    },
    {
      key: 'age',
      label: 'Age',
      render: (value) => value ? `${value} years` : 'N/A',
    },
  ];

  const detailFields = selectedBeneficiary
    ? [
        { label: 'MCTS ID', value: selectedBeneficiary.mcts_id, type: 'text' as const },
        { label: 'Name', value: `${selectedBeneficiary.first_name} ${selectedBeneficiary.last_name}`, type: 'text' as const },
        { label: 'Beneficiary Type', value: selectedBeneficiary.beneficiary_type, type: 'text' as const },
        { label: 'Phone', value: selectedBeneficiary.phone_number || 'N/A', type: 'text' as const },
        { label: 'Email', value: selectedBeneficiary.email || 'N/A', type: 'text' as const },
        { label: 'Aadhar ID', value: selectedBeneficiary.aadhar_id || 'N/A', type: 'text' as const },
        { label: 'Address', value: selectedBeneficiary.address || 'N/A', type: 'text' as const },
        { label: 'Age', value: selectedBeneficiary.age ? `${selectedBeneficiary.age} years` : 'N/A', type: 'text' as const },
        { label: 'Weight', value: selectedBeneficiary.weight ? `${selectedBeneficiary.weight} kg` : 'N/A', type: 'text' as const },
        { label: 'Assigned ASHA Worker', value: getWorkerName(selectedBeneficiary.assigned_asha_id), type: 'text' as const },
        { label: 'Created At', value: selectedBeneficiary.created_at, type: 'date' as const },
        { label: 'Updated At', value: selectedBeneficiary.updated_at, type: 'date' as const },
        { label: 'Metadata', value: selectedBeneficiary.meta_data, type: 'json' as const },
      ]
    : [];

  const filterOptions = [
    { label: 'All Types', value: '' },
    { label: 'Individual', value: 'individual' },
    { label: 'Child', value: 'child' },
    { label: 'Mother & Child', value: 'mother_child' },
  ];

  return (
    <div className="beneficiaries-page">
      <div className="page-header">
        <h1>Beneficiaries Management</h1>
        <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
          + Add Beneficiary
        </button>
      </div>

      <div className="filter-section">
        <label htmlFor="type-filter">Filter by Type:</label>
        <select
          id="type-filter"
          value={filterType}
          onChange={(e) => handleFilter({ beneficiary_type: e.target.value })}
          className="filter-select"
        >
          {filterOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={beneficiaries}
        totalCount={totalCount}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        onRowClick={handleRowClick}
        loading={loading}
        searchPlaceholder="Search by MCTS ID or name..."
      />

      <DetailModal
        title="Beneficiary Details"
        fields={detailFields}
        isOpen={!!selectedBeneficiary}
        onClose={() => setSelectedBeneficiary(null)}
      />

      <AddBeneficiaryForm
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />
    </div>
  );
};

export default Beneficiaries;
