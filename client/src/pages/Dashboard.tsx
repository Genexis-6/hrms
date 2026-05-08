import { useState, useEffect, useCallback } from 'react';
import {
  Users, Clock, FileText, TrendingUp, AlertTriangle, Brain,
  RefreshCw, ArrowUpRight, ArrowDownRight, Building2, UserCheck,
  GraduationCap, Briefcase, Calendar, DollarSign, Activity,
  ShieldCheck, ScrollText, ChevronRight
} from 'lucide-react';
import { getDashboardStats, getStaffStats, getRecentActivity } from '../services/api';
import { useNavigate } from 'react-router-dom';
import type { IDashboardStats, IRecentActivity } from '../types';

export default function Dashboard() {
  const [stats, setStats] = useState<IDashboardStats>({
    totalStaff: 0, presentToday: 0, pendingLeave: 0, pendingPromotions: 0, ghostWorkerAlert: ''
  });
  const [staffStats, setStaffStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<IRecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const navigate = useNavigate();

  const fetchStats = useCallback(async () => {
    try {
      const [dashRes, statsRes, activityRes] = await Promise.all([
        getDashboardStats(),
        getStaffStats(),
        getRecentActivity(),
      ]);
      setStats(dashRes.data);
      setStaffStats(statsRes.data);
      setRecentActivity(activityRes.data || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 45000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin" />
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const attendanceRate = stats.totalStaff > 0 ? ((stats.presentToday / stats.totalStaff) * 100).toFixed(1) : '0';

  const actionColors: Record<string, string> = {
    CREATE: 'bg-blue-50 text-blue-600',
    UPDATE: 'bg-amber-50 text-amber-600',
    DELETE: 'bg-red-50 text-red-600',
    APPROVE: 'bg-emerald-50 text-emerald-600',
    REJECT: 'bg-red-50 text-red-600',
    CHECK_IN: 'bg-emerald-50 text-emerald-600',
    CHECK_OUT: 'bg-purple-50 text-purple-600',
  };

  const entityIcons: Record<string, string> = {
    Staff: '👤',
    Leave: '📝',
    Promotion: '📈',
    Attendance: '🕐',
    Payroll: '💰',
    User: '🔑',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Real-time overview • Updated {lastUpdated.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button onClick={fetchStats}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-sm font-medium text-gray-600 shadow-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Users} label="Total Staff" value={stats.totalStaff}
          sub={`${staffStats?.academicStaff || 0} Academic • ${staffStats?.nonAcademicStaff || 0} Non-Academic`}
          trend="up" trendValue="Active workforce" color="indigo" />
        <KPICard icon={UserCheck} label="Present Today" value={stats.presentToday}
          sub={`${attendanceRate}% attendance rate`}
          trend={parseFloat(attendanceRate) > 60 ? 'up' : 'down'} trendValue={`${attendanceRate}%`} color="emerald" />
        <KPICard icon={FileText} label="Pending Leaves" value={stats.pendingLeave}
          sub="Awaiting approval" trend={stats.pendingLeave > 0 ? 'down' : 'up'}
          trendValue={stats.pendingLeave > 0 ? 'Action needed' : 'All cleared'} color="amber" />
        <KPICard icon={TrendingUp} label="Pending Promotions" value={stats.pendingPromotions}
          sub="Ready for AI vetting" trend="up"
          trendValue={stats.pendingPromotions > 0 ? 'Requires attention' : 'Up to date'} color="purple" />
      </div>

      {/* Ghost Worker Alert */}
      {stats.ghostWorkerAlert && (
        <div className={`p-5 rounded-2xl flex items-start gap-4 ${
          stats.ghostWorkerAlert.includes('⚠️') ? 'bg-red-50 border border-red-200' : 'bg-emerald-50 border border-emerald-200'
        }`}>
          <div className={`p-2 rounded-xl ${stats.ghostWorkerAlert.includes('⚠️') ? 'bg-red-100' : 'bg-emerald-100'}`}>
            <AlertTriangle className={`w-5 h-5 ${stats.ghostWorkerAlert.includes('⚠️') ? 'text-red-600' : 'text-emerald-600'}`} />
          </div>
          <div>
            <p className={`font-semibold ${stats.ghostWorkerAlert.includes('⚠️') ? 'text-red-800' : 'text-emerald-800'}`}>
              {stats.ghostWorkerAlert.includes('⚠️') ? 'Payroll Discrepancy Detected' : 'Payroll Verified'}
            </p>
            <p className={`text-sm mt-0.5 ${stats.ghostWorkerAlert.includes('⚠️') ? 'text-red-600' : 'text-emerald-600'}`}>
              {stats.ghostWorkerAlert}
            </p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-gray-500" />
              <h2 className="font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <button
              onClick={() => navigate('/audit')}
              className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors"
            >
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ScrollText className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-gray-400 text-sm font-medium">No activity yet</p>
              </div>
            ) : (
              recentActivity.map((log) => (
                <div key={log._id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                  <span className="text-lg flex-shrink-0">{entityIcons[log.entity] || '📋'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{log.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${actionColors[log.action] || 'bg-gray-100 text-gray-600'}`}>
                        {log.action}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {log.changedBy?.name || 'System'}
                      </span>
                      <span className="text-[11px] text-gray-300">•</span>
                      <span className="text-[11px] text-gray-400">
                        {new Date(log.timestamp).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Links & AI Insights */}
        <div className="space-y-6">
          {/* Quick Links */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <QuickLink label="Audit Trail" to="/audit" icon={ShieldCheck} color="indigo" />
              <QuickLink label="Approvals" to="/approvals" icon={ScrollText} color="amber" />
              <QuickLink label="Payroll" to="/payroll" icon={DollarSign} color="emerald" />
              <QuickLink label="Staff" to="/staff" icon={Users} color="blue" />
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-purple-600" />
              <h2 className="font-semibold text-gray-900">AI Insights</h2>
            </div>
            <div className="space-y-3 text-sm text-gray-600">
              <p>• {stats.pendingPromotions > 0 ? `${stats.pendingPromotions} staff awaiting promotion vetting` : 'No pending promotions'}</p>
              <p>• {stats.pendingLeave > 0 ? `${stats.pendingLeave} leave requests need attention` : 'All leaves processed'}</p>
              <p>• {stats.presentToday > 0 ? `${attendanceRate}% attendance today` : 'No attendance records'}</p>
              <p>• {stats.ghostWorkerAlert ? '⚠️ Payroll discrepancy detected' : '✅ Payroll reconciled'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Department Overview */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-gray-900">Department Overview</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {staffStats && (
            <>
              <DeptCard label="Departments" value={staffStats.departmentCount || 0} color="indigo" />
              <DeptCard label="Faculties" value={staffStats.facultyCount || 0} color="emerald" />
              <DeptCard label="Active" value={staffStats.totalActive || 0} color="blue" />
              <DeptCard label="Inactive" value={staffStats.totalInactive || 0} color="red" />
              <DeptCard label="Total" value={staffStats.totalStaff || 0} color="purple" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────

function KPICard({ icon: Icon, label, value, sub, trend, trendValue, color }: any) {
  const colors: any = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
  };
  const c = colors[color] || colors.indigo;

  return (
    <div className={`bg-white p-5 rounded-2xl shadow-sm border ${c.border} hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${c.bg}`}><Icon className={`w-5 h-5 ${c.text}`} /></div>
        <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {trendValue}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

function QuickLink({ label, to, icon: Icon, color }: any) {
  const colors: any = {
    indigo: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
    amber: 'bg-amber-50 text-amber-700 hover:bg-amber-100',
    emerald: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
  };
  return (
    <a href={to} className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium transition-colors ${colors[color]}`}>
      <Icon className="w-4 h-4" /> {label}
    </a>
  );
}

function DeptCard({ label, value, color }: any) {
  const borders: any = {
    indigo: 'border-l-indigo-500', emerald: 'border-l-emerald-500',
    blue: 'border-l-blue-500', red: 'border-l-red-500', purple: 'border-l-purple-500'
  };
  return (
    <div className={`bg-gray-50 p-4 rounded-xl border-l-4 ${borders[color]}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}