import { useState, useEffect } from 'react';
import { ScrollText, Check, X, Clock, User, ChevronRight } from 'lucide-react';
import { getPendingApprovals, approveStep, rejectStep } from '../services/api';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';
import type { IApprovalChain } from '../types';

export default function Approvals() {
  const [chains, setChains] = useState<IApprovalChain[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  const fetchApprovals = async () => {
    try {
      const { data } = await getPendingApprovals();
      setChains(data || []);
    } catch (error) {
      addToast('Failed to load approvals', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApprovals(); }, []);

  const handleApprove = async (chainId: string) => {
    setProcessingId(chainId);
    try {
      await approveStep(chainId, 'Approved');
      addToast('Step approved successfully', 'success');
      fetchApprovals();
    } catch (err: any) {
      addToast(err?.response?.data?.message || 'Approval failed', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (chainId: string) => {
    const comment = prompt('Reason for rejection:');
    if (!comment) return;
    setProcessingId(chainId);
    try {
      await rejectStep(chainId, comment);
      addToast('Request rejected', 'success');
      fetchApprovals();
    } catch (err: any) {
      addToast(err?.response?.data?.message || 'Rejection failed', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const currentUserRole = JSON.parse(localStorage.getItem('unidel-user') || '{}')?.role || '';

  return (
    <div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pending Approvals</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          You are logged in as: <span className="font-medium text-gray-700 capitalize">{currentUserRole}</span>
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin" />
        </div>
      ) : chains.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center py-20 text-center">
          <ScrollText className="w-12 h-12 text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium">No pending approvals</p>
          <p className="text-sm text-gray-400 mt-1">Nothing requires your attention right now</p>
        </div>
      ) : (
        <div className="space-y-4">
          {chains.map((chain) => (
            <div key={chain._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${
                      chain.requestType === 'PROMOTION' ? 'bg-purple-50 text-purple-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {chain.requestType}
                    </span>
                    <span className="text-sm text-gray-500">
                      Step {chain.currentStep} of {chain.steps.length}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {chain.staffId?.firstName} {chain.staffId?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{chain.staffId?.department}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(chain._id)}
                    disabled={processingId === chain._id}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-40 transition-all text-sm font-medium"
                  >
                    <Check className="w-4 h-4" />
                    {processingId === chain._id ? '...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(chain._id)}
                    disabled={processingId === chain._id}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-xl hover:border-red-400 hover:text-red-600 disabled:opacity-40 transition-all text-sm font-medium"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>

              {/* Steps Timeline */}
              <div className="flex items-center gap-2 flex-wrap">
                {chain.steps.map((step, i) => (
                  <div key={step._id} className="flex items-center gap-2">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
                      step.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' :
                      step.status === 'REJECTED' ? 'bg-red-50 text-red-700' :
                      step.step === chain.currentStep ? 'bg-blue-50 text-blue-700 ring-2 ring-blue-300' :
                      'bg-gray-50 text-gray-400'
                    }`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        step.status === 'APPROVED' ? 'bg-emerald-500 text-white' :
                        step.status === 'REJECTED' ? 'bg-red-500 text-white' :
                        step.step === chain.currentStep ? 'bg-blue-500 text-white' :
                        'bg-gray-300 text-white'
                      }`}>
                        {step.status === 'APPROVED' ? <Check className="w-3 h-3" /> : step.step}
                      </span>
                      {step.title}
                    </div>
                    {i < chain.steps.length - 1 && <ChevronRight className="w-3 h-3 text-gray-300" />}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}