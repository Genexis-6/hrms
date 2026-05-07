import { useState, useEffect } from 'react';
import { TrendingUp, Brain, CheckCircle, XCircle } from 'lucide-react';
import { getAllPromotions, vetPromotion, getAllStaff } from '../services/api';
import { formatDate, statusColor } from '../lib/utils';
import type { IPromotion, IStaff, IVettingResult } from '../types';

export default function PromotionVetting() {
  const [promotions, setPromotions] = useState<IPromotion[]>([]);
  const [staffList, setStaffList] = useState<IStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [proposedDesignation, setProposedDesignation] = useState('');
  const [proposedGrade, setProposedGrade] = useState('');
  const [vetting, setVetting] = useState(false);

  const fetchData = async () => {
    try {
      const [promRes, staffRes] = await Promise.all([getAllPromotions(), getAllStaff()]);
      setPromotions(promRes.data);
      setStaffList(staffRes.data?.data || staffRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleVet = async () => {
    if (!selectedStaff) return;
    setVetting(true);
    try {
      await vetPromotion({ staffId: selectedStaff, proposedDesignation, proposedGradeLevel: proposedGrade });
      setShowModal(false);
      setSelectedStaff('');
      setProposedDesignation('');
      setProposedGrade('');
      fetchData();
    } catch (error) {
      console.error('Vetting failed:', error);
    } finally {
      setVetting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Promotion Vetting</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Brain className="w-4 h-4" />
          New Vetting
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">AI Promotion Vetting</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Staff</label>
                <select
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select staff...</option>
                  {staffList.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.firstName} {s.lastName} — {s.designation}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Designation</label>
                <input
                  type="text"
                  value={proposedDesignation}
                  onChange={(e) => setProposedDesignation(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., Senior Lecturer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Grade Level</label>
                <input
                  type="text"
                  value={proposedGrade}
                  onChange={(e) => setProposedGrade(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., CONUASS 5"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleVet}
                disabled={vetting || !selectedStaff}
                className="flex-1 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {vetting ? 'Analyzing...' : 'Run AI Vetting'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promotion List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Staff</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Current → Proposed</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">AI Score</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
            ) : promotions.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No promotion records</td></tr>
            ) : (
              promotions.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium">{p.staffId?.firstName} {p.staffId?.lastName}</p>
                    <p className="text-sm text-gray-500">{p.staffId?.department}</p>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="text-gray-500">{p.currentDesignation}</span>
                    <span className="mx-2">→</span>
                    <span className="font-medium">{p.proposedDesignation}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${p.eligibilityScore >= 70 ? 'bg-green-500' : p.eligibilityScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${p.eligibilityScore}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{p.eligibilityScore}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(p.status)}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {p.vettingDate ? formatDate(p.vettingDate) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}