/**
 * Login Page
 * Allows medical officers to authenticate
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, logout } from '../services/authService';

export default function Login() {
  const [workerId, setWorkerId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login({ worker_id: workerId, password });
      
      // Check if user is medical officer
      if (response.worker.worker_type !== 'medical_officer') {
        logout(); // Clear the token stored by login()
        setError('Access denied. Only medical officers can access the web dashboard.');
        setLoading(false);
        return;
      }
      
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="ux4g-container" style={{ maxWidth: '400px', margin: '100px auto' }}>
      <div className="ux4g-card">
        <div className="ux4g-card-header">
          <h2>Voice of Care - ASHA Dashboard</h2>
          <p>Medical Officer Login</p>
        </div>
        <div className="ux4g-card-body">
          <form onSubmit={handleSubmit}>
            <div className="ux4g-form-group">
              <label htmlFor="workerId">Worker ID</label>
              <input
                type="text"
                id="workerId"
                className="ux4g-input"
                value={workerId}
                onChange={(e) => setWorkerId(e.target.value)}
                placeholder="8-digit Worker ID"
                maxLength={8}
                required
              />
            </div>
            
            <div className="ux4g-form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                className="ux4g-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
            
            {error && (
              <div className="ux4g-alert ux4g-alert-danger" role="alert">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              className="ux4g-btn ux4g-btn-primary"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
