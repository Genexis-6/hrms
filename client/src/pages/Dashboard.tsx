import { useState, useEffect } from 'react';
import { Users, Clock, FileText, TrendingUp, AlertTriangle } from 'lucide-react';
import { getDashboardStats } from '../services/api';
import StatCard from '../components/StatCard';
import type { IDashboardStats } from '../types';

export default function Dashboard() {
  const [stats, setStats] = useState<IDashboardStats>({
    totalStaff: 0,
    presentToday: 0,
    pendingLeave: 0,
    pendingPromotions: 0,
    ghostWorkerAlert: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} title="Total Staff" value={stats.totalStaff} color="blue" />
        <StatCard icon={Clock} title="Present Today" value={stats.presentToday} color="green" />
        <StatCard icon={FileText} title="Pending Leaves" value={stats.pendingLeave} color="yellow" />
        <StatCard icon={TrendingUp} title="Pending Promotions" value={stats.pendingPromotions} color="purple" />
      </div>

      {stats.ghostWorkerAlert && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800 font-medium">{stats.ghostWorkerAlert}</p>
        </div>
      )}
    </div>
  );
}