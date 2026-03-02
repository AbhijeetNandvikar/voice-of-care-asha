/**
 * Profile Page
 * View and manage user profile
 */

import { getWorkerProfile } from '../services/authService';

export default function Profile() {
  const worker = getWorkerProfile();

  if (!worker) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Profile</h1>
      <div className="ux4g-card">
        <div className="ux4g-card-body">
          <p><strong>Name:</strong> {worker.first_name} {worker.last_name}</p>
          <p><strong>Worker ID:</strong> {worker.worker_id}</p>
          <p><strong>Type:</strong> {worker.worker_type}</p>
          <p><strong>Phone:</strong> {worker.phone_number}</p>
          {worker.email && <p><strong>Email:</strong> {worker.email}</p>}
          {worker.address && <p><strong>Address:</strong> {worker.address}</p>}
        </div>
      </div>
    </div>
  );
}
