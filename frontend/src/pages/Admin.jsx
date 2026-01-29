import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Loader2, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, FileText, Database } from 'lucide-react';

export default function AdminDashboard() {
  const { logout } = useAuth();
  const [selectedTable, setSelectedTable] = useState('User_Master');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [totalRecords, setTotalRecords] = useState(0);

  const tables = ['User_Master', 'Contacts', 'Activities', 'Master_Schedule'];

  const fetchTableData = async (newPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/admin/table/${selectedTable}`, {
        params: {
          page: newPage,
          page_size: pageSize,
        },
      });

      setData(response.data.data || []);
      setTotalRecords(response.data.total || 0);
      setPage(newPage);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load table data');
    } finally {
      setLoading(false);
    }
  };

  const generateSchedule = async () => {
    if (!window.confirm('Generate new schedule for all MRs? This will overwrite Master_Schedule.')) {
      return;
    }

    setGenerating(true);
    setError(null);
    setProgress(0);
    setStatusMessage('Initializing schedule generation...');

    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? prev : prev + 10));
    }, 800);

    try {
      const response = await api.post('/admin/generate-schedule');
      clearInterval(interval);
      setProgress(100);
      setStatusMessage(response.data.message || 'Schedule generated successfully!');

      if (selectedTable === 'Master_Schedule') {
        fetchTableData(1);
      }
    } catch (err) {
      clearInterval(interval);
      setError(err.response?.data?.detail || 'Failed to generate schedule');
      setStatusMessage('Generation failed');
      setProgress(0);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchTableData(1);
  }, [selectedTable]);

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  const totalPages = Math.ceil(totalRecords / pageSize);
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  const handlePrevPage = () => {
    if (canGoPrev) fetchTableData(page - 1);
  };

  const handleNextPage = () => {
    if (canGoNext) fetchTableData(page + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-950 p-6">
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Admin Console
            </h1>
            <p className="text-zinc-700 dark:text-zinc-300 mt-1 font-semibold">
              Data management and scheduling
            </p>
          </div>
          <button
            onClick={logout}
            className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:from-red-500 hover:to-red-400 transition-all shadow-md text-sm font-bold flex items-center gap-2"
          >
            Sign Out
          </button>
        </div>

        {/* Schedule Generator */}
        <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl rounded-xl shadow-sm p-8 border border-zinc-200/50 dark:border-white/10">
          <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-6 flex items-center gap-3">
            <RefreshCw size={24} className="text-indigo-600 dark:text-indigo-400" />
            Schedule Generator
          </h2>

          <button
            onClick={generateSchedule}
            disabled={generating}
            className={`w-full sm:w-auto px-6 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md ${generating
              ? 'bg-zinc-300 cursor-not-allowed text-zinc-500'
              : 'bg-gradient-to-r from-zinc-900 to-zinc-700 hover:from-zinc-800 hover:to-zinc-600 text-white dark:from-zinc-100 dark:to-zinc-300 dark:text-zinc-900'
              }`}
          >
            {generating ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Processing...
              </>
            ) : (
              'Generate Schedule'
            )}
          </button>

          {generating && (
            <div className="mt-8 space-y-4">
              <div className="w-full bg-zinc-100 rounded-full h-2 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="bg-zinc-900 dark:bg-zinc-100 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {statusMessage}
              </p>
            </div>
          )}
        </div>

        {/* Data Inspector */}
        <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl rounded-xl shadow-sm p-8 border border-zinc-200/50 dark:border-white/10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-3">
              <Database size={24} className="text-indigo-600 dark:text-indigo-400" />
              Dataset Inspector
            </h2>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                disabled={loading || generating}
                className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none w-full sm:w-60 text-sm font-semibold"
              >
                {tables.map((table) => (
                  <option key={table} value={table}>
                    {table}
                  </option>
                ))}
              </select>

              <button
                onClick={() => fetchTableData(1)}
                disabled={loading || generating}
                className={`px-4 py-2 rounded-lg font-bold transition flex items-center justify-center gap-2 shadow-sm text-sm border ${loading || generating
                  ? 'bg-zinc-100 text-zinc-400 border-zinc-200'
                  : 'bg-gradient-to-r from-zinc-100 to-zinc-200 dark:bg-zinc-800 border-zinc-200 hover:bg-zinc-200 text-zinc-900 dark:border-zinc-700 dark:text-zinc-300'
                  }`}
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                Refresh
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-900/30 flex items-center gap-2 text-sm">
              <AlertCircle size={18} />
              <p>{error}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-800 dark:border-zinc-200 mx-auto"></div>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-20 text-zinc-400 flex flex-col items-center gap-4">
              <FileText size={48} className="opacity-40" />
              <p className="text-lg font-bold text-zinc-500">No results</p>
            </div>
          ) : (
            <>
              {/* Scrollable Table */}
              <div className="overflow-x-auto overflow-y-auto max-h-[600px] border border-zinc-200 dark:border-zinc-800 rounded-lg">
                <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                  <thead className="bg-zinc-900 text-white dark:bg-zinc-950 sticky top-0 z-10">
                    <tr>
                      {columns.map((col) => (
                        <th
                          key={col}
                          className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider border-b border-zinc-700"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-800">
                    {data.map((row, i) => (
                      <tr key={i} className="hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors even:bg-zinc-50 dark:even:bg-zinc-900/50">
                        {columns.map((col) => (
                          <td
                            key={col}
                            className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-100 font-extrabold"
                          >
                            {row[col] ?? '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalRecords > 0 && (
                <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-zinc-700 dark:text-zinc-300">
                  <p>
                    Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalRecords)} of {totalRecords}
                  </p>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={handlePrevPage}
                      disabled={!canGoPrev || loading}
                      className={`px-3 py-1.5 rounded border flex items-center gap-1 ${!canGoPrev || loading
                        ? 'bg-zinc-50 text-zinc-300 border-zinc-100 cursor-not-allowed'
                        : 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                        }`}
                    >
                      <ChevronLeft size={14} />
                      Prev
                    </button>

                    <span className="font-medium">Page {page}</span>

                    <button
                      onClick={handleNextPage}
                      disabled={!canGoNext || loading}
                      className={`px-3 py-1.5 rounded border flex items-center gap-1 ${!canGoNext || loading
                        ? 'bg-zinc-50 text-zinc-300 border-zinc-100 cursor-not-allowed'
                        : 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                        }`}
                    >
                      Next
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}