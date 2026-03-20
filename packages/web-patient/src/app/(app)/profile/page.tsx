'use client';

import { JSX, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sun, Moon } from 'lucide-react';
import { logout } from '@/lib/auth';
import { MOCK_CONSENTS, ConsentRequest, ConsentStatus } from '@/lib/mock-data';

const STATUS_ORDER: Record<ConsentStatus, number> = {
  PENDING: 0,
  ACTIVE: 1,
  DECLINED: 2,
  REVOKED: 3,
};

const BADGE_CLASS: Record<ConsentStatus, string> = {
  PENDING: 'badge-warning',
  ACTIVE: 'badge-success',
  DECLINED: 'badge-error',
  REVOKED: 'badge-neutral',
};

const TEST_TYPE_LABEL: Record<string, string> = { VITAMIN_D: 'Vitamin D' };

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface ConsentCardProps {
  consent: ConsentRequest;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onRevoke: (id: string) => void;
}

function ConsentCard({ consent, onAccept, onDecline, onRevoke }: ConsentCardProps): JSX.Element {
  return (
    <div className="card card-border bg-base-100 shadow-sm">
      <div className="card-body gap-2 p-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-base-content">{consent.clinicName}</span>
          <span className={`badge badge-sm ${BADGE_CLASS[consent.status]}`}>
            {consent.status.charAt(0) + consent.status.slice(1).toLowerCase()}
          </span>
        </div>
        <p className="text-sm text-base-content/70">
          {TEST_TYPE_LABEL[consent.testType]} · Requested {formatDate(consent.requestedAt)}
        </p>
        {consent.status === 'PENDING' && (
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="btn btn-sm btn-error btn-outline"
              onClick={() => onDecline(consent.id)}
            >
              Decline
            </button>
            <button
              type="button"
              className="btn btn-sm btn-success"
              onClick={() => onAccept(consent.id)}
            >
              Accept
            </button>
          </div>
        )}
        {consent.status === 'ACTIVE' && (
          <div className="flex justify-end pt-1">
            <button
              type="button"
              className="btn btn-sm btn-warning btn-outline"
              onClick={() => onRevoke(consent.id)}
            >
              Revoke
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage(): JSX.Element {
  const router = useRouter();
  const [tab, setTab] = useState<'profile' | 'consent'>('profile');
  const [consents, setConsents] = useState<ConsentRequest[]>(MOCK_CONSENTS);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    return (localStorage.getItem('theme') as 'light' | 'dark') ?? 'light';
  });

  function toggleTheme(): void {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  }

  function handleLogout(): void {
    logout();
    router.push('/onboarding');
  }

  function accept(id: string): void {
    setConsents(prev =>
      prev.map(c => c.id === id ? { ...c, status: 'ACTIVE', respondedAt: new Date() } : c)
    );
  }

  function decline(id: string): void {
    setConsents(prev =>
      prev.map(c => c.id === id ? { ...c, status: 'DECLINED', respondedAt: new Date() } : c)
    );
  }

  function revoke(id: string): void {
    setConsents(prev =>
      prev.map(c => c.id === id ? { ...c, status: 'REVOKED' } : c)
    );
  }

  const sortedConsents = [...consents].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-base-content">Profile</h1>
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-circle"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>

      <div className="flex flex-col items-center gap-4 py-6">
        <div className="avatar avatar-placeholder">
          <div className="bg-primary text-primary-content w-20 rounded-full">
            <span className="text-3xl">P</span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-base-content">Patient Name</p>
          <p className="text-sm text-base-content/70">patient@example.com</p>
        </div>
      </div>

      <div role="tablist" className="tabs tabs-border mb-6">
        <button
          role="tab"
          className={`tab${tab === 'profile' ? ' tab-active' : ''}`}
          onClick={() => setTab('profile')}
        >
          Profile
        </button>
        <button
          role="tab"
          className={`tab${tab === 'consent' ? ' tab-active' : ''}`}
          onClick={() => setTab('consent')}
        >
          Consent
        </button>
      </div>

      {tab === 'profile' && (
        <div>
          <h2 className="mb-3 text-base font-semibold text-base-content">Personal Information</h2>
          <div className="card card-border bg-base-100">
            <div className="card-body gap-0 p-0">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-base-content/70">Name</span>
                <span className="font-medium text-base-content">Patient Name</span>
              </div>
              <div className="divider my-0" />
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-base-content/70">Email</span>
                <span className="font-medium text-base-content">patient@example.com</span>
              </div>
              <div className="divider my-0" />
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-base-content/70">Date of birth</span>
                <span className="font-medium text-base-content">Jan 1, 1990</span>
              </div>
            </div>
          </div>
          <div className="divider" />
          <button type="button" className="btn btn-error btn-outline btn-block" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      )}

      {tab === 'consent' && (
        <div>
          <h2 className="mb-1 text-base font-semibold text-base-content">Data Access Consents</h2>
          <p className="mb-4 text-sm text-base-content/70">Clinics that have requested access to your test results</p>
          {sortedConsents.length === 0 ? (
            <p className="text-center text-base-content/70 py-8">No consent requests yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedConsents.map(consent => (
                <ConsentCard
                  key={consent.id}
                  consent={consent}
                  onAccept={accept}
                  onDecline={decline}
                  onRevoke={revoke}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
