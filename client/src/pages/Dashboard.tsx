import { useState, useEffect, useCallback } from 'react';
import {
  Users, Clock, FileText, TrendingUp, AlertTriangle, Brain,
  RefreshCw, ArrowUpRight, ArrowDownRight, Building2, UserCheck,
  GraduationCap, Briefcase, Calendar, DollarSign
} from 'lucide-react';
import { getDashboardStats, getStaffStats } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import type { IDashboardStats } from '../types';

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

export default function Dashboard() {
  const [stats, setStats] = useState<IDashboardStats>({
    totalStaff: 0, presentToday: 0, pendingLeave: 0, pendingPromotions: 0, ghostWorkerAlert: ''
  });
  const [staffStats, setStaffStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchStats = useCallback(async () => {
    try {
      const [dashRes, statsRes] = await Promise.all([getDashboardStats(), getStaffStats()]);
      setStats(dashRes.data);
      setStaffStats(statsRes.data);
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
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-emerald-200" />
            <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const attendanceRate = stats.totalStaff > 0 ? ((stats.presentToday / stats.totalStaff) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Real-time overview of staff administration • Updated {lastUpdated.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button onClick={fetchStats}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-sm font-medium text-gray-600 shadow-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={Users} label="Total Staff" value={stats.totalStaff}
          sub={`${staffStats?.academicStaff || 0} Academic • ${staffStats?.nonAcademicStaff || 0} Non-Academic`}
          trend="up" trendValue="Active workforce" color="indigo"
        />
        <KPICard
          icon={UserCheck} label="Present Today" value={stats.presentToday}
          sub={`${attendanceRate}% attendance rate`}
          trend={parseFloat(attendanceRate) > 60 ? 'up' : 'down'}
          trendValue={`${attendanceRate}%`} color="emerald"
        />
        <KPICard
          icon={FileText} label="Pending Leaves" value={stats.pendingLeave}
          sub="Awaiting approval"
          trend={stats.pendingLeave > 0 ? 'down' : 'up'}
          trendValue={stats.pendingLeave > 0 ? 'Action needed' : 'All cleared'} color="amber"
        />
        <KPICard
          icon={TrendingUp} label="Pending Promotions" value={stats.pendingPromotions}
          sub="Ready for AI vetting"
          trend="up" trendValue={stats.pendingPromotions > 0 ? 'Requires attention' : 'Up to date'} color="purple"
        />
      </div>

      {/* Ghost Worker Alert */}
      {stats.ghostWorkerAlert && (
        <div className={`p-5 rounded-2xl flex items-start gap-4 ${
          stats.ghostWorkerAlert.includes('⚠️')
            ? 'bg-red-50 border border-red-200'
            : 'bg-emerald-50 border border-emerald-200'
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staff Distribution */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h2 className="font-semibold text-gray-900">Staff Distribution</h2>
          </div>
          {staffStats && (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={[
                  { name: 'Academic', value: staffStats.academicStaff || 0 },
                  { name: 'Non-Academic', value: staffStats.nonAcademicStaff || 0 },
                ]} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {[0, 1].map((_, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-gray-600">Academic ({staffStats?.academicStaff || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-500" />
              <span className="text-sm text-gray-600">Non-Academic ({staffStats?.nonAcademicStaff || 0})</span>
            </div>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-purple-600" />
            <h2 className="font-semibold text-gray-900">AI Insights</h2>
          </div>
          <div className="space-y-4">
            <InsightItem icon={Users} label="Total Workforce" value={`${stats.totalStaff} staff across ${staffStats?.departmentCount || 0} departments`} color="blue" />
            <InsightItem icon={Calendar} label="Leave Summary" value={`${stats.pendingLeave} pending • ${stats.pendingLeave === 0 ? 'All processed' : 'Action required'}`} color="amber" />
            <InsightItem icon={TrendingUp} label="Promotion Queue" value={`${stats.pendingPromotions} awaiting AI vetting`} color="purple" />
            <InsightItem icon={DollarSign} label="Payroll Audit" value={stats.ghostWorkerAlert ? 'Discrepancy found' : 'All clear'} color={stats.ghostWorkerAlert ? 'red' : 'emerald'} />
          </div>
        </div>
      </div>

      {/* Departments */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Department Overview</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {staffStats && (
            <>
              <DeptCard label="Departments" value={staffStats.departmentCount || 0} color="indigo" />
              <DeptCard label="Faculties" value={staffStats.facultyCount || 0} color="emerald" />
              <DeptCard label="Active Staff" value={staffStats.totalActive || 0} color="blue" />
              <DeptCard label="Inactive" value={staffStats.totalInactive || 0} color="red" />
              <DeptCard label="Total" value={staffStats.totalStaff || 0} color="purple" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Sub-components
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
        <div className={`p-2.5 rounded-xl ${c.bg}`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
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

function InsightItem({ icon: Icon, label, value, color }: any) {
  const bgColors: any = {
    blue: 'bg-blue-50', amber: 'bg-amber-50', purple: 'bg-purple-50', emerald: 'bg-emerald-50', red: 'bg-red-50'
  };
  return (
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded-lg ${bgColors[color] || 'bg-gray-50'}`}>
        <Icon className="w-4 h-4 text-gray-600" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{value}</p>
      </div>
    </div>
  );
}

function DeptCard({ label, value, color }: any) {
  const borders: any = {
    indigo: 'border-l-indigo-500', emerald: 'border-l-emerald-500', blue: 'border-l-blue-500', red: 'border-l-red-500', purple: 'border-l-purple-500'
  };
  return (
    <div className={`bg-gray-50 p-4 rounded-xl border-l-4 ${borders[color]}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}