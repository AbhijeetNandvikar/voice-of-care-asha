/**
 * Layout Component
 * Main layout with sidebar navigation and header
 * Uses UX4G Design System styling
 */

import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { getWorkerProfile, logout } from '../services/authService';
import ChatDrawer from './ChatDrawer';
import './Layout.css';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const worker = getWorkerProfile();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/workers', label: 'Workers', icon: '👥' },
    { path: '/beneficiaries', label: 'Beneficiaries', icon: '👶' },
    { path: '/visits', label: 'Visits', icon: '📋' },
    { path: '/sync-logs', label: 'Sync Logs', icon: '🔄' },
    { path: '/data-export', label: 'Data Export', icon: '📥' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Voice of Care</h2>
          <p className="sidebar-subtitle">ASHA Dashboard</p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            {worker && (
              <>
                <div className="user-avatar">
                  {worker.profile_photo_url ? (
                    <img src={worker.profile_photo_url} alt="Profile" />
                  ) : (
                    <div className="avatar-placeholder">
                      {worker.first_name[0]}{worker.last_name[0]}
                    </div>
                  )}
                </div>
                <div className="user-details">
                  <p className="user-name">{worker.first_name} {worker.last_name}</p>
                  <p className="user-role">{worker.worker_type.replace('_', ' ')}</p>
                </div>
              </>
            )}
          </div>
          <button onClick={handleLogout} className="logout-btn">
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <main className="main-content">
        {/* Header with chat toggle */}
        <header className="content-header">
          <button 
            className="chat-toggle-btn"
            onClick={() => setIsChatOpen(true)}
            aria-label="Open AI Assistant"
          >
            💬 AI Assistant
          </button>
        </header>

        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>

      {/* Chat Drawer */}
      <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
