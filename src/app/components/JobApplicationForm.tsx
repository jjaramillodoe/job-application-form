'use client';

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  BriefcaseBusiness,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  LockKeyhole,
  MapPin,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';

interface FormData {
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
}

type WorkPreferenceKey = keyof FormData['workPreferences'];

const inputClassName =
  'mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100';

const selectClassName =
  'mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100';

const sectionClassName =
  'rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-sm shadow-slate-200/70 sm:p-8';

const locationOptions: Array<{ key: WorkPreferenceKey; label: string; description: string }> = [
  { key: 'bronx', label: 'Bronx', description: 'North NYC' },
  { key: 'brooklyn', label: 'Brooklyn', description: 'Central routes' },
  { key: 'queens', label: 'Queens', description: 'Eastern routes' },
  { key: 'statenIsland', label: 'Staten Island', description: 'Harbor routes' },
  { key: 'manhattan', label: 'Manhattan', description: 'Core NYC' },
];

const timeOptions: Array<{ key: WorkPreferenceKey; label: string; description: string }> = [
  { key: 'morning', label: 'Morning', description: 'Early day shifts' },
  { key: 'afternoon', label: 'Afternoon', description: 'Midday coverage' },
  { key: 'evening', label: 'Evening', description: 'After-school hours' },
  { key: 'weekend', label: 'Weekend', description: 'Saturday/Sunday' },
];

const RequiredMark = () => <span className="text-rose-500">*</span>;

const FieldShell = ({
  label,
  htmlFor,
  required,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) => (
  <div>
    <label htmlFor={htmlFor} className="text-sm font-semibold text-slate-700">
      {label} {required && <RequiredMark />}
    </label>
    {children}
    {hint && <p className="mt-2 text-xs leading-5 text-slate-500">{hint}</p>}
  </div>
);

const SectionHeader = ({
  icon,
  eyebrow,
  title,
  description,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) => (
  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start">
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
      {icon}
    </div>
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
    </div>
  </div>
);

const PreferenceCard = ({
  checked,
  label,
  description,
  onChange,
}: {
  checked: boolean;
  label: string;
  description: string;
  onChange: () => void;
}) => (
  <label
    className={`group flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
      checked
        ? 'border-blue-500 bg-blue-50 shadow-sm shadow-blue-100'
        : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'
    }`}
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
    />
    <span>
      <span className="block text-sm font-semibold text-slate-900">{label}</span>
      <span className="mt-1 block text-xs text-slate-500">{description}</span>
    </span>
  </label>
);

const ErrorModal = ({ isOpen, onClose, message }: { isOpen: boolean; onClose: () => void; message: string }) => {
  if (!isOpen) return null;

  const modalTitle = message ? 'Application Issue' : 'Duplicate Application';
  const modalBody = message || 'An application with this email or SSN already exists.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl shadow-slate-950/20">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h3 className="mb-2 text-xl font-bold text-slate-950">{modalTitle}</h3>
        <p className="mb-6 text-sm leading-6 text-slate-600">
          {modalBody} Please contact{' '}
          <a 
            href="mailto:jjaramillo7@schools.nyc.gov"
            className="font-semibold text-blue-600 underline-offset-4 hover:text-blue-800 hover:underline"
          >
            Javier Jaramillo
          </a>{' '}
          if you believe this is an error.
        </p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default function JobApplicationForm() {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSSN, setShowSSN] = useState(false);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: 'NY',
    zipCode: '',
    phone: '',
    email: '',
    counselor_email: '',
    ssn: '',
    dateOfBirth: '',
    program: '',
    site: '',
    lcgmsCode: '',
    geographicDistrict: '',
    workPreferences: {
      bronx: false,
      brooklyn: false,
      queens: false,
      statenIsland: false,
      manhattan: false,
      morning: false,
      afternoon: false,
      evening: false,
      weekend: false,
    },
    fingerprintQuestionnaire: false,
    documentsVerified: false,
    attendanceVerified: false,
    fingerprintPaymentPreference: 'pending',
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  const validateSSN = (ssn: string): boolean => {
    const cleanSSN = ssn.replace(/\D/g, '');
    if (cleanSSN.length !== 9) return false;
    const groups = [
      cleanSSN.substring(0, 3),
      cleanSSN.substring(3, 5),
      cleanSSN.substring(5, 9)
    ];
    if (groups.some(group => parseInt(group) === 0)) return false;
    const firstGroup = parseInt(groups[0]);
    if (firstGroup === 666 || (firstGroup >= 900 && firstGroup <= 999)) return false;
    return true;
  };

  const handleSSNChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    let formattedValue = '';
    if (value.length > 0) {
      formattedValue = value.substring(0, 3);
      if (value.length > 3) {
        formattedValue += '-' + value.substring(3, 5);
      }
      if (value.length > 5) {
        formattedValue += '-' + value.substring(5, 9);
      }
    }
    setFormData(prev => ({
      ...prev,
      ssn: formattedValue
    }));
  };

  const handleWorkPreferenceChange = (preference: keyof FormData['workPreferences']) => {
    setFormData(prev => ({
      ...prev,
      workPreferences: {
        ...prev.workPreferences,
        [preference]: !prev.workPreferences[preference]
      }
    }));
  };

  const checkForDuplicate = async (email: string, ssn: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/check-duplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, ssn }),
      });

      if (!response.ok) {
        throw new Error('Failed to check for duplicates');
      }

      const data = await response.json();
      return data.isDuplicate;
    } catch (err) {
      console.error('Error checking for duplicates:', err);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Custom validation for work preferences
    const locationPrefs = [
      formData.workPreferences.bronx,
      formData.workPreferences.brooklyn,
      formData.workPreferences.queens,
      formData.workPreferences.statenIsland,
      formData.workPreferences.manhattan
    ];
    const timePrefs = [
      formData.workPreferences.morning,
      formData.workPreferences.afternoon,
      formData.workPreferences.evening,
      formData.workPreferences.weekend
    ];
    if (!locationPrefs.some(Boolean)) {
      setError('Please select at least one work location (Bronx, Brooklyn, Queens, Staten Island, Manhattan)');
      return;
    }
    if (!timePrefs.some(Boolean)) {
      setError('Please select at least one work time preference (Morning, Afternoon, Evening, Weekend)');
      return;
    }
    if (!validateSSN(formData.ssn)) {
      setError('Please enter a valid SSN');
      return;
    }
    if (!formData.fingerprintQuestionnaire || !formData.documentsVerified || !formData.attendanceVerified) {
      setError('Please verify all required checks before submitting');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setIsCheckingDuplicate(true);

    try {
      // Check for duplicates first
      const isDuplicate = await checkForDuplicate(formData.email, formData.ssn);
      
      if (isDuplicate) {
        setShowErrorModal(true);
        return;
      }

      const response = await fetch('/api/submit-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit application');
      }

      router.push('/success');
    } catch (err) {
      setModalMessage('Failed to submit application. Please try again.');
      setShowErrorModal(true);
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
      setIsCheckingDuplicate(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="mx-auto w-full max-w-5xl">
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={modalMessage}
      />

      <div className="relative overflow-hidden rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-950 via-blue-800 to-sky-700 p-6 text-white shadow-xl shadow-blue-950/20 sm:p-8">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 left-10 h-52 w-52 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="relative">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-blue-50 backdrop-blur">
            <Sparkles className="h-4 w-4" />
            District 79 Student Opportunity
          </div>
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
            Job Application Form
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
            Complete each section carefully. Sensitive information is encrypted and used only to process the application.
          </p>
        </div>
      </div>

      {isClient ? (
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="rounded-[2rem] border border-blue-100 bg-blue-50/90 p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-blue-950">Important Directions</h2>
                <p className="mt-1 text-sm leading-6 text-blue-800">
                  Please fill this out for each student. Before submitting names, make sure you have:
                </p>
                <div className="mt-4 grid gap-3 text-sm text-blue-900 md:grid-cols-3">
                  <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-blue-100">
                    Reviewed the Fingerprint Questionnaire with them.
                  </div>
                  <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-blue-100">
                    Seen their personal documents in person and confirmed they can be uploaded.
                  </div>
                  <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-blue-100">
                    Reviewed their attendance to ensure they are regularly attending.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <section className={sectionClassName}>
            <SectionHeader
              icon={<BriefcaseBusiness className="h-6 w-6" />}
              eyebrow="Step 1"
              title="Program Information"
              description="Tell us where the student is enrolled so the application can be routed correctly."
            />

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FieldShell label="Program" htmlFor="program" required>
                <input
                  type="text"
                  id="program"
                  name="program"
                  value={formData.program}
                  onChange={handleChange}
                  required
                  className={inputClassName}
                />
              </FieldShell>

              <FieldShell label="Site" htmlFor="site" required>
                <input
                  type="text"
                  id="site"
                  name="site"
                  value={formData.site}
                  onChange={handleChange}
                  required
                  className={inputClassName}
                />
              </FieldShell>

              <FieldShell label="LCGMS Code" htmlFor="lcgmsCode" required>
                <input
                  type="text"
                  id="lcgmsCode"
                  name="lcgmsCode"
                  value={formData.lcgmsCode}
                  onChange={handleChange}
                  required
                  className={inputClassName}
                />
              </FieldShell>

              <FieldShell label="Geographic District" htmlFor="geographicDistrict" required>
                <input
                  type="text"
                  id="geographicDistrict"
                  name="geographicDistrict"
                  value={formData.geographicDistrict}
                  onChange={handleChange}
                  required
                  className={inputClassName}
                />
              </FieldShell>
            </div>
          </section>

          <section className={sectionClassName}>
            <SectionHeader
              icon={<UserRound className="h-6 w-6" />}
              eyebrow="Step 2"
              title="Student Information"
              description="Enter the student's legal name, contact details, and secure identification information."
            />

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FieldShell label="First Name" htmlFor="firstName" required>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className={inputClassName}
                />
              </FieldShell>

              <FieldShell label="Last Name" htmlFor="lastName" required>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className={inputClassName}
                />
              </FieldShell>

              <FieldShell label="Date of Birth" htmlFor="dateOfBirth" required>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                  className={inputClassName}
                />
              </FieldShell>

              <FieldShell label="Social Security Number" htmlFor="ssn" required hint="Format: XXX-XX-XXXX">
                <div className="relative">
                  <input
                    type={showSSN ? 'text' : 'password'}
                    id="ssn"
                    name="ssn"
                    value={formData.ssn}
                    onChange={handleSSNChange}
                    required
                    pattern="\d{3}-\d{2}-\d{4}"
                    placeholder="XXX-XX-XXXX"
                    maxLength={11}
                    className={`${inputClassName} pr-14`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSSN(!showSSN)}
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    aria-label={showSSN ? 'Hide social security number' : 'Show social security number'}
                  >
                    {showSSN ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FieldShell>

              <div className="md:col-span-2">
                <FieldShell label="Street Address" htmlFor="address" required>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    className={inputClassName}
                  />
                </FieldShell>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 md:col-span-2">
                <FieldShell label="City" htmlFor="city" required>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className={inputClassName}
                  />
                </FieldShell>

                <FieldShell label="State" htmlFor="state" required>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    className={inputClassName}
                  />
                </FieldShell>

                <FieldShell label="ZIP Code" htmlFor="zipCode" required>
                  <input
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    required
                    pattern="[0-9]{5}"
                    className={inputClassName}
                  />
                </FieldShell>
              </div>

              <FieldShell label="Phone Number" htmlFor="phone" required hint="Enter 10 digits without dashes.">
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{10}"
                  className={inputClassName}
                />
              </FieldShell>

              <FieldShell label="Email Address" htmlFor="email" required>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={inputClassName}
                />
              </FieldShell>

              <div className="md:col-span-2">
                <FieldShell label="Counselor Email Address" htmlFor="counselor_email" required>
                  <input
                    type="email"
                    id="counselor_email"
                    name="counselor_email"
                    value={formData.counselor_email}
                    onChange={handleChange}
                    required
                    className={inputClassName}
                  />
                </FieldShell>
              </div>
            </div>
          </section>

          <section className={sectionClassName}>
            <SectionHeader
              icon={<MapPin className="h-6 w-6" />}
              eyebrow="Step 3"
              title="Work Preferences"
              description="Select at least one location and one time preference for the student."
            />

            <div className="space-y-6">
              <div>
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  Preferred Location <RequiredMark />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {locationOptions.map((option) => (
                    <PreferenceCard
                      key={option.key}
                      checked={formData.workPreferences[option.key]}
                      label={option.label}
                      description={option.description}
                      onChange={() => handleWorkPreferenceChange(option.key)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Clock className="h-4 w-4 text-blue-600" />
                  Preferred Time <RequiredMark />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {timeOptions.map((option) => (
                    <PreferenceCard
                      key={option.key}
                      checked={formData.workPreferences[option.key]}
                      label={option.label}
                      description={option.description}
                      onChange={() => handleWorkPreferenceChange(option.key)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className={sectionClassName}>
            <SectionHeader
              icon={<ShieldCheck className="h-6 w-6" />}
              eyebrow="Step 4"
              title="Verification & Payment"
              description="Confirm required counselor checks and capture the fingerprint payment preference."
            />

            <div className="grid gap-4">
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50/60">
                <input
                  type="checkbox"
                  checked={formData.fingerprintQuestionnaire}
                  onChange={(e) => setFormData(prev => ({ ...prev, fingerprintQuestionnaire: e.target.checked }))}
                  required
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium leading-6 text-slate-700">
                  I have reviewed the Fingerprint Questionnaire with the student <RequiredMark />
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50/60">
                <input
                  type="checkbox"
                  checked={formData.documentsVerified}
                  onChange={(e) => setFormData(prev => ({ ...prev, documentsVerified: e.target.checked }))}
                  required
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium leading-6 text-slate-700">
                  I have verified the student's personal documents in person <RequiredMark />
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50/60">
                <input
                  type="checkbox"
                  checked={formData.attendanceVerified}
                  onChange={(e) => setFormData(prev => ({ ...prev, attendanceVerified: e.target.checked }))}
                  required
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium leading-6 text-slate-700">
                  I have reviewed and confirmed the student's regular attendance <RequiredMark />
                </span>
              </label>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
              <FieldShell
                label="Would you like to pay for fingerprints?"
                required
                hint="Please indicate your preference for fingerprint payment. This information will be used to process the application."
              >
                <select
                  name="fingerprintPaymentPreference"
                  value={formData.fingerprintPaymentPreference}
                  onChange={handleChange}
                  required
                  className={selectClassName}
                >
                  <option value="pending">Select an option</option>
                  <option value="yes">Yes, I am willing to pay</option>
                  <option value="no">No, I am not willing to pay</option>
                </select>
              </FieldShell>
            </div>
          </section>

          <div className="sticky bottom-4 z-10 rounded-[2rem] border border-slate-200 bg-white/90 p-4 shadow-2xl shadow-slate-950/10 backdrop-blur">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  <LockKeyhole className="h-5 w-5" />
                </div>
                <span>Review all required fields before submitting.</span>
              </div>
              <button
                type="submit"
                disabled={isSubmitting || isCheckingDuplicate}
                className={`inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                  (isSubmitting || isCheckingDuplicate) ? 'cursor-not-allowed opacity-60' : ''
                }`}
              >
                <Send className="h-4 w-4" />
                {isCheckingDuplicate ? 'Checking for duplicates...' : isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mt-8 animate-pulse space-y-6">
          <div className="h-40 rounded-[2rem] bg-slate-200" />
          <div className="h-80 rounded-[2rem] bg-slate-200" />
        </div>
      )}
    </div>
  );
} 