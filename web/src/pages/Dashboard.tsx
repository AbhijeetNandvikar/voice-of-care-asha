import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../services/api';
import { parseUTCDate } from '../utils/dateUtils';
import './Dashboard.css';

interface DashboardStats {
  total_workers: number;
  total_beneficiaries: number;
  total_visits: number;
  pending_syncs: number;
}

interface VisitByDate {
  date: string;
  count: number;
}

interface StatCardProps {
  title: string;
  value: number | null;
  icon: string;
  color: string;
  onClick?: () => void;
  loading: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, onClick, loading }) => (
  <div
    className={`stat-card ${onClick ? 'stat-card--clickable' : ''}`}
    style={{ '--card-color': color } as React.CSSProperties}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
  >
    <div className="stat-card__icon" style={{ background: color }}>
      <span>{icon}</span>
    </div>
    <div className="stat-card__body">
      <p className="stat-card__title">{title}</p>
      {loading ? (
        <div className="stat-card__skeleton" />
      ) : (
        <p className="stat-card__value">{value?.toLocaleString('en-IN') ?? '—'}</p>
      )}
    </div>
    {onClick && <span className="stat-card__arrow">→</span>}
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const date = parseUTCDate(label);
    const displayLabel = date
      ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      : label;
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip__label">{displayLabel}</p>
        <p className="chart-tooltip__value">{payload[0].value} visits</p>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [visitsByDate, setVisitsByDate] = useState<VisitByDate[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [chartError, setChartError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const res = await api.get<DashboardStats>('/dashboard/stats');
      setStats(res.data);
    } catch {
      setStatsError('Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchVisitsByDate = useCallback(async () => {
    setChartLoading(true);
    setChartError(null);
    try {
      const res = await api.get<VisitByDate[]>('/dashboard/visits-by-date');
      setVisitsByDate(res.data);
    } catch {
      setChartError('Failed to load chart data');
    } finally {
      setChartLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchVisitsByDate();
  }, [fetchStats, fetchVisitsByDate]);

  const formatXAxisTick = (dateStr: string) => {
    const date = parseUTCDate(dateStr);
    if (!date) return dateStr;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const statCards = [
    {
      title: 'Total Workers',
      value: stats?.total_workers ?? null,
      icon: '👩‍⚕️',
      color: '#667eea',
      path: '/workers',
    },
    {
      title: 'Total Beneficiaries',
      value: stats?.total_beneficiaries ?? null,
      icon: '👨‍👩‍👧',
      color: '#43b89c',
      path: '/beneficiaries',
    },
    {
      title: 'Total Visits',
      value: stats?.total_visits ?? null,
      icon: '🏥',
      color: '#f5a623',
      path: '/visits',
    },
    {
      title: 'Pending Syncs',
      value: stats?.pending_syncs ?? null,
      icon: '🔄',
      color: '#e05c5c',
      path: '/sync-logs',
    },
  ];

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard__header">
        <div>
          <h1 className="dashboard__title">Dashboard</h1>
          <p className="dashboard__subtitle">Overview of ASHA worker activities and field visits</p>
        </div>
        <button
          className="dashboard__refresh-btn"
          onClick={() => { fetchStats(); fetchVisitsByDate(); }}
          title="Refresh data"
        >
          ↺ Refresh
        </button>
      </div>

      {/* Error banners */}
      {statsError && (
        <div className="dashboard__error">
          {statsError} —{' '}
          <button onClick={fetchStats}>Retry</button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="stat-cards-grid">
        {statCards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            color={card.color}
            loading={statsLoading}
            onClick={() => navigate(card.path)}
          />
        ))}
      </div>

      {/* Chart */}
      <div className="dashboard__chart-card">
        <div className="dashboard__chart-header">
          <div>
            <h2 className="dashboard__chart-title">Visits Over the Last 30 Days</h2>
            <p className="dashboard__chart-subtitle">Daily field visit activity</p>
          </div>
        </div>

        {chartError && (
          <div className="dashboard__error">
            {chartError} —{' '}
            <button onClick={fetchVisitsByDate}>Retry</button>
          </div>
        )}

        <div className="dashboard__chart-body">
          {chartLoading ? (
            <div className="dashboard__chart-loading">
              <div className="spinner" />
              <p>Loading chart...</p>
            </div>
          ) : visitsByDate.length === 0 ? (
            <div className="dashboard__chart-empty">
              <span>📊</span>
              <p>No visit data for the last 30 days</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={visitsByDate}
                margin={{ top: 8, right: 24, left: 0, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatXAxisTick}
                  tick={{ fontSize: 12, fill: '#666' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: '#666' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="count"
                  fill="#667eea"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
