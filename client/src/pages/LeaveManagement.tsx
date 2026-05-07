import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { getAllLeaves, approveLeave } from '../services/api';
import { formatDate, statusColor } from '../lib/utils';
import type { ILeave } from '../types';

export default function LeaveManagement() {
  const [leaves, setLeaves] = useState<ILeave[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaves = async () => {
    try {
      const { data } = await getAllLeaves();
      setLeaves(data);
    } catch (error) {
      console.error('Failed to load leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handleApprove = async (id: string) => {
    try {
      await approveLeave(id, 'Approved by admin');
      fetchLeaves();
    } catch (error) {
      console.error('Approval failed:', error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await approveLeave(id, 'Rejected');
      fetchLeaves();
    } catch (error) {
      console.error('Rejection failed:', error);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Leave Management</h1>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Staff</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Dates</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
            ) : leaves.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No leave applications</td></tr>
            ) : (
              leaves.map((l) => (
                <tr key={l._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium">{l.staffId?.firstName} {l.staffId?.lastName}</p>
                    <p className="text-sm text-gray-500">{l.staffId?.department}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">{l.leaveType}</span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {formatDate(l.startDate)} — {formatDate(l.endDate)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(l.status)}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {l.status === 'Pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(l._id)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Approve"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReject(l._id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
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