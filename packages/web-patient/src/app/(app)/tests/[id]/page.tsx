'use client';

import { JSX } from 'react';
import Link from 'next/link';
import { useParams, redirect } from 'next/navigation';
import { MOCK_TEST_RESULTS } from '@/lib/mock-data';
import {
  getVitaminDStatus,
  getVitaminDStatusInfo,
  VITAMIN_D_UNIT,
  VITAMIN_D_MAX_DISPLAY,
} from '@/lib/vitamin-d';

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

const STATUS_COLOR: Record<string, string> = {
  DEFICIENT: 'text-error',
  INSUFFICIENT: 'text-warning',
  OPTIMAL: 'text-success',
  HIGH: 'text-warning',
};

const PROGRESS_COLOR: Record<string, string> = {
  DEFICIENT: 'progress-error',
  INSUFFICIENT: 'progress-warning',
  OPTIMAL: 'progress-success',
  HIGH: 'progress-warning',
};

const DOT_COLOR: Record<string, string> = {
  DEFICIENT: 'bg-error',
  INSUFFICIENT: 'bg-warning',
  OPTIMAL: 'bg-success',
  HIGH: 'bg-warning',
};

const REFERENCE_RANGES = [
  { status: 'DEFICIENT' as const, label: 'Deficient', range: '< 20 ng/mL' },
  { status: 'INSUFFICIENT' as const, label: 'Insufficient', range: '20–30 ng/mL' },
  { status: 'OPTIMAL' as const, label: 'Optimal', range: '30–50 ng/mL' },
  { status: 'HIGH' as const, label: 'High', range: '> 50 ng/mL' },
];

export default function TestDetailPage(): JSX.Element {
  const params = useParams();
  const result = MOCK_TEST_RESULTS.find((r) => r.id === params.id);

  if (!result) {
    redirect('/tests');
  }

  const value = parseFloat(result.value);
  const status = getVitaminDStatus(value);
  const { label, badgeClass } = getVitaminDStatusInfo(status);

  const gaugeValue = Math.min(Math.round((value / VITAMIN_D_MAX_DISPLAY) * 100), 100);
  const barValue = Math.min((value / 80) * 100, 100);

  return (
    <div className="p-6">
      <Link href="/tests" className="btn btn-ghost btn-sm mb-6">
        ← Test Results
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-base-content">Vitamin D</h1>

      {/* Radial progress gauge */}
      <div className="mb-6 flex flex-col items-center gap-3">
        <div
          className={`radial-progress ${STATUS_COLOR[status]} text-center font-semibold`}
          style={
            {
              '--value': gaugeValue,
              '--size': '10rem',
              '--thickness': '12px',
            } as React.CSSProperties
          }
          aria-label={`${value} ${VITAMIN_D_UNIT}`}
        >
          <span className="text-base-content text-xl font-bold">{result.value}</span>
          <span className="text-base-content/60 text-xs">{VITAMIN_D_UNIT}</span>
        </div>

        <span className={`badge badge-lg ${badgeClass}`}>{label}</span>
      </div>

      {/* Reference ranges */}
      <div className="card card-border bg-base-100 mb-4">
        <div className="card-body py-4">
          <h2 className="card-title text-base mb-3">Reference Ranges</h2>
          <div className="flex flex-col gap-2">
            {REFERENCE_RANGES.map(({ status: s, label: l, range }) => {
              const isActive = s === status;
              return (
                <div
                  key={s}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 ${isActive ? 'bg-base-200' : ''}`}
                >
                  <span className={`h-3 w-3 rounded-full ${DOT_COLOR[s]}`} />
                  <span className={`flex-1 text-sm ${isActive ? 'font-semibold text-base-content' : 'text-base-content/70'}`}>
                    {l}
                  </span>
                  <span className={`text-sm ${isActive ? 'font-semibold text-base-content' : 'text-base-content/50'}`}>
                    {range}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Range bar */}
      <div className="mb-6">
        <progress
          className={`progress ${PROGRESS_COLOR[status]} w-full`}
          value={barValue}
          max={100}
        />
        <div className="relative mt-1 h-4">
          <span className="absolute left-0 text-xs text-base-content/50">0</span>
          <span className="absolute text-xs text-base-content/50" style={{ left: '25%' }}>20</span>
          <span className="absolute text-xs text-base-content/50" style={{ left: '37.5%' }}>30</span>
          <span className="absolute text-xs text-base-content/50" style={{ left: '62.5%' }}>50</span>
        </div>
      </div>

      {/* Metadata */}
      <div className="mb-6 flex flex-col gap-1 text-sm text-base-content/50">
        <span>Tested on {formatDate(result.testedAt)}</span>
        <span>Ordered by: Mock Clinic</span>
      </div>

      <Link href="/supplements" className="btn btn-outline btn-sm">
        See your supplement dosage
      </Link>
    </div>
  );
}
