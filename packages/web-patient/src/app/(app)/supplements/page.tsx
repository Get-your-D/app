import { JSX } from 'react';
import { MOCK_TEST_RESULTS } from '@/lib/mock-data';
import {
  getVitaminDStatus,
  getVitaminDStatusInfo,
  getVitaminDDosage,
  VITAMIN_D_UNIT,
} from '@/lib/vitamin-d';

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const EMPTY_CATEGORIES = [
  { emoji: '🌿', label: 'Minerals' },
  { emoji: '🐟', label: 'Omega-3' },
  { emoji: '🍄', label: 'Adaptogens' },
];

export default function SupplementsPage(): JSX.Element {
  const latest = [...MOCK_TEST_RESULTS].sort(
    (a, b) => b.testedAt.getTime() - a.testedAt.getTime(),
  )[0];

  const value = parseFloat(latest.value);
  const status = getVitaminDStatus(value);
  const { label, badgeClass } = getVitaminDStatusInfo(status);
  const { amountIU, timelineInDays, note } = getVitaminDDosage(value);

  return (
    <div className="p-6">
      <h1 className="mb-1 text-2xl font-bold text-base-content">Supplements</h1>
      <p className="mb-6 text-sm text-base-content/60">Based on your latest test results</p>

      {/* Vitamin D dosage card */}
      <div className="card card-border bg-base-100 shadow-sm mb-4">
        <div className="card-body">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-base-content">🧪 Vitamin D</span>
            <span className={`badge ${badgeClass}`}>{label}</span>
          </div>
          <p className="text-xs text-base-content/50 mb-4">
            Based on {formatDate(latest.testedAt)} result: {latest.value} {VITAMIN_D_UNIT}
          </p>

          <div className="stats stats-horizontal bg-base-200 rounded-box w-full">
            <div className="stat place-items-center py-3">
              <div className="stat-title text-xs">Daily Dose</div>
              <div className="stat-value text-2xl">
                {amountIU > 0 ? amountIU.toLocaleString() : '—'}
              </div>
              <div className="stat-desc">IU per day</div>
            </div>
            <div className="stat place-items-center py-3">
              <div className="stat-title text-xs">Duration</div>
              <div className="stat-value text-2xl">
                {timelineInDays > 0 ? timelineInDays : '—'}
              </div>
              <div className="stat-desc">days</div>
            </div>
          </div>

          <div className="divider my-2" />

          <p className="text-sm text-base-content/70">{note}</p>
        </div>
      </div>

      {/* Empty state cards for other categories */}
      {EMPTY_CATEGORIES.map(({ emoji, label: catLabel }) => (
        <div key={catLabel} className="card card-border bg-base-100 shadow-sm mb-3">
          <div className="card-body flex-row items-center gap-3 py-4">
            <span className="text-2xl">{emoji}</span>
            <div>
              <p className="font-medium text-base-content">{catLabel}</p>
              <p className="text-xs text-base-content/50">No dosage data yet</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
