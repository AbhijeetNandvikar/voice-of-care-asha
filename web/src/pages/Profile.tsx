/**
 * Profile Page
 * Displays logged-in user's profile information
 * Requirements: 17
 */

import React from 'react';
import { getWorkerProfile } from '../services/authService';
import './Profile.css';

export const Profile: React.FC = () => {
  const worker = getWorkerProfile();

  if (!worker) {
    return (
      <div className="profile-page">
        <div className="error-message">
          <span className="error-icon">⚠</span>
          Unable to load profile information. Please log in again.
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>Profile</h1>
        <p className="page-description">
          View your profile information and account details
        </p>
      </div>

      <div className="profile-container">
        {/* Profile Information Card */}
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-photo">
              {worker.profile_photo_url ? (
                <img src={worker.profile_photo_url} alt="Profile" />
              ) : (
                <div className="photo-placeholder">
                  {worker.first_name[0]}{worker.last_name[0]}
                </div>
              )}
            </div>
            <div className="profile-title">
              <h2>{worker.first_name} {worker.last_name}</h2>
              <p className="worker-type">{worker.worker_type.replace('_', ' ').toUpperCase()}</p>
            </div>
          </div>

          <div className="profile-details">
            <div className="detail-row">
              <span className="detail-label">Worker ID</span>
              <span className="detail-value">{worker.worker_id}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Email</span>
              <span className="detail-value">{worker.email || 'Not provided'}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Phone Number</span>
              <span className="detail-value">{worker.phone_number}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Address</span>
              <span className="detail-value">{worker.address || 'Not provided'}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Member Since</span>
              <span className="detail-value">
                {new Date(worker.created_at).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Earnings Card - Placeholder for future enhancement */}
        <div className="earnings-card">
          <h3>Earnings</h3>
          <p className="coming-soon-text">
            Earnings tracking will be available in a future update
          </p>
          
          <div className="earnings-placeholder">
            <div className="earnings-item">
              <span className="earnings-label">This Month</span>
              <span className="earnings-value">--</span>
            </div>
            <div className="earnings-item">
              <span className="earnings-label">Total Earnings</span>
              <span className="earnings-value">--</span>
            </div>
          </div>

          <div className="info-notice">
            <span className="info-icon">ℹ</span>
            <p>
              Earnings data will be automatically calculated based on your completed visits
              and synced with the payment system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
