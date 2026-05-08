import { useState, useEffect } from 'react';
import { DollarSign, Users, AlertTriangle, TrendingUp, Download, RefreshCw } from 'lucide-react';
import { getReconciliation, getSalaryStructure } from '../services/api';
import type { IReconciliationReport, IPayrollSummary } from '../types';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';

export default function Payroll() {
  const [report, setReport] = useState<IReconciliationReport | null>(null);
  const [payroll, setPayroll] = useState<IPayrollSummary | null>(null);
  const [payrollCount, setPayrollCount] = useState(50);
  const [loading, setLoading] = useState(true);
  const { toasts, addToast, removeToast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, payRes] = await Promise.all([
        getReconciliation(payrollCount),
        getSalaryStructure(),
      ]);
      setReport(recRes.data);
      setPayroll(payRes.data);
    } catch (error) {
      addToast('Failed to load payroll data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payroll & Bursary</h1>
          <p className="text-sm text-gray-500 mt-0.5">Staff count verification & salary reconciliation</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="number" value={payrollCount} onChange={(e) => setPayrollCount(Number(e.target.value))}
            className="w-24 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900" />
          <button onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <Users className="w-5 h-5 text-indigo-600 mb-2" />
              <p className="text-2xl font-bold text-gray-900">{report?.activeStaffCount || 0}</p>
              <p className="text-sm text-gray-500">Active Staff (Registry)</p>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <DollarSign className="w-5 h-5 text-emerald-600 mb-2" />
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(payroll?.totalMonthlyPayroll || 0)}</p>
              <p className="text-sm text-gray-500">Monthly Payroll</p>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <AlertTriangle className={`w-5 h-5 mb-2 ${report && report.discrepancy !== 0 ? 'text-red-600' : 'text-emerald-600'}`} />
              <p className="text-2xl font-bold text-gray-900">{report?.discrepancy || 0}</p>
              <p className="text-sm text-gray-500">Discrepancy</p>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <TrendingUp className="w-5 h-5 text-purple-600 mb-2" />
              <p className="text-2xl font-bold text-gray-900">{report?.ghostWorkerCandidates.length || 0}</p>
              <p className="text-sm text-gray-500">Ghost Worker Candidates</p>
            </div>
          </div>

          {/* Reconciliation Summary */}
          {report && (
            <div className={`p-5 rounded-2xl border ${report.discrepancy !== 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <p className={`font-semibold ${report.discrepancy !== 0 ? 'text-red-800' : 'text-emerald-800'}`}>
                {report.summary}
              </p>
            </div>
          )}

          {/* Ghost Worker Candidates */}
          {report && report.ghostWorkerCandidates.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Potential Ghost Workers</h2>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Staff</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Department</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {report.ghostWorkerCandidates.map((g, i) => (
                    <tr key={i} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 text-sm font-medium text-gray-900">{g.name}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{g.department}</td>
                      <td className="px-5 py-3 text-sm text-gray-500">{g.lastActive}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Payroll Breakdown */}
          {payroll && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Monthly Payroll ({payroll.totalStaff} staff)</h2>
                <p className="text-sm text-gray-500 mt-0.5">Total: {formatCurrency(payroll.totalMonthlyPayroll)}</p>
              </div>
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-gray-50/50 sticky top-0">
                    <tr>
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Staff</th>
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Department</th>
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Grade</th>
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Monthly Salary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {payroll.staff.map((s) => (
                      <tr key={s.staffId} className="hover:bg-gray-50/50">
                        <td className="px-5 py-3 text-sm font-medium text-gray-900">{s.name}</td>
                        <td className="px-5 py-3 text-sm text-gray-600">{s.department}</td>
                        <td className="px-5 py-3 text-sm text-gray-500">{s.gradeLevel}</td>
                        <td className="px-5 py-3 text-sm font-mono text-gray-700">{formatCurrency(s.monthlySalary)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}