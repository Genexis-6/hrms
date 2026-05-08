import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Edit, Trash2, X, Mail, Building,
  MapPin, Users, Calendar, Briefcase, GraduationCap,
  Banknote, CreditCard, Hash, BookOpen
} from 'lucide-react';
import { getAllStaff, deleteStaff, searchStaff, createStaff } from '../services/api';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';
import type { IStaff } from '../types';

// ─── UNIDEL Faculties ───────────────────────────────────────────

const FACULTIES = [
  'Faculty of Agriculture',
  'Faculty of Arts',
  'Faculty of Basic Medical Sciences',
  'Faculty of Clinical Sciences',
  'Faculty of Dentistry',
  'Faculty of Education',
  'Faculty of Engineering',
  'Faculty of Environmental Sciences',
  'Faculty of Law',
  'Faculty of Management Sciences',
  'Faculty of Pharmacy',
  'Faculty of Science',
  'Faculty of Social Sciences',
  'School of Postgraduate Studies',
] as const;

const ADMIN_UNITS = [
  'Registry',
  'Bursary',
  'Library',
  'Works & Services',
  'Health Services',
  'Information Technology',
  'Human Resources',
  'Academic Planning',
  'Student Affairs',
  'Security',
  'Internal Audit',
  'Vice Chancellor\'s Office',
] as const;

const ACADEMIC_DESIGNATIONS = [
  'Graduate Assistant',
  'Assistant Lecturer',
  'Lecturer II',
  'Lecturer I',
  'Senior Lecturer',
  'Associate Professor',
  'Professor',
] as const;

const NON_ACADEMIC_DESIGNATIONS = [
  'Administrative Assistant',
  'Administrative Officer',
  'Senior Administrative Officer',
  'Principal Administrative Officer',
  'Assistant Registrar',
  'Senior Assistant Registrar',
  'Principal Assistant Registrar',
  'Deputy Registrar',
  'Registrar',
  'Clerical Officer',
  'Senior Clerical Officer',
  'Executive Officer',
  'Senior Executive Officer',
  'Technical Officer',
  'Senior Technical Officer',
  'Principal Technical Officer',
] as const;

const ACADEMIC_GRADES = [
  'CONUASS 1',
  'CONUASS 2',
  'CONUASS 3',
  'CONUASS 4',
  'CONUASS 5',
  'CONUASS 6',
  'CONUASS 7',
] as const;

const NON_ACADEMIC_GRADES = [
  'CONTISS 6',
  'CONTISS 7',
  'CONTISS 8',
  'CONTISS 9',
  'CONTISS 10',
  'CONTISS 11',
  'CONTISS 12',
  'CONTISS 13',
  'CONTISS 14',
  'CONTISS 15',
] as const;

const BANKS = [
  'Access Bank',
  'Ecobank',
  'Fidelity Bank',
  'First Bank',
  'First City Monument Bank',
  'Globus Bank',
  'Guaranty Trust Bank',
  'Heritage Bank',
  'Jaiz Bank',
  'Keystone Bank',
  'Polaris Bank',
  'Providus Bank',
  'Stanbic IBTC',
  'Standard Chartered',
  'Sterling Bank',
  'SunTrust Bank',
  'Titan Trust Bank',
  'Union Bank',
  'United Bank for Africa',
  'Unity Bank',
  'Wema Bank',
  'Zenith Bank',
] as const;

// ─── Main Component ─────────────────────────────────────────────

export default function StaffManagement() {
  const [staff, setStaff] = useState<IStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasBeenPromoted, setHasBeenPromoted] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const [form, setForm] = useState({
    staffId: '',
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    faculty: '',
    designation: '',
    cadre: 'Academic' as 'Academic' | 'Non-Academic',
    dateOfFirstAppointment: '',
    dateOfLastPromotion: '',
    salaryGradeLevel: '',
    accountNumber: '',
    bankName: '',
  });

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = search
        ? await searchStaff({ q: search, page: String(page), limit: '10' })
        : await getAllStaff();
      const staffData = data.data || data;
      if (Array.isArray(staffData)) {
        setStaff(staffData);
        setTotalPages(data.pagination?.pages || 1);
      } else if (Array.isArray(data)) {
        setStaff(data);
        setTotalPages(1);
      }
    } catch {
      addToast('Failed to load staff records', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, page, addToast]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Permanently delete ${name}?\n\nThis will cascade delete all attendance, leave, and promotion records.`)) return;
    try {
      await deleteStaff(id);
      addToast(`${name} deleted successfully`, 'success');
      fetchStaff();
    } catch {
      addToast('Delete failed', 'error');
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (!form.staffId || !form.firstName || !form.lastName || !form.email) {
      addToast('Please fill all required fields', 'warning');
      setSubmitting(false);
      return;
    }

    if (form.cadre === 'Academic' && !form.faculty) {
      addToast('Faculty is required for academic staff', 'warning');
      setSubmitting(false);
      return;
    }

    try {
      const payload: Record<string, unknown> = {
        staffId: form.staffId,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        department: form.department,
        faculty: form.cadre === 'Academic' ? form.faculty : 'Administration',
        designation: form.designation,
        cadre: form.cadre,
        dateOfFirstAppointment: form.dateOfFirstAppointment ? new Date(form.dateOfFirstAppointment) : new Date(),
        salaryGradeLevel: form.salaryGradeLevel,
        bankDetails: {
          accountNumber: form.accountNumber,
          bankName: form.bankName,
        },
        isActive: true,
        leaveDaysRemaining: 30,
      };

      if (hasBeenPromoted && form.dateOfLastPromotion) {
        payload.dateOfLastPromotion = new Date(form.dateOfLastPromotion);
      } else {
        payload.dateOfLastPromotion = form.dateOfFirstAppointment
          ? new Date(form.dateOfFirstAppointment)
          : new Date();
      }

      await createStaff(payload);
      addToast(`${form.firstName} ${form.lastName} added successfully`, 'success');
      setShowAddModal(false);
      resetForm();
      fetchStaff();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to add staff';
      addToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      staffId: '', firstName: '', lastName: '', email: '', department: '',
      faculty: '', designation: '', cadre: 'Academic',
      dateOfFirstAppointment: '', dateOfLastPromotion: '', salaryGradeLevel: '',
      accountNumber: '', bankName: '',
    });
    setHasBeenPromoted(false);
  };

  const handleCadreChange = (cadre: 'Academic' | 'Non-Academic') => {
    setForm({
      ...form,
      cadre,
      faculty: cadre === 'Non-Academic' ? '' : form.faculty,
      designation: '',
      salaryGradeLevel: '',
    });
  };

  const activeDesignations = form.cadre === 'Academic' ? ACADEMIC_DESIGNATIONS : NON_ACADEMIC_DESIGNATIONS;
  const activeGrades = form.cadre === 'Academic' ? ACADEMIC_GRADES : NON_ACADEMIC_GRADES;

  return (
    <div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Staff Directory</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Loading...' : `${staff.length} staff member${staff.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
        <div className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, staff ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm transition-all"
            />
          </div>
        </div>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin" />
        </div>
      ) : staff.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No staff records found</p>
          <p className="text-sm text-gray-400 mt-1">Add your first staff member to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {staff.map((s) => (
            <div key={s._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-semibold text-sm text-white ${
                    s.cadre === 'Academic' ? 'bg-indigo-600' : 'bg-purple-600'
                  }`}>
                    {s.firstName?.[0]}{s.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{s.firstName} {s.lastName}</p>
                    <p className="text-xs text-gray-500">{s.staffId}</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(s._id, `${s.firstName} ${s.lastName}`)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{s.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{s.department || s.faculty}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Briefcase className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{s.designation}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                  s.cadre === 'Academic' ? 'bg-indigo-50 text-indigo-700' : 'bg-purple-50 text-purple-700'
                }`}>
                  {s.cadre}
                </span>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                  s.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}>
                  {s.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-all"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-all"
          >
            Next
          </button>
        </div>
      )}

      {/* ─── Add Staff Modal ─────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-8">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-6 border-b border-gray-100 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-900 rounded-xl">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Add Staff Member</h2>
                  <p className="text-xs text-gray-500">Fill in the details below</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="p-6 space-y-6">
              {/* ─── Cadre Toggle ──────────────────────────── */}
              <div className="bg-gray-50 rounded-xl p-1.5 flex gap-1">
                <button
                  type="button"
                  onClick={() => handleCadreChange('Academic')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                    form.cadre === 'Academic'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  Academic Staff
                </button>
                <button
                  type="button"
                  onClick={() => handleCadreChange('Non-Academic')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                    form.cadre === 'Non-Academic'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  Non-Academic Staff
                </button>
              </div>

              {/* ─── Personal Information ──────────────────── */}
              <Section title="Personal Information" icon={Users}>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Staff ID *" required>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text" required
                        value={form.staffId}
                        onChange={(e) => setForm({ ...form, staffId: e.target.value })}
                        placeholder="e.g., UNIDEL-2024-001"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                      />
                    </div>
                  </FormField>
                  <FormField label="Email *" required>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email" required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="staff@unidel.edu.ng"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                      />
                    </div>
                  </FormField>
                  <FormField label="First Name *" required>
                    <input
                      type="text" required
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    />
                  </FormField>
                  <FormField label="Last Name *" required>
                    <input
                      type="text" required
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    />
                  </FormField>
                </div>
              </Section>

              {/* ─── Academic/Work Information ─────────────── */}
              <Section
                title={form.cadre === 'Academic' ? 'Academic Information' : 'Work Information'}
                icon={form.cadre === 'Academic' ? GraduationCap : Briefcase}
              >
                <div className="grid grid-cols-2 gap-4">
                  {/* Faculty — Academic only */}
                  {form.cadre === 'Academic' && (
                    <FormField label="Faculty *" required>
                      <div className="relative">
                        <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <select
                          required
                          value={form.faculty}
                          onChange={(e) => setForm({ ...form, faculty: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 appearance-none bg-white"
                        >
                          <option value="">Select faculty...</option>
                          {FACULTIES.map((f) => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      </div>
                    </FormField>
                  )}

                  {/* Unit — Non-academic only */}
                  {form.cadre === 'Non-Academic' && (
                    <FormField label="Unit/Department *" required>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <select
                          required
                          value={form.department}
                          onChange={(e) => setForm({ ...form, department: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 appearance-none bg-white"
                        >
                          <option value="">Select unit...</option>
                          {ADMIN_UNITS.map((u) => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>
                    </FormField>
                  )}

                  <FormField label="Department">
                    <input
                      type="text"
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      placeholder={form.cadre === 'Academic' ? 'e.g., Computer Science' : 'e.g., ICT Unit'}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    />
                  </FormField>

                  <FormField label="Designation *" required>
                    <select
                      required
                      value={form.designation}
                      onChange={(e) => setForm({ ...form, designation: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 appearance-none bg-white"
                    >
                      <option value="">Select designation...</option>
                      {activeDesignations.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Salary Grade Level">
                    <select
                      value={form.salaryGradeLevel}
                      onChange={(e) => setForm({ ...form, salaryGradeLevel: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 appearance-none bg-white"
                    >
                      <option value="">Select grade...</option>
                      {activeGrades.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </Section>

              {/* ─── Appointment Dates ──────────────────────── */}
              <Section title="Appointment & Promotion" icon={Calendar}>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Date of First Appointment *" required>
                    <input
                      type="date" required
                      value={form.dateOfFirstAppointment}
                      onChange={(e) => setForm({ ...form, dateOfFirstAppointment: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    />
                  </FormField>

                  {/* Promotion toggle + date */}
                  <FormField label="Last Promotion">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasBeenPromoted}
                          onChange={(e) => {
                            setHasBeenPromoted(e.target.checked);
                            if (!e.target.checked) setForm({ ...form, dateOfLastPromotion: '' });
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                        />
                        <span className="text-sm text-gray-600">Has been promoted before</span>
                      </label>
                      {hasBeenPromoted && (
                        <input
                          type="date"
                          value={form.dateOfLastPromotion}
                          onChange={(e) => setForm({ ...form, dateOfLastPromotion: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                        />
                      )}
                    </div>
                  </FormField>
                </div>
              </Section>

              {/* ─── Bank Details ───────────────────────────── */}
              <Section title="Bank Details" icon={CreditCard}>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Bank Name">
                    <select
                      value={form.bankName}
                      onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 appearance-none bg-white"
                    >
                      <option value="">Select bank...</option>
                      {BANKS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Account Number">
                    <input
                      type="text"
                      value={form.accountNumber}
                      onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                      placeholder="10-digit NUBAN"
                      maxLength={10}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    />
                  </FormField>
                </div>
              </Section>

              {/* ─── Actions ────────────────────────────────── */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add Staff
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Reusable Components ────────────────────────────────────────

function Section({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function FormField({ label, required, children }: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}