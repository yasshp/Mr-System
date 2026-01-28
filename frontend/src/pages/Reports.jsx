import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { BarChart, UserCheck, Globe, MapPin, Download, FileText, Calendar, AlertCircle } from 'lucide-react';

export default function Reports() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState('activity');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [mrId, setMrId] = useState(isAdmin ? '' : user.user_id);
  const [mrs, setMrs] = useState([]);
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const tabs = [
    { id: 'activity', label: 'Activity Report', icon: BarChart, hasDateRange: true },
    { id: 'compliance', label: 'Compliance Report', icon: UserCheck, hasDateRange: false },
    { id: 'customer-behaviour', label: 'Customer Behaviour Report', icon: Globe, hasDateRange: false },
    { id: 'travel', label: 'Travel KM Report', icon: MapPin, hasDateRange: false },
  ];

  useEffect(() => {
    if (isAdmin) {
      api.get('/admin/mrs')
        .then(res => setMrs(res.data || []))
        .catch(err => {
          console.error('Failed to load MRs:', err);
          setMrs([]);
        });
    }
  }, [isAdmin]);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    setData([]);
    setTotalCount(0);

    try {
      let endpoint = `/reports/${activeTab}?mr_id=${mrId}`;
      if (tabs.find(t => t.id === activeTab).hasDateRange) {
        endpoint += `&start_date=${startDate}&end_date=${endDate}`;
      } else {
        endpoint += `&month=${month}&year=${year}`;
      }

      const response = await api.get(endpoint);
      setData(response.data.data || response.data || []);
      setTotalCount(response.data.total_count || response.data.length || 0);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab, startDate, endDate, month, year, mrId]);

  const exportToCSV = () => {
    if (data.length === 0) return;

    const csvContent = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeTab}-report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = data.length > 0
    ? Object.keys(data[0]).filter(key => key.toLowerCase() !== 'actions')
    : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-950 p-6">
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif text-zinc-900 dark:text-zinc-100 tracking-tight">
              Reports
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              Analyze performance and compliance
            </p>
          </div>
          <button
            onClick={logout}
            className="px-6 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm font-medium"
          >
            Sign Out
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 rounded-xl font-medium text-sm transition-all border flex items-center justify-center gap-2 ${activeTab === tab.id
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-md'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl p-5 rounded-xl border border-zinc-200/50 dark:border-white/10 shadow-sm">
          {tabs.find(t => t.id === activeTab).hasDateRange ? (
            <>
              <div className="flex items-center gap-3 flex-1">
                <label className="font-medium text-zinc-700 dark:text-zinc-300 text-sm">Start:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none flex-1 text-sm"
                />
              </div>
              <div className="flex items-center gap-3 flex-1">
                <label className="font-medium text-zinc-700 dark:text-zinc-300 text-sm">End:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none flex-1 text-sm"
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 flex-1">
                <label className="font-medium text-zinc-700 dark:text-zinc-300 text-sm">Month:</label>
                <select
                  value={month}
                  onChange={e => setMonth(parseInt(e.target.value))}
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none flex-1 text-sm"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3 flex-1">
                <label className="font-medium text-zinc-700 dark:text-zinc-300 text-sm">Year:</label>
                <input
                  type="number"
                  value={year}
                  onChange={e => setYear(parseInt(e.target.value))}
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none flex-1 text-sm"
                  min={2020}
                  max={2030}
                />
              </div>
            </>
          )}

          {isAdmin && (
            <div className="flex items-center gap-3 flex-1">
              <label className="font-medium text-zinc-700 dark:text-zinc-300 text-sm">MR:</label>
              <select
                value={mrId}
                onChange={e => setMrId(e.target.value)}
                className="px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none flex-1 text-sm"
              >
                {mrs.map(mr => (
                  <option key={mr.mr_id} value={mr.mr_id}>
                    {mr.display_name || mr.mr_id} ({mr.mr_id})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Report Content */}
        <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl p-8 rounded-xl border border-zinc-200/50 dark:border-white/10 shadow-sm min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-800 dark:border-zinc-200 border-t-transparent"></div>
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">Generatng report...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-500">
              <AlertCircle size={48} className="mx-auto mb-4 opacity-80" />
              <p className="text-lg font-medium">{error}</p>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-20 text-zinc-400 dark:text-zinc-600">
              <FileText size={64} className="mx-auto mb-4 opacity-50" />
              <p className="text-xl font-medium">No data available</p>
              <p className="mt-2 text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                  {tabs.find(t => t.id === activeTab).label}
                </h2>
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all flex items-center gap-2 text-sm font-medium shadow-sm"
                >
                  <Download size={16} />
                  Export CSV
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                  <thead className="bg-zinc-50 dark:bg-zinc-900/50">
                    <tr>
                      {columns.map(col => (
                        <th key={col} className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                          {col.replace('_', ' ').toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-800">
                    {data.map((row, index) => (
                      <tr key={index} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                        {columns.map(col => (
                          <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-zinc-700 dark:text-zinc-300">
                            {row[col] ?? '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {activeTab === 'activity' && totalCount > 0 && (
                <div className="mt-6 flex justify-end gap-8 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                  <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
                    Total: <span className="text-zinc-900 dark:text-white font-bold">{totalCount}</span>
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}