/**
 * Main App Component
 * Sets up routing with protected routes
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { setupAxiosInterceptors } from './services/authService';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Workers from './pages/Workers';
import Beneficiaries from './pages/Beneficiaries';
import Visits from './pages/Visits';
import SyncLogs from './pages/SyncLogs';
import DataExport from './pages/DataExport';
import Profile from './pages/Profile';
import './App.css';

function App() {
  useEffect(() => {
    // Setup axios interceptors for authentication
    setupAxiosInterceptors();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected routes with layout */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="workers" element={<Workers />} />
          <Route path="beneficiaries" element={<Beneficiaries />} />
          <Route path="visits" element={<Visits />} />
          <Route path="sync-logs" element={<SyncLogs />} />
          <Route path="data-export" element={<DataExport />} />
          <Route path="profile" element={<Profile />} />
          <Route index element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
