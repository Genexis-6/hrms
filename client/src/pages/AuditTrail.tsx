import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Filter, ChevronLeft, ChevronRight, ScrollText, Calendar, User } from 'lucide-react';
import { getAuditLogs } from '../services/api';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';
import type { IAuditLog } from '../types';

const ENTITIES = ['', 'Staff', 'Leave', 'Promotion', 'Attendance', 'User', 'Payroll'];
const ACTIONS = ['', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'CHECK_IN', 'CHECK_OUT'];

const actionColors: Record<string, string> = {
  CREATE: 'bg-blue-50 text-blue-700 border border-blue-200',
  UPDATE: 'bg-amber-50 text-amber-700 border border-amber-200',
  DELETE: 'bg-red-50 text-red-700 border border-red-200',
  APPROVE: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  REJECT: 'bg-red-50 text-red-700 border border-red-200',
  CHECK_IN: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  CHECK_OUT: 'bg-purple-50 text-purple-700 border border-purple-200',
};

const entityIcons: Record<string, string> = {
  Staff: '👤',
  Leave: '📝',
  Promotion: '📈',
  Attendance: '🕐',
  Payroll: '💰',
  User: '🔑',
};

export default function AuditTrail() {
  const [logs, setLogs] = useState<IAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '15' };
      if (entityFilter) params.entity = entityFilter;
      if (actionFilter) params.action = actionFilter;
      const { data } = await getAuditLogs(params);
      setLogs(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch {
      addToast('Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, entityFilter, actionFilter, addToast]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Audit Trail</h1>
          <p className="text-sm text-gray-500 mt-0.5">Every action in the system is tracked and immutable</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 text-sm text-gray-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>All actions logged</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={entityFilter}
            onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 appearance-none bg-white"
          >
            {ENTITIES.map((e) => (
              <option key={e} value={e}>{e || 'All Entities'}</option>
            ))}
          </select>
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 appearance-none bg-white"
          >
            {ACTIONS.map((a) => (
              <option key={a} value={a}>{a || 'All Actions'}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ScrollText className="w-12 h-12 text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">No audit records</p>
            <p className="text-sm text-gray-400 mt-1">System activity will appear here</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-50">
              {logs.map((log) => (
                <div key={log._id}>
                  <div
                    onClick={() => setExpandedLog(expandedLog === log._id ? null : log._id)}
                    className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50/50 cursor-pointer transition-colors"
                  >
                    <span className="text-lg flex-shrink-0">{entityIcons[log.entity] || '📋'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">{log.description}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${actionColors[log.action] || 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
                          {log.action}
                        </span>
                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {log.changedBy?.name || 'System'}
                        </span>
                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(log.timestamp).toLocaleString('en-NG', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {expandedLog === log._id && (
                    <div className="px-5 py-4 bg-gray-50/50 border-t border-gray-100">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Entity</p>
                          <p className="text-gray-900 font-medium">{log.entity}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Document ID</p>
                          <p className="text-gray-900 font-mono text-xs">{log.documentId}</p>
                        </div>
                        {log.changes && Object.keys(log.changes).length > 0 && (
                          <div className="sm:col-span-2">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Changes</p>
                            <pre className="bg-white p-3 rounded-lg border border-gray-200 text-xs overflow-x-auto font-mono text-gray-700">
                              {JSON.stringify(log.changes, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 p-4 border-t border-gray-100 bg-gray-50/30">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40 hover:bg-white transition-all"
                >
                  <ChevronLeft className="w-4 h-4 inline mr-1" /> Previous
                </button>
                <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40 hover:bg-white transition-all"
                >
                  Next <ChevronRight className="w-4 h-4 inline ml-1" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
