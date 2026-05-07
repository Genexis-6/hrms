import { useState, useEffect } from 'react';
import { Clock, UserCheck, UserX } from 'lucide-react';
import { getTodayAttendance } from '../services/api';
import { formatDateTime, statusColor } from '../lib/utils';
import type { IAttendance } from '../types';

export default function Attendance() {
  const [records, setRecords] = useState<IAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await getTodayAttendance();
        setRecords(data);
      } catch (error) {
        console.error('Failed to load attendance:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Today's Attendance</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg"><Clock className="w-6 h-6 text-blue-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Total Records</p>
              <p className="text-2xl font-bold">{records.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg"><UserCheck className="w-6 h-6 text-green-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Present</p>
              <p className="text-2xl font-bold">{records.filter(r => r.status === 'Present').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg"><UserX className="w-6 h-6 text-yellow-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Late / Half-Day</p>
              <p className="text-2xl font-bold">{records.filter(r => r.status === 'Late' || r.status === 'Half-Day').length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Staff</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Check In</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Check Out</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">No attendance records for today</td></tr>
            ) : (
              records.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium">{r.staffId?.firstName} {r.staffId?.lastName}</p>
                    <p className="text-sm text-gray-500">{r.staffId?.department}</p>
                  </td>
                  <td className="px-6 py-4 text-sm">{r.checkIn ? formatDateTime(r.checkIn) : '—'}</td>
                  <td className="px-6 py-4 text-sm">{r.checkOut ? formatDateTime(r.checkOut) : '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(r.status)}`}>
                      {r.status}
                    </span>
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