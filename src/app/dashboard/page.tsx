'use client';

import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { decryptData } from '../lib/encryption';
import {
  BarChart2,
  CheckCircle2,
  Clock3,
  Download,
  Filter,
  Gift,
  LogOut,
  Search,
  Ticket,
  Upload,
  Users,
  X,
} from 'lucide-react';

interface Application {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  counselor_email: string;
  phone: string;
  program: string;
  site: string;
  lcgmsCode: string;
  geographicDistrict: string;
  workPreferences: {
    bronx: boolean;
    brooklyn: boolean;
    queens: boolean;
    statenIsland: boolean;
    manhattan: boolean;
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
    weekend: boolean;
  };
  fingerprintQuestionnaire: boolean;
  documentsVerified: boolean;
  attendanceVerified: boolean;
  fingerprintPaymentPreference: 'yes' | 'no' | 'pending';
  status: 'pending' | 'approved' | 'rejected' | 'accepted';
  submittedAt: string;
}

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: (password: string) => void;
}

interface CouponAssignment {
  _id: string;
  coupon_code: string;
  assigned_to: string;
  assigned_at: string;
  status: 'available' | 'assigned' | 'expired' | 'used';
  student?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface AvailableCoupon {
  _id: string;
  coupon_code: string;
  status: 'available' | 'assigned' | 'expired' | 'used';
}

// Add Notification interface
interface Notification {
  type: 'success' | 'error';
  message: string;
  id: number;
}

const inputClassName =
  'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100';

const actionButtonClassName =
  'inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-4';

function getStatusBadgeClass(status: Application['status']) {
  if (status === 'approved' || status === 'accepted') {
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  }

  if (status === 'rejected') {
    return 'bg-rose-50 text-rose-700 ring-rose-200';
  }

  return 'bg-amber-50 text-amber-700 ring-amber-200';
}

function getPaymentBadgeClass(payment: Application['fingerprintPaymentPreference']) {
  if (payment === 'yes') {
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  }

  if (payment === 'no') {
    return 'bg-rose-50 text-rose-700 ring-rose-200';
  }

  return 'bg-amber-50 text-amber-700 ring-amber-200';
}

function StatCard({
  label,
  value,
  helper,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{helper}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function DownloadModal({ isOpen, onClose, onDownload }: DownloadModalProps) {
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl shadow-slate-950/20">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Download className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-bold text-slate-950">Enter Password to Download</h3>
        <p className="mt-2 text-sm text-slate-600">This export may contain sensitive application data.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClassName}
          placeholder="Enter password"
        />
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            onClick={() => onDownload(password)}
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [coupons, setCoupons] = useState<AvailableCoupon[]>([]);
  const [assignedCoupons, setAssignedCoupons] = useState<CouponAssignment[]>([]);
  const [availableCoupons, setAvailableCoupons] = useState<AvailableCoupon[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedCoupon, setSelectedCoupon] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalApplications, setTotalApplications] = useState(0);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const itemsPerPage = 30;
  const [sortBy, setSortBy] = useState<'payment' | 'status' | 'submittedAt' | 'counselorEmail' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterPayment, setFilterPayment] = useState<'all' | 'yes' | 'no' | 'pending'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'accepted'>('all');
  const [filterYear, setFilterYear] = useState<'all' | '2026' | '2025'>('2026');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [searchName, setSearchName] = useState<string>('');
  const [searchCounselorEmail, setSearchCounselorEmail] = useState<string>('');
  const dateFromRef = useRef<HTMLInputElement>(null);
  const dateToRef = useRef<HTMLInputElement>(null);
  const couponUploadRef = useRef<HTMLInputElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [isBulkActionOpen, setIsBulkActionOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'applications' | 'coupons'>('applications');
  const [isUploadingCoupons, setIsUploadingCoupons] = useState(false);

  useEffect(() => {
    fetchApplications();
    fetchAssignedCoupons();
    fetchAvailableCoupons();
    
  }, [currentPage, searchName, searchCounselorEmail, filterPayment, filterStatus, filterYear, filterDateFrom, filterDateTo, sortBy, sortOrder]);

  const fetchApplications = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        searchName: searchName,
        searchCounselorEmail: searchCounselorEmail,
        filterPayment: filterPayment,
        filterStatus: filterStatus,
        filterYear: filterYear,
        filterDateFrom: filterDateFrom,
        filterDateTo: filterDateTo,
        sortBy: sortBy || '',
        sortOrder: sortOrder
      });

      const response = await fetch(`/api/applications?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch applications');
      const data = await response.json();
      setApplications(data.applications);
      setTotalApplications(data.total || data.applications.length);
      setTotalPages(Math.max(1, Math.ceil(data.total / itemsPerPage)));
    } catch (err) {
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedCoupons = async () => {
    try {
      const response = await fetch('/api/coupons');
      if (!response.ok) throw new Error('Failed to fetch coupons');
      const data = await response.json();
      setCoupons(data);
      
      // Get all assigned coupons
      const assignedCoupons = data.filter((c: CouponAssignment) => c.status === 'assigned');
      
      // Fetch student details for each assigned coupon
      const couponsWithStudents = await Promise.all(
        assignedCoupons.map(async (coupon: CouponAssignment) => {
          if (coupon.assigned_to) {
            const studentResponse = await fetch(`/api/applications/${coupon.assigned_to}`);
            if (studentResponse.ok) {
              const studentData = await studentResponse.json();
              return {
                ...coupon,
                student: {
                  firstName: studentData.firstName,
                  lastName: studentData.lastName,
                  email: studentData.email
                }
              };
            }
          }
          return coupon;
        })
      );
      
      setAssignedCoupons(couponsWithStudents);
    } catch (err) {
      console.error('Error fetching assigned coupons:', err);
    }
  };

  const fetchAvailableCoupons = async () => {
    try {
      const response = await fetch('/api/coupons');
      if (!response.ok) throw new Error('Failed to fetch coupons');
      const data = await response.json();
      setCoupons(data);
      setAvailableCoupons(data.filter((c: AvailableCoupon) => c.status === 'available'));
    } catch (err) {
      console.error('Error fetching available coupons:', err);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');
      
      setApplications(applications.map(app => 
        app._id === id ? { ...app, status: newStatus } : app
      ));
    } catch (err) {
      setError('Failed to update application status');
    }
  };

  const handleDeleteApplication = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to delete application');
      
      // Remove from local state
      setApplications(applications.filter(app => app._id !== id));
      
      // Also remove from selected applications if it was selected
      setSelectedApplications(selectedApplications.filter(appId => appId !== id));
      
      showNotification('success', 'Application deleted successfully');
    } catch (err) {
      showNotification('error', 'Failed to delete application');
    }
  };

  const handleUnassignCoupon = async (couponId: string, studentId: string) => {
    try {
      const response = await fetch('/api/coupons', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          couponId
        })
      });

      if (!response.ok) throw new Error('Failed to unassign coupon');
      
      await fetchAssignedCoupons();
      await fetchAvailableCoupons();
    } catch (err) {
      setError('Failed to unassign coupon');
    }
  };

  const handleExpireAvailableCoupons = async () => {
    if (availableCoupons.length === 0) {
      showNotification('error', 'No available coupons to expire');
      return;
    }

    if (!confirm(`Expire ${availableCoupons.length} available coupon(s)? This will move them out of the 2026 available pool.`)) {
      return;
    }

    try {
      const response = await fetch('/api/coupons/expire-available', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to expire coupons');

      const data = await response.json();
      await fetchAssignedCoupons();
      await fetchAvailableCoupons();
      showNotification('success', `Expired ${data.expiredCount} coupon(s)`);
    } catch (err) {
      showNotification('error', 'Failed to expire available coupons');
    }
  };

  const handleUpload2026Coupons = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      showNotification('error', 'Please upload a CSV file');
      event.target.value = '';
      return;
    }

    setIsUploadingCoupons(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/coupons/upload-2026', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to upload coupons');
      }

      await fetchAssignedCoupons();
      await fetchAvailableCoupons();
      showNotification(
        'success',
        `Uploaded ${data.insertedCount} new 2026 coupon(s). ${data.existingCount} already existed.`
      );
    } catch (err) {
      showNotification(err instanceof Error ? 'error' : 'error', err instanceof Error ? err.message : 'Failed to upload coupons');
    } finally {
      setIsUploadingCoupons(false);
      event.target.value = '';
    }
  };

  const handleDownload = async (password: string) => {
    try {
      const response = await fetch('/api/applications/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) throw new Error('Invalid password or download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `applications-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setIsDownloadModalOpen(false);
    } catch (err) {
      setError('Failed to download applications');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/dashboard/login');
    router.refresh();
  };

  // Add notification function
  const showNotification = (type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { type, message, id }]);
    
    // Clear previous timeout
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    
    // Auto remove notification after 5 seconds
    notificationTimeoutRef.current = setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const handleAssignCoupon = async () => {
    if (!selectedStudent || !selectedCoupon) return;

    try {
      const response = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent,
          couponId: selectedCoupon
        })
      });

      if (!response.ok) throw new Error('Failed to assign coupon');
      
      const data = await response.json();
      await fetchAssignedCoupons();
      await fetchAvailableCoupons();
      setIsAssignModalOpen(false);
      setSelectedStudent('');
      setSelectedCoupon('');
      
      // Show success notification with coupon code
      const assignedCoupon = availableCoupons.find(c => c._id === selectedCoupon);
      if (assignedCoupon) {
        showNotification('success', `Coupon ${assignedCoupon.coupon_code} assigned successfully!`);
      }
    } catch (err) {
      showNotification('error', 'Failed to assign coupon. Please try again.');
    }
  };

  // Remove the local filtering logic since it's now handled by the API
  let filteredApplications = applications;

  // Add a function to get coupon code for a student
  const getStudentCouponCode = (studentId: string) => {
    const assignment = assignedCoupons.find(c => c.assigned_to === studentId);
    return assignment?.coupon_code || '-';
  };

  // Add new function for bulk status update
  const handleBulkStatusUpdate = async (newStatus: 'approved' | 'rejected' | 'accepted') => {
    try {
      const response = await fetch('/api/applications/bulk-update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationIds: selectedApplications,
          status: newStatus
        }),
      });

      if (!response.ok) throw new Error('Failed to update statuses');
      
      // Update local state
      setApplications(applications.map(app => 
        selectedApplications.includes(app._id) ? { ...app, status: newStatus } : app
      ));
      
      // Clear selection
      setSelectedApplications([]);
      showNotification('success', `Successfully updated ${selectedApplications.length} applications`);
    } catch (err) {
      showNotification('error', 'Failed to update application statuses');
    }
  };

  // Add function for bulk delete
  const handleBulkDelete = async () => {
    if (selectedApplications.length === 0) {
      showNotification('error', 'No applications selected');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedApplications.length} application(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      // Delete applications one by one (since we don't have a bulk delete endpoint)
      const deletePromises = selectedApplications.map(id => 
        fetch(`/api/applications/${id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const results = await Promise.all(deletePromises);
      const failedDeletes = results.filter(result => !result.ok);

      if (failedDeletes.length > 0) {
        showNotification('error', `Failed to delete ${failedDeletes.length} application(s)`);
      }

      // Remove deleted applications from local state
      setApplications(applications.filter(app => !selectedApplications.includes(app._id)));
      
      // Clear selection
      setSelectedApplications([]);
      
      showNotification('success', `Successfully deleted ${selectedApplications.length - failedDeletes.length} application(s)`);
    } catch (err) {
      showNotification('error', 'Failed to delete applications');
    }
  };

  // Add function to handle selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedApplications(applications.map(app => app._id));
    } else {
      setSelectedApplications([]);
    }
  };

  const handleSelectApplication = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedApplications([...selectedApplications, id]);
    } else {
      setSelectedApplications(selectedApplications.filter(appId => appId !== id));
    }
  };

  const handleBulkCouponAssignment = async () => {
    try {
      // Get students without coupons
      const studentsWithoutCoupons = applications.filter(app => 
        app.status === 'accepted' && !assignedCoupons.find(c => c.assigned_to === app._id)
      );

      if (studentsWithoutCoupons.length === 0) {
        showNotification('error', 'No students available for coupon assignment');
        return;
      }

      if (availableCoupons.length === 0) {
        showNotification('error', 'No available coupons to assign');
        return;
      }

      // Shuffle available coupons
      const shuffledCoupons = [...availableCoupons].sort(() => Math.random() - 0.5);
      
      // Assign coupons to students
      const assignments = studentsWithoutCoupons.slice(0, Math.min(studentsWithoutCoupons.length, shuffledCoupons.length))
        .map((student, index) => ({
          studentId: student._id,
          couponId: shuffledCoupons[index]._id
        }));

      // Make bulk assignment request
      const response = await fetch('/api/coupons/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments })
      });

      if (!response.ok) throw new Error('Failed to assign coupons');
      
      await fetchAssignedCoupons();
      await fetchAvailableCoupons();
      
      showNotification('success', `Successfully assigned ${assignments.length} coupons`);
    } catch (err) {
      showNotification('error', 'Failed to assign coupons. Please try again.');
    }
  };

  const pendingCount = applications.filter(app => (app.status || 'pending') === 'pending').length;
  const acceptedCount = applications.filter(app => app.status === 'accepted').length;
  const expiredCoupons = coupons.filter(coupon => coupon.status === 'expired' || coupon.status === 'used');
  const showingFrom = applications.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const showingTo = Math.min(currentPage * itemsPerPage, totalApplications || applications.length);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1920px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-48 rounded-[2rem] bg-slate-200" />
          <div className="grid gap-4 md:grid-cols-4">
            <div className="h-32 rounded-3xl bg-slate-200" />
            <div className="h-32 rounded-3xl bg-slate-200" />
            <div className="h-32 rounded-3xl bg-slate-200" />
            <div className="h-32 rounded-3xl bg-slate-200" />
          </div>
          <div className="h-96 rounded-[2rem] bg-slate-200" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center px-4 py-16">
        <div className="w-full rounded-[2rem] border border-rose-200 bg-white p-8 text-center shadow-xl shadow-slate-200/70">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <X className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-950">Dashboard Error</h1>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchApplications();
              fetchAssignedCoupons();
              fetchAvailableCoupons();
            }}
            className="mt-6 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1920px] px-4 py-10 sm:px-6 lg:px-8">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex min-w-[300px] items-center justify-between rounded-2xl p-4 text-white shadow-lg ${
              notification.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
          >
            <span>{notification.message}</span>
            <button
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
              className="ml-4 hover:opacity-75"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-blue-100 bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 p-6 text-white shadow-xl shadow-blue-950/20">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-blue-100 backdrop-blur">
              <BarChart2 className="h-4 w-4" />
              Admin Dashboard
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Applications Dashboard</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
              Review applications, manage statuses, assign coupons, and export application data from one workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
          {selectedApplications.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setIsBulkActionOpen(!isBulkActionOpen)}
                className={`${actionButtonClassName} bg-white text-blue-700 hover:bg-blue-50 focus:ring-white/30`}
              >
                Bulk Actions ({selectedApplications.length})
              </button>
              {isBulkActionOpen && (
                <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        handleBulkStatusUpdate('approved');
                        setIsBulkActionOpen(false);
                      }}
                      className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Approve Selected
                    </button>
                    <button
                      onClick={() => {
                        handleBulkStatusUpdate('accepted');
                        setIsBulkActionOpen(false);
                      }}
                      className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Accept Selected
                    </button>
                    <button
                      onClick={() => {
                        handleBulkStatusUpdate('rejected');
                        setIsBulkActionOpen(false);
                      }}
                      className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Reject Selected
                    </button>
                    <button
                      onClick={() => {
                        handleBulkDelete();
                        setIsBulkActionOpen(false);
                      }}
                      className="block w-full px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50"
                    >
                      Delete Selected
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          <button
            onClick={handleBulkCouponAssignment}
            className={`${actionButtonClassName} bg-emerald-500 text-white hover:bg-emerald-400 focus:ring-emerald-200/40`}
          >
            <Gift className="h-5 w-5" />
            Auto-Assign Coupons
          </button>
          <button
            onClick={() => router.push('/dashboard/analytics')}
            className={`${actionButtonClassName} bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/15 focus:ring-white/30`}
          >
            <BarChart2 className="h-5 w-5" />
            Analytics
          </button>
          <button
            onClick={() => setIsDownloadModalOpen(true)}
            className={`${actionButtonClassName} bg-white text-blue-700 hover:bg-blue-50 focus:ring-white/30`}
          >
            <Download className="h-5 w-5" />
            Download All
          </button>
          <button
            onClick={handleLogout}
            className={`${actionButtonClassName} bg-slate-900/40 text-white ring-1 ring-white/15 hover:bg-slate-900/60 focus:ring-white/30`}
          >
            <LogOut className="h-5 w-5" />
            Log Out
          </button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Applications"
          value={totalApplications}
          helper={`Showing ${showingFrom}-${showingTo}`}
          icon={<Users className="h-5 w-5" />}
          tone="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Pending Review"
          value={pendingCount}
          helper="On this page"
          icon={<Clock3 className="h-5 w-5" />}
          tone="bg-amber-50 text-amber-600"
        />
        <StatCard
          label="Accepted"
          value={acceptedCount}
          helper="Ready for coupons"
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Available Coupons"
          value={availableCoupons.length}
          helper={`${assignedCoupons.length} assigned, ${expiredCoupons.length} expired`}
          icon={<Ticket className="h-5 w-5" />}
          tone="bg-rose-50 text-rose-600"
        />
      </div>

      <div className="mt-6 inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
        <button
          onClick={() => setActiveTab('applications')}
          className={`rounded-full px-5 py-2 text-sm font-bold transition ${
            activeTab === 'applications'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
          }`}
        >
          Applications
        </button>
        <button
          onClick={() => setActiveTab('coupons')}
          className={`rounded-full px-5 py-2 text-sm font-bold transition ${
            activeTab === 'coupons'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
          }`}
        >
          Coupon Management
        </button>
      </div>

      {activeTab === 'applications' && (
        <>
      <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
            <Filter className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-950">Filters</h2>
            <p className="text-sm text-slate-500">Narrow down applications by student, counselor, status, payment, or date.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <div className="xl:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Search Name</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Search by name..."
              className={`${inputClassName} pl-9`}
          />
          </div>
        </div>
        <div className="xl:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Search Counselor Email</label>
          <input
            type="text"
            value={searchCounselorEmail}
            onChange={(e) => setSearchCounselorEmail(e.target.value)}
            placeholder="Search by counselor email..."
            className={inputClassName}
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment</label>
          <select
            value={filterPayment}
            onChange={e => setFilterPayment(e.target.value as any)}
            className={inputClassName}
          >
            <option value="all">All</option>
            <option value="yes">Willing to Pay</option>
            <option value="no">Not Willing</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
            className={inputClassName}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="accepted">Accepted</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Application Year</label>
          <select
            value={filterYear}
            onChange={e => setFilterYear(e.target.value as 'all' | '2026' | '2025')}
            className={inputClassName}
          >
            <option value="all">All Years</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Submitted From</label>
          <input
            type="date"
            ref={dateFromRef}
            value={filterDateFrom}
            onChange={e => setFilterDateFrom(e.target.value)}
            className={inputClassName}
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Submitted To</label>
          <input
            type="date"
            ref={dateToRef}
            value={filterDateTo}
            onChange={e => setFilterDateTo(e.target.value)}
            className={inputClassName}
          />
        </div>
        <button
          className="self-end rounded-full bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          onClick={() => {
            setFilterPayment('all');
            setFilterStatus('all');
            setFilterYear('all');
            setFilterDateFrom('');
            setFilterDateTo('');
            setSearchName('');
            setSearchCounselorEmail('');
            if (dateFromRef.current) dateFromRef.current.value = '';
            if (dateToRef.current) dateToRef.current.value = '';
          }}
        >
          Clear Filters
        </button>
        </div>
      </div>
      <div className="mt-6 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Application Queue</h2>
            <p className="text-sm text-slate-500">Showing page {currentPage} of {totalPages}</p>
          </div>
          {selectedApplications.length > 0 && (
            <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 ring-1 ring-blue-200">
              {selectedApplications.length} selected
            </span>
          )}
        </div>
        <div className="w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  <input
                    type="checkbox"
                    checked={applications.length > 0 && selectedApplications.length === applications.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Program</th>
                <th
                  className="cursor-pointer select-none px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                  onClick={() => {
                    setSortBy('counselorEmail');
                    setSortOrder(sortBy === 'counselorEmail' && sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  Counselor Email
                  {sortBy === 'counselorEmail' && (sortOrder === 'asc' ? ' ▲' : ' ▼')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Work Preferences</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Payment</th>
                <th
                  className="cursor-pointer select-none px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                  onClick={() => {
                    setSortBy('status');
                    setSortOrder(sortBy === 'status' && sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  Status
                  {sortBy === 'status' && (sortOrder === 'asc' ? ' ▲' : ' ▼')}
                </th>
                <th
                  className="cursor-pointer select-none px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                  onClick={() => {
                    setSortBy('submittedAt');
                    setSortOrder(sortBy === 'submittedAt' && sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  Submitted
                  {sortBy === 'submittedAt' && (sortOrder === 'asc' ? ' ▲' : ' ▼')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Coupon Code</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredApplications.map((app) => {
                const workPreferences = app.workPreferences || {
                  bronx: false,
                  brooklyn: false,
                  queens: false,
                  statenIsland: false,
                  manhattan: false,
                  morning: false,
                  afternoon: false,
                  evening: false,
                  weekend: false
                };

                return (
                  <tr key={app._id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedApplications.includes(app._id)}
                        onChange={(e) => handleSelectApplication(app._id, e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-950">{app.firstName} {app.lastName}</div>
                      <div className="mt-1 text-xs text-slate-500">{app.email.toLowerCase()}</div>
                      <div className="mt-1 text-xs text-slate-500">({app.phone.slice(0, 3)}) {app.phone.slice(3, 6)}-{app.phone.slice(6)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                      <div className="font-semibold text-slate-800">{app.program}</div>
                      <div className="mt-1">{app.site}</div>
                      <div>{app.geographicDistrict}</div>
                      <div>{app.lcgmsCode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">{app.counselor_email.toLowerCase()}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      <div className="flex max-w-xs flex-wrap gap-1.5">
                        {[
                          workPreferences.bronx && 'Bronx',
                          workPreferences.brooklyn && 'Brooklyn',
                          workPreferences.queens && 'Queens',
                          workPreferences.statenIsland && 'Staten Island',
                          workPreferences.manhattan && 'Manhattan',
                          workPreferences.morning && 'Morning',
                          workPreferences.afternoon && 'Afternoon',
                          workPreferences.evening && 'Evening',
                          workPreferences.weekend && 'Weekend',
                        ].filter(Boolean).map((preference) => (
                          <span key={preference as string} className="rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-600">
                            {preference}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${getPaymentBadgeClass(app.fingerprintPaymentPreference)}`}>
                        {app.fingerprintPaymentPreference === 'yes' ? 'Willing to Pay' :
                         app.fingerprintPaymentPreference === 'no' ? 'Not Willing' :
                         'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${getStatusBadgeClass(app.status || 'pending')}`}>
                        {(app.status || 'pending').charAt(0).toUpperCase() + (app.status || 'pending').slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-slate-500">
                      {format(new Date(app.submittedAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                      {getStudentCouponCode(app._id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => router.push(`/dashboard/${app._id}`)}
                          className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                        >
                          View
                        </button>
                        {app.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(app._id, 'approved')}
                              className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatusChange(app._id, 'rejected')}
                              className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteApplication(app._id)}
                          className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-rose-50 hover:text-rose-700"
                          title="Delete application"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredApplications.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                        <Search className="h-6 w-6" />
                      </div>
                      <h3 className="text-base font-bold text-slate-950">No applications found</h3>
                      <p className="mt-1 text-sm text-slate-500">Try clearing filters or adjusting your search.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm font-medium text-slate-600">
          Showing {showingFrom}-{showingTo} of {totalApplications || applications.length}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
        </>
      )}

      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        onDownload={handleDownload}
      />

      {/* Coupon Assignments Section */}
      {activeTab === 'coupons' && (
      <div className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <Gift className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-950">Coupon Management</h2>
                <p className="text-sm text-slate-500">Track assigned coupon codes and assign new ones.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={couponUploadRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleUpload2026Coupons}
                className="hidden"
              />
              <button
                onClick={() => couponUploadRef.current?.click()}
                disabled={isUploadingCoupons}
                className={`${actionButtonClassName} bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <Upload className="h-4 w-4" />
                {isUploadingCoupons ? 'Uploading...' : 'Upload 2026 Coupons'}
              </button>
              <button
                onClick={handleExpireAvailableCoupons}
                disabled={availableCoupons.length === 0}
                className={`${actionButtonClassName} bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-100 disabled:cursor-not-allowed disabled:opacity-50`}
              >
                Expire Available Coupons
              </button>
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className={`${actionButtonClassName} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-100`}
              >
                Assign New Coupon
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid gap-4 border-b border-slate-200 p-6 md:grid-cols-3">
          <div className="rounded-3xl bg-emerald-50 p-5 text-emerald-700 ring-1 ring-emerald-100">
            <p className="text-sm font-semibold">Available</p>
            <p className="mt-2 text-3xl font-bold">{availableCoupons.length}</p>
            <p className="mt-1 text-xs">Ready for 2026 assignments</p>
          </div>
          <div className="rounded-3xl bg-blue-50 p-5 text-blue-700 ring-1 ring-blue-100">
            <p className="text-sm font-semibold">Assigned</p>
            <p className="mt-2 text-3xl font-bold">{assignedCoupons.length}</p>
            <p className="mt-1 text-xs">Currently linked to students</p>
          </div>
          <div className="rounded-3xl bg-slate-100 p-5 text-slate-700 ring-1 ring-slate-200">
            <p className="text-sm font-semibold">Expired</p>
            <p className="mt-2 text-3xl font-bold">{expiredCoupons.length}</p>
            <p className="mt-1 text-xs">Includes legacy used coupons</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Coupon Code
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Student
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Assigned Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {assignedCoupons.map((assignment) => (
                <tr key={assignment._id} className="transition hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="rounded-full bg-rose-50 px-3 py-1 text-sm font-bold text-rose-700 ring-1 ring-rose-200">
                      {assignment.coupon_code}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-slate-950">
                      {assignment.student ? `${assignment.student.firstName} ${assignment.student.lastName}` : 'Loading...'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-500">
                      {assignment.student?.email || 'Loading...'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-500">
                      {new Date(assignment.assigned_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleUnassignCoupon(assignment._id, assignment.assigned_to)}
                      className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                    >
                      Unassign
                    </button>
                  </td>
                </tr>
              ))}
              {assignedCoupons.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">
                    No coupon assignments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="grid gap-6 border-t border-slate-200 p-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-base font-bold text-slate-950">Available Coupons</h3>
            <p className="mt-1 text-sm text-slate-500">New coupons ready to assign.</p>
            <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
              {availableCoupons.map((coupon) => (
                <div key={coupon._id} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                  <span className="font-mono text-sm font-bold text-slate-800">{coupon.coupon_code}</span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                    Available
                  </span>
                </div>
              ))}
              {availableCoupons.length === 0 && (
                <div className="rounded-2xl bg-white px-4 py-6 text-center text-sm text-slate-500 ring-1 ring-slate-200">
                  No available coupons found.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-base font-bold text-slate-950">Expired Coupons</h3>
            <p className="mt-1 text-sm text-slate-500">Past used coupons are treated as expired.</p>
            <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
              {expiredCoupons.map((coupon) => (
                <div key={coupon._id} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                  <span className="font-mono text-sm font-bold text-slate-800">{coupon.coupon_code}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                    Expired
                  </span>
                </div>
              ))}
              {expiredCoupons.length === 0 && (
                <div className="rounded-2xl bg-white px-4 py-6 text-center text-sm text-slate-500 ring-1 ring-slate-200">
                  No expired coupons found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      <AssignCouponModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setSelectedStudent('');
          setSelectedCoupon('');
        }}
        onAssign={handleAssignCoupon}
        availableCoupons={availableCoupons}
        applications={applications}
        selectedStudent={selectedStudent}
        setSelectedStudent={setSelectedStudent}
        selectedCoupon={selectedCoupon}
        setSelectedCoupon={setSelectedCoupon}
        assignedCoupons={assignedCoupons}
      />
    </div>
  );
}

function AssignCouponModal({ 
  isOpen, 
  onClose, 
  onAssign, 
  availableCoupons,
  applications,
  selectedStudent,
  setSelectedStudent,
  selectedCoupon,
  setSelectedCoupon,
  assignedCoupons
}: {
  isOpen: boolean;
  onClose: () => void;
  onAssign: () => void;
  availableCoupons: AvailableCoupon[];
  applications: Application[];
  selectedStudent: string;
  setSelectedStudent: (id: string) => void;
  selectedCoupon: string;
  setSelectedCoupon: (id: string) => void;
  assignedCoupons: CouponAssignment[];
}) {
  if (!isOpen) return null;

  // Get list of student IDs who already have coupons assigned
  const studentsWithCoupons = assignedCoupons.map(coupon => coupon.assigned_to);

  // Filter applications to only show accepted students without coupons
  const availableStudents = applications.filter(app => 
    app.status === 'accepted' && !studentsWithCoupons.includes(app._id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl shadow-slate-950/20">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <Gift className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-bold text-slate-950">Assign Coupon</h3>
        <p className="mt-2 text-sm text-slate-600">Select an accepted student and an available coupon code.</p>
        
        <div className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Select Student
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className={inputClassName}
            >
              <option value="">Select a student</option>
              {availableStudents.map(app => (
                <option key={app._id} value={app._id}>
                  {app.firstName} {app.lastName} ({app.email})
                </option>
              ))}
            </select>
            {availableStudents.length === 0 && (
              <p className="mt-2 text-sm text-slate-500">
                No available students found. All accepted students have been assigned coupons.
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Select Coupon
            </label>
            <select
              value={selectedCoupon}
              onChange={(e) => setSelectedCoupon(e.target.value)}
              className={inputClassName}
            >
              <option value="">Select a coupon</option>
              {availableCoupons.map(coupon => (
                <option key={coupon._id} value={coupon._id}>
                  {coupon.coupon_code}
                </option>
              ))}
            </select>
            {availableCoupons.length === 0 && (
              <p className="mt-2 text-sm text-slate-500">
                No available coupons found.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            onClick={onAssign}
            disabled={!selectedStudent || !selectedCoupon}
            className={`rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 ${
              (!selectedStudent || !selectedCoupon) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}