import { useState, useEffect } from 'react';
import { Brain, TrendingUp, X, Target, BookOpen, Shield, Award } from 'lucide-react';
import { getAllPromotions, vetPromotion, getAllStaff } from '../services/api';
import { formatDate, statusColor } from '../lib/utils';
import type { IPromotion, IStaff } from '../types';

interface VettingDetails {
  eligibilityScore: number;
  isEligible: boolean;
  recommendation: string;
  missingRequirements: string[];
  detailedBreakdown: {
    timeInGrade: { score: number; maxScore: number; detail: string };
    mandatoryTraining: { score: number; maxScore: number; detail: string };
    disciplinaryStatus: { score: number; maxScore: number; detail: string };
    leaveBalance: { score: number; maxScore: number; detail: string };
  };
}

export default function PromotionVetting() {
  const [promotions, setPromotions] = useState<IPromotion[]>([]);
  const [staffList, setStaffList] = useState<IStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [proposedDesignation, setProposedDesignation] = useState('');
  const [proposedGrade, setProposedGrade] = useState('');
  const [vetting, setVetting] = useState(false);
  const [vettingResult, setVettingResult] = useState<VettingDetails | null>(null);

  const fetchData = async () => {
    try {
      const [promRes, staffRes] = await Promise.all([getAllPromotions(), getAllStaff()]);
      setPromotions(promRes.data);
      setStaffList(staffRes.data?.data || staffRes.data || []);
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleVet = async () => {
    if (!selectedStaff) return;
    setVetting(true);
    setVettingResult(null);
    try {
      const { data } = await vetPromotion({ 
        staffId: selectedStaff, 
        proposedDesignation, 
        proposedGradeLevel: proposedGrade 
      });
      setVettingResult(data.vettingDetails);
      setPromotions([data.promotion, ...promotions]);
    } catch (error) {
      console.error('Vetting failed:', error);
    } finally {
      setVetting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">AI Promotion Vetting</h1>
        <button
          onClick={() => { setShowModal(true); setVettingResult(null); }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
        >
          <Brain className="w-4 h-4" />
          New Vetting
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-lg shadow-xl my-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">AI Promotion Eligibility Check</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member</label>
                <select
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                >
                  <option value="">Select staff...</option>
                  {staffList.filter(s => s.isActive).map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.firstName} {s.lastName} — {s.designation} ({s.department})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Designation</label>
                <input type="text" value={proposedDesignation} onChange={(e) => setProposedDesignation(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  placeholder="e.g., Senior Lecturer" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Grade Level</label>
                <input type="text" value={proposedGrade} onChange={(e) => setProposedGrade(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  placeholder="e.g., CONUASS 5" />
              </div>
            </div>

            {/* AI Result Display */}
            {vettingResult && (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl border">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-gray-900">AI Analysis Results</span>
                </div>

                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-4 border-emerald-500 mb-2">
                    <span className="text-2xl font-bold text-emerald-600">{vettingResult.eligibilityScore}%</span>
                  </div>
                  <p className={`font-semibold ${vettingResult.isEligible ? 'text-emerald-600' : 'text-red-600'}`}>
                    {vettingResult.recommendation}
                  </p>
                </div>

                <div className="space-y-3">
                  <BreakdownRow icon={Target} label="Time in Grade" {...vettingResult.detailedBreakdown.timeInGrade} />
                  <BreakdownRow icon={BookOpen} label="Mandatory Training" {...vettingResult.detailedBreakdown.mandatoryTraining} />
                  <BreakdownRow icon={Shield} label="Disciplinary Status" {...vettingResult.detailedBreakdown.disciplinaryStatus} />
                </div>

                {vettingResult.missingRequirements.length > 0 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-800 mb-1">Issues Found:</p>
                    <ul className="text-sm text-red-600 list-disc list-inside">
                      {vettingResult.missingRequirements.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                {vettingResult ? 'Close' : 'Cancel'}
              </button>
              {!vettingResult && (
                <button onClick={handleVet} disabled={vetting || !selectedStaff}
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm font-medium flex items-center justify-center gap-2">
                  <Brain className="w-4 h-4" />
                  {vetting ? 'Analyzing...' : 'Run AI Vetting'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Promotion List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Staff</th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Progression</th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">AI Score</th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
              ) : promotions.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No vetting records yet</td></tr>
              ) : (
                promotions.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4">
                      <p className="font-medium text-sm sm:text-base">{p.staffId?.firstName} {p.staffId?.lastName}</p>
                      <p className="text-xs sm:text-sm text-gray-500">{p.staffId?.department}</p>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm">
                      <span className="text-gray-500">{p.currentDesignation}</span>
                      <span className="mx-1 sm:mx-2">→</span>
                      <span className="font-medium">{p.proposedDesignation}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-12 sm:w-16 bg-gray-200 rounded-full h-2">
                          <div className={`h-2 rounded-full ${p.eligibilityScore >= 70 ? 'bg-green-500' : p.eligibilityScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(100, p.eligibilityScore)}%` }} />
                        </div>
                        <span className="text-xs sm:text-sm font-medium">{p.eligibilityScore}%</span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(p.status)}`}>{p.status}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-500">
                      {p.vettingDate ? formatDate(p.vettingDate) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BreakdownRow({ icon: Icon, label, score, maxScore, detail }: {
  icon: typeof Target;
  label: string;
  score: number;
  maxScore: number;
  detail: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-xs text-gray-500 ml-auto">{score}/{maxScore}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5 ml-6">
        <div className={`h-1.5 rounded-full ${score >= maxScore * 0.7 ? 'bg-green-500' : score >= maxScore * 0.4 ? 'bg-yellow-500' : 'bg-red-500'}`}
          style={{ width: `${(score / maxScore) * 100}%` }} />
      </div>
      <p className="text-xs text-gray-500 ml-6 mt-0.5">{detail}</p>
    </div>
  );
}