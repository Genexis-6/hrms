import { useState, useEffect, useCallback } from 'react';
import {
  Clock, LogIn, LogOut, UserCheck, Search,
  Calendar, Users, Activity, History,
  Timer, Zap
} from 'lucide-react';
import { getTodayAttendance, checkIn, checkOut, getAllStaff, getActiveStaffNow } from '../services/api';
import { formatDateTime } from '../lib/utils';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';
import type { IAttendance, IStaff } from '../types';

interface ActivityLog {
  id: string;
  staffName: string;
  department: string;
  action: 'check-in' | 'check-out';
  time: string;
  timestamp: Date;
}

export default function Attendance() {
  const [records, setRecords] = useState<IAttendance[]>([]);
  const [activeRecords, setActiveRecords] = useState<IAttendance[]>([]);
  const [staffList, setStaffList] = useState<IStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [processingIn, setProcessingIn] = useState(false);
  const [processingOutId, setProcessingOutId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const [attRes, activeRes, staffRes] = await Promise.all([
        getTodayAttendance(),
        getActiveStaffNow(),
        getAllStaff(),
      ]);
      setRecords(attRes.data);
      setActiveRecords(activeRes.data);
      const staffData = staffRes.data?.data || staffRes.data;
      setStaffList(Array.isArray(staffData) ? staffData : []);
    } catch {
      addToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const addToActivityLog = (staffName: string, department: string, action: 'check-in' | 'check-out') => {
    setActivityLog(prev => [{
      id: Date.now().toString(),
      staffName,
      department,
      action,
      time: new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date(),
    }, ...prev].slice(0, 15));
  };

  // ─── Check In ──────────────────────────────────────────────

  const handleCheckIn = async () => {
    if (!selectedStaff) return;
    setProcessingIn(true);
    try {
      console.log('Checking in staff:', selectedStaff);
      await checkIn(selectedStaff);
      const staff = staffList.find(s => s._id === selectedStaff);
      const name = `${staff?.firstName} ${staff?.lastName}`;
      addToast(`${name} checked in`, 'success');
      addToActivityLog(name, staff?.department || '', 'check-in');
      setSelectedStaff('');
      fetchAll();
    } catch (err: any) {
      console.error('Check-in error:', err);
      addToast(err?.response?.data?.message || 'Check-in failed', 'error');
    } finally {
      setProcessingIn(false);
    }
  };

  // ─── Check Out ─────────────────────────────────────────────

  const handleCheckOut = async (staffId: string) => {
    if (!staffId) {
      addToast('Invalid staff ID', 'error');
      return;
    }

    console.log('Checking out staff:', staffId);
    setProcessingOutId(staffId);

    try {
      const response = await checkOut(staffId);
      console.log('Checkout response:', response.data);

      const activeRecord = activeRecords.find(r =>
        r.staffId?._id === staffId
      );
      const name = activeRecord
        ? `${activeRecord.staffId?.firstName} ${activeRecord.staffId?.lastName}`
        : 'Staff member';
      addToast(`${name} checked out`, 'success');
      addToActivityLog(name, activeRecord?.staffId?.department || '', 'check-out');
      fetchAll();
    } catch (err: any) {
      console.error('Checkout error:', err);
      const message = err?.response?.data?.message || 'Check-out failed';
      addToast(message, 'error');
    } finally {
      setProcessingOutId(null);
    }
  };

  // ─── Helper to get staff ID from record ────────────────────

  const getStaffIdFromRecord = (record: IAttendance): string => {
    if (typeof record.staffId === 'string') return record.staffId;
    if (record.staffId && typeof record.staffId === 'object' && '_id' in record.staffId) {
      return record.staffId._id;
    }
    return '';
  };

  const getStaffNameFromRecord = (record: IAttendance): string => {
    if (typeof record.staffId === 'object' && record.staffId) {
      return `${record.staffId.firstName} ${record.staffId.lastName}`;
    }
    return 'Unknown';
  };

  const getStaffDepartmentFromRecord = (record: IAttendance): string => {
    if (typeof record.staffId === 'object' && record.staffId) {
      return record.staffId.department || '';
    }
    return '';
  };

  // ─── Computed ──────────────────────────────────────────────

  const activeStaff = staffList.filter(s => s.isActive);
  const totalRecords = records.length;
  const activeNow = activeRecords.length;
  const completedToday = records.filter(r => r.checkOut).length;
  const lateArrivals = records.filter(r => r.status === 'Late').length;
  const attendanceRate = activeStaff.length > 0
    ? ((totalRecords / activeStaff.length) * 100).toFixed(0)
    : '0';

  const today = new Date();
  const dayName = today.toLocaleDateString('en-NG', { weekday: 'long' });
  const dateString = today.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Attendance</h1>
          <p className="text-sm text-gray-500 mt-0.5">{dayName}, {dateString}</p>
        </div>
        <div className="flex items-center gap-3 text-right">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-mono text-gray-600">
            {currentTime.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <MiniStat label="Records" value={totalRecords} sub={`${attendanceRate}% rate`} color="slate" />
        <MiniStat label="Active Now" value={activeNow} sub="clocked in" color="emerald" />
        <MiniStat label="Completed" value={completedToday} sub="checked out" color="blue" />
        <MiniStat label="Late" value={lateArrivals} sub="arrivals" color="amber" />
        <MiniStat label="Staff" value={activeStaff.length} sub="total active" color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Check-In Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-900 rounded-xl">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 text-sm">Clock In</h2>
                <p className="text-xs text-gray-500">Select staff member to begin</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-sm appearance-none bg-white cursor-pointer transition-all"
                >
                  <option value="">Select staff member...</option>
                  {activeStaff.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.firstName} {s.lastName} — {s.department}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleCheckIn}
                disabled={!selectedStaff || processingIn}
                className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-medium whitespace-nowrap"
              >
                <LogIn className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                {processingIn ? 'Clocking in...' : 'Check In'}
              </button>
            </div>
          </div>

          {/* All Records */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <h3 className="font-semibold text-gray-900 text-sm">All Records Today</h3>
              </div>
              <span className="text-xs text-gray-400 font-medium">{totalRecords} entries</span>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-7 h-7 rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin" />
                </div>
              ) : records.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Calendar className="w-10 h-10 text-gray-200 mb-3" />
                  <p className="text-gray-500 font-medium text-sm">No records yet</p>
                  <p className="text-gray-400 text-xs mt-1">Clock in to start tracking attendance</p>
                </div>
              ) : (
                <table className="w-full min-w-[550px]">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Staff</th>
                      <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Check In</th>
                      <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Check Out</th>
                      <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                      <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {records.map((r) => {
                      const staffId = getStaffIdFromRecord(r);
                      const duration = r.checkOut ? getDuration(r.checkIn, r.checkOut) : null;
                      const isActive = !r.checkOut;
                      const isProcessingThis = processingOutId === staffId;

                      return (
                        <tr key={r._id} className={`hover:bg-gray-50/50 transition-colors ${isActive ? 'bg-emerald-50/20' : ''}`}>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
                                {getStaffNameFromRecord(r).split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{getStaffNameFromRecord(r)}</p>
                                <p className="text-[11px] text-gray-400">{getStaffDepartmentFromRecord(r)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-xs text-gray-700 font-mono">
                            {formatDateTime(r.checkIn)}
                          </td>
                          <td className="px-5 py-3">
                            {r.checkOut ? (
                              <span className="text-xs text-gray-700 font-mono">{formatDateTime(r.checkOut)}</span>
                            ) : (
                              <button
                                onClick={() => handleCheckOut(staffId)}
                                disabled={isProcessingThis}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-all text-xs font-medium"
                              >
                                <LogOut className="w-3 h-3" />
                                {isProcessingThis ? 'Wait...' : 'Check Out'}
                              </button>
                            )}
                          </td>
                          <td className="px-5 py-3 text-xs text-gray-500 font-mono">
                            {duration || (isActive ? <Timer className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> : '—')}
                          </td>
                          <td className="px-5 py-3">
                            <StatusBadge status={r.status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Active Now */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <h3 className="font-semibold text-gray-900 text-sm">Active Now</h3>
              </div>
              <span className="text-xs text-gray-400 font-medium">{activeNow} people</span>
            </div>

            <div className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto">
              {activeRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <UserCheck className="w-8 h-8 text-gray-200 mb-2" />
                  <p className="text-gray-400 text-sm">No one clocked in</p>
                </div>
              ) : (
                activeRecords.map((r) => {
                  const staffId = getStaffIdFromRecord(r);
                  const isProcessingThis = processingOutId === staffId;

                  return (
                    <div key={r._id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-semibold">
                          {getStaffNameFromRecord(r).split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{getStaffNameFromRecord(r)}</p>
                          <p className="text-[11px] text-gray-400">{getStaffDepartmentFromRecord(r)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCheckOut(staffId)}
                        disabled={isProcessingThis}
                        className="inline-flex items-center gap-1 px-3 py-1.5 border-2 border-gray-200 text-gray-600 rounded-lg hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 disabled:opacity-40 transition-all text-xs font-medium"
                      >
                        <LogOut className="w-3 h-3" />
                        {isProcessingThis ? '...' : 'Out'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-gray-500" />
                <h3 className="font-semibold text-gray-900 text-sm">Live Activity</h3>
              </div>
            </div>

            <div className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto">
              {activityLog.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <History className="w-8 h-8 text-gray-200 mb-2" />
                  <p className="text-gray-400 text-sm">No activity yet</p>
                </div>
              ) : (
                activityLog.map((log) => (
                  <div key={log.id} className="px-5 py-2.5 flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${log.action === 'check-in' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">{log.staffName}</p>
                      <p className="text-[11px] text-gray-400">{log.department}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-[11px] font-medium ${log.action === 'check-in' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {log.action === 'check-in' ? 'In' : 'Out'}
                      </span>
                      <p className="text-[11px] text-gray-400">{log.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────

function MiniStat({ label, value, sub, color }: {
  label: string; value: number; sub: string;
  color: 'slate' | 'emerald' | 'blue' | 'amber' | 'purple';
}) {
  const colorMap: Record<string, string> = {
    slate: 'bg-slate-50 border-slate-200',
    emerald: 'bg-emerald-50 border-emerald-200',
    blue: 'bg-blue-50 border-blue-200',
    amber: 'bg-amber-50 border-amber-200',
    purple: 'bg-purple-50 border-purple-200',
  };
  const textMap: Record<string, string> = {
    slate: 'text-slate-700', emerald: 'text-emerald-700',
    blue: 'text-blue-700', amber: 'text-amber-700', purple: 'text-purple-700',
  };
  return (
    <div className={`rounded-xl border px-4 py-3 ${colorMap[color]}`}>
      <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
      <p className="text-[11px] font-medium text-gray-600">{label}</p>
      <p className={`text-[10px] ${textMap[color]}`}>{sub}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Present: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Late: 'bg-amber-50 text-amber-700 border-amber-200',
    Absent: 'bg-red-50 text-red-700 border-red-200',
    'Half-Day': 'bg-orange-50 text-orange-700 border-orange-200',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold border ${styles[status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
      {status}
    </span>
  );
}

function getDuration(start: string, end: string): string {
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}