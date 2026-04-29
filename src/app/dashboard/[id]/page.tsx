'use client';

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { format } from 'date-fns';
import { formatDate } from '@/app/lib/utils';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Edit3,
  Gift,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Eye,
  EyeOff,
  UserRound,
  XCircle,
} from 'lucide-react';

interface Application {
  _id: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  counselor_email: string;
  ssn: string;
  dateOfBirth: string;
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
  submittedAt: string;
  status: 'pending' | 'reviewed' | 'approved' | 'accepted' | 'rejected';
  coupon?: {
    _id: string;
    coupon_code: string;
    assigned_at: string;
  };
  createdAt: string;
}

const cardClassName = 'rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70';

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-2 text-sm font-semibold text-slate-900">{value || 'Not provided'}</dd>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function isValidDate(value?: string | null) {
  if (!value) return false;
  return !Number.isNaN(new Date(value).getTime());
}

function isReadableSsn(value?: string | null) {
  if (!value) return false;
  return /^\d{3}-?\d{2}-?\d{4}$/.test(value);
}

export default function ApplicationDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [coupon, setCoupon] = useState<Application['coupon'] | null>(null);
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/applications/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Application not found');
        }
        throw new Error('Failed to fetch application');
      }
      const data = await response.json();
      setApplication(data);

      // Fetch coupon information
      try {
        const couponResponse = await fetch('/api/coupons');
        if (couponResponse.ok) {
          const coupons = await couponResponse.json();
          const studentCoupon = coupons.find((c: any) => c.assigned_to === id);
          setCoupon(studentCoupon || null);
        }
      } catch (couponErr) {
        console.error('Error fetching coupon:', couponErr);
        // Don't throw error for coupon fetch failure
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  

  const handleStatusChange = async (newStatus: Application['status']) => {
    try {
      setIsUpdating(true);
      setUpdateError(null);
      
      const response = await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update status');
      }
      
      setApplication(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Failed to update status');
      // Revert the select value to the previous status
      if (application) {
        const select = document.querySelector('select') as HTMLSelectElement;
        if (select) {
          select.value = application.status;
        }
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEdit = () => {
    router.push(`/edit/${id}`);
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
  
  if (error) {
    if (error === 'Application not found') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center px-4">
            <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Application Not Found</h2>
            <p className="text-gray-600 mb-8">
              Sorry, we couldn't find the application you're looking for.
            </p>
            <Link 
              href="/dashboard" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center px-4">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">Oops!</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-8">
            {error}
          </p>
          <div className="space-x-4">
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                fetchApplication();
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try again
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  if (!application) return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">Application not found</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const workPreferences = application.workPreferences || {
    bronx: false,
    brooklyn: false,
    queens: false,
    statenIsland: false,
    manhattan: false,
    morning: false,
    afternoon: false,
    evening: false,
    weekend: false,
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'accepted':
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
      case 'rejected':
        return 'bg-rose-50 text-rose-700 ring-rose-200';
      case 'reviewed':
        return 'bg-blue-50 text-blue-700 ring-blue-200';
      default:
        return 'bg-amber-50 text-amber-700 ring-amber-200';
    }
  };

  const getPaymentLabel = () => {
    if (application.fingerprintPaymentPreference === 'yes') return 'Willing to Pay';
    if (application.fingerprintPaymentPreference === 'no') return 'Not Willing to Pay';
    return 'Pending Decision';
  };

  const ssnDisplay = showSensitiveInfo
    ? (isReadableSsn(application.ssn) ? application.ssn : 'Unable to decrypt')
    : 'Confidential';

  const dateOfBirthDisplay = showSensitiveInfo
    ? (isValidDate(application.dateOfBirth) ? formatDate(application.dateOfBirth) : 'Unable to decrypt')
    : 'Confidential';

  const preferredLocations = [
    workPreferences.bronx && 'Bronx',
    workPreferences.brooklyn && 'Brooklyn',
    workPreferences.queens && 'Queens',
    workPreferences.statenIsland && 'Staten Island',
    workPreferences.manhattan && 'Manhattan',
  ].filter(Boolean);

  const preferredTimes = [
    workPreferences.morning && 'Morning',
    workPreferences.afternoon && 'Afternoon',
    workPreferences.evening && 'Evening',
    workPreferences.weekend && 'Weekend',
  ].filter(Boolean);

  const verificationItems = [
    {
      label: 'Fingerprint Questionnaire',
      complete: application.fingerprintQuestionnaire,
      completeText: 'Completed',
      incompleteText: 'Not Completed',
    },
    {
      label: 'Documents',
      complete: application.documentsVerified,
      completeText: 'Verified',
      incompleteText: 'Not Verified',
    },
    {
      label: 'Attendance',
      complete: application.attendanceVerified,
      completeText: 'Verified',
      incompleteText: 'Not Verified',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-700">
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="overflow-hidden rounded-[2rem] border border-blue-100 bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 p-6 text-white shadow-xl shadow-blue-950/20">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-blue-100 backdrop-blur">
                <UserRound className="h-4 w-4" />
                Application Record
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {application.firstName} {application.lastName}
              </h1>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-blue-100">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Submitted {formatDate(application.submittedAt)}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {application.email || 'No email'}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {application.phone || 'No phone'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className={`inline-flex rounded-full px-4 py-2 text-sm font-bold ring-1 ${getStatusBadgeClass(application.status || 'pending')}`}>
                {(application.status || 'pending').charAt(0).toUpperCase() + (application.status || 'pending').slice(1)}
              </span>
              <Link
                href={`/edit/${id}`}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-blue-50"
              >
                <Edit3 className="h-4 w-4" />
                Edit Application
              </Link>
            </div>
          </div>
        </div>

        <div className={cardClassName}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <SectionHeader
                icon={<Clock3 className="h-5 w-5" />}
                title="Review Status"
                description="Update the student application status from this record."
              />
              {updateError && (
                <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {updateError}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <select
                value={application.status || 'pending'}
                onChange={(e) => handleStatusChange(e.target.value as Application['status'])}
                disabled={isUpdating}
                className={`rounded-full px-4 py-2 text-sm font-bold ring-1 outline-none transition focus:ring-4 focus:ring-blue-100 ${getStatusBadgeClass(application.status || 'pending')} ${isUpdating ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="approved">Approved</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
              {isUpdating && <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-blue-600" />}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className={`${cardClassName} lg:col-span-2`}>
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <SectionHeader
                icon={<UserRound className="h-5 w-5" />}
                title="Personal Information"
                description="Student contact, identity, and counselor details."
              />
              <button
                type="button"
                onClick={() => setShowSensitiveInfo(prev => !prev)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
              >
                {showSensitiveInfo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showSensitiveInfo ? 'Hide sensitive info' : 'View sensitive info'}
              </button>
            </div>
            <dl className="grid gap-4 md:grid-cols-2">
              <DetailItem label="Full Name" value={`${application.firstName || ''} ${application.lastName || ''}`.trim()} />
              <DetailItem label="SSN" value={ssnDisplay} />
              <DetailItem label="Date of Birth" value={dateOfBirthDisplay} />
              <DetailItem label="Student Email" value={application.email} />
              <DetailItem label="Counselor Email" value={application.counselor_email} />
              <DetailItem label="Phone" value={application.phone} />
              <DetailItem
                label="Address"
                value={
                  <>
                    {application.address || 'Not provided'}
                    <br />
                    {[application.city, application.state, application.zipCode].filter(Boolean).join(', ')}
                  </>
                }
              />
            </dl>
          </div>

          <div className={cardClassName}>
            <SectionHeader
              icon={<Gift className="h-5 w-5" />}
              title="Coupon Information"
              description="Current coupon assignment for this student."
            />
            {coupon ? (
              <div className="rounded-3xl bg-rose-50 p-5 text-rose-700 ring-1 ring-rose-100">
                <p className="break-all font-mono text-lg font-bold leading-7 sm:text-xl">{coupon.coupon_code}</p>
                <p className="mt-2 text-sm font-medium">
                  Assigned on {format(new Date(coupon.assigned_at), 'MMMM d, yyyy')}
                </p>
              </div>
            ) : (
              <div className="rounded-3xl bg-slate-50 p-5 text-slate-600 ring-1 ring-slate-100">
                <p className="text-sm font-semibold">No coupon assigned</p>
                {application.status === 'accepted' && (
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="mt-4 rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
                  >
                    Assign Coupon
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={cardClassName}>
          <SectionHeader
            icon={<BriefcaseBusiness className="h-5 w-5" />}
            title="Program Information"
            description="D79 District Office routing and program details."
          />
          <dl className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <DetailItem label="Program" value={application.program} />
            <DetailItem label="Site" value={application.site} />
            <DetailItem label="LCGMS Code" value={application.lcgmsCode} />
            <DetailItem label="Geographic District" value={application.geographicDistrict} />
          </dl>
        </div>

        <div className={cardClassName}>
          <SectionHeader
            icon={<MapPin className="h-5 w-5" />}
            title="Work Preferences"
            description="Preferred locations and times selected by the student."
          />
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-bold text-slate-700">Preferred Locations</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {preferredLocations.length > 0 ? preferredLocations.map((preference) => (
                  <span key={preference as string} className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 ring-1 ring-blue-200">
                    {preference}
                  </span>
                )) : <span className="text-sm text-slate-500">None selected</span>}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-700">Preferred Times</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {preferredTimes.length > 0 ? preferredTimes.map((preference) => (
                  <span key={preference as string} className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                    {preference}
                  </span>
                )) : <span className="text-sm text-slate-500">None selected</span>}
              </div>
            </div>
          </div>
        </div>

        <div className={cardClassName}>
          <SectionHeader
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Verification & Payment"
            description="Required counselor checks and fingerprint payment preference."
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {verificationItems.map((item) => (
              <div
                key={item.label}
                className={`rounded-3xl p-5 ring-1 ${item.complete ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : 'bg-rose-50 text-rose-700 ring-rose-100'}`}
              >
                <div className="mb-3">
                  {item.complete ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
                </div>
                <h3 className="text-sm font-bold">{item.label}</h3>
                <p className="mt-1 text-sm">{item.complete ? item.completeText : item.incompleteText}</p>
              </div>
            ))}
            <div className="rounded-3xl bg-amber-50 p-5 text-amber-700 ring-1 ring-amber-100">
              <CreditCard className="mb-3 h-6 w-6" />
              <h3 className="text-sm font-bold">Fingerprint Payment</h3>
              <p className="mt-1 text-sm">{getPaymentLabel()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 