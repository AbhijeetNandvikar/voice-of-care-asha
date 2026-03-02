import React, { useState, useEffect } from 'react';
import api from '../services/api';
import type { Worker } from '../types';
import './DataExport.css';

interface ReportRequest {
  visit_type: 'hbnc' | 'anc' | 'pnc';
  start_date: string;
  end_date: string;
  worker_id?: number;
}

interface ReportResponse {
  report_id: string;
  download_url: string;
  expires_at: string;
}

export const DataExport: React.FC = () => {
  const [formData, setFormData] = useState<ReportRequest>({
    visit_type: 'hbnc',
    start_date: '',
    end_date: '',
    worker_id: undefined,
  });
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportResponse | null>(null);

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const response = await api.get<{ items: Worker[] }>('/workers', {
        params: { page: 1, page_size: 1000 },
      });
      setWorkers(response.data.items);
    } catch (err) {
      console.error('Failed to fetch workers:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'worker_id' ? (value ? parseInt(value) : undefined) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setReportData(null);

    // Validate required fields
    if (!formData.start_date || !formData.end_date) {
      setError('Please select both start and end dates');
      return;
    }

    // Validate date range
    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      setError('Start date must be before or equal to end date');
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        visit_type: formData.visit_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
      };

      if (formData.worker_id) {
        payload.worker_id = formData.worker_id;
      }

      const response = await api.post<ReportResponse>('/reports/generate', payload);
      setReportData(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to generate report';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getExpirationTime = () => {
    if (!reportData) return '';
    
    const expiresAt = new Date(reportData.expires_at);
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins <= 0) {
      return 'Expired';
    }
    
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
  };

  return (
    <div className="data-export-page">
      <div className="page-header">
        <h1>Data Export</h1>
        <p className="page-description">
          Generate government-compliant Excel reports for HBNC visits
        </p>
      </div>

      <div className="export-container">
        <div className="export-card">
          <h2>Report Parameters</h2>
          
          <form onSubmit={handleSubmit} className="export-form">
            <div className="form-group">
              <label htmlFor="visit_type">Visit Type *</label>
              <select
                id="visit_type"
                name="visit_type"
                value={formData.visit_type}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="hbnc">HBNC (Home-Based Newborn Care)</option>
                <option value="anc" disabled>ANC (Antenatal Care) - Coming Soon</option>
                <option value="pnc" disabled>PNC (Postnatal Care) - Coming Soon</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="start_date">Start Date *</label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-group">
                <label htmlFor="end_date">End Date *</label>
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="worker_id">ASHA Worker (Optional)</label>
              <select
                id="worker_id"
                name="worker_id"
                value={formData.worker_id || ''}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">All Workers</option>
                {workers
                  .filter(w => w.worker_type === 'asha_worker')
                  .map(worker => (
                    <option key={worker.id} value={worker.id}>
                      {worker.first_name} {worker.last_name} ({worker.worker_id})
                    </option>
                  ))}
              </select>
              <small className="form-hint">
                Leave empty to include all ASHA workers
              </small>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠</span>
                {error}
              </div>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Generating Report...
                  </>
                ) : (
                  'Generate Report'
                )}
              </button>
            </div>
          </form>
        </div>

        {reportData && (
          <div className="report-result">
            <div className="success-icon">✓</div>
            <h3>Report Generated Successfully</h3>
            <p className="report-id">Report ID: {reportData.report_id}</p>
            
            <div className="download-section">
              <a
                href={reportData.download_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-download"
              >
                <span className="download-icon">⬇</span>
                Download Report
              </a>
              
              <div className="expiration-notice">
                <span className="clock-icon">🕐</span>
                Link expires in {getExpirationTime()}
              </div>
            </div>

            <div className="report-info">
              <p>
                <strong>Note:</strong> The download link will expire in 15 minutes for security reasons.
                Please download the report now.
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="loading-overlay">
            <div className="loading-content">
              <div className="loading-spinner"></div>
              <p>Generating your report...</p>
              <small>This may take a few moments</small>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataExport;
