import { JSX } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { MOCK_TEST_RESULTS } from '@/lib/mock-data';
import { getVitaminDStatus, getVitaminDStatusInfo, VITAMIN_D_UNIT } from '@/lib/vitamin-d';

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TestsPage(): JSX.Element {
  const sorted = [...MOCK_TEST_RESULTS].sort(
    (a, b) => b.testedAt.getTime() - a.testedAt.getTime(),
  );

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-base-content">Test Results</h1>
      <div className="flex flex-col gap-3">
        {sorted.map((result) => {
          const value = parseFloat(result.value);
          const status = getVitaminDStatus(value);
          const { label, badgeClass } = getVitaminDStatusInfo(status);

          return (
            <Link key={result.id} href={`/tests/${result.id}`}>
              <div className="card card-border bg-base-100 shadow-sm">
                <div className="card-body flex-row items-center gap-4 py-4">
                  <span className="text-3xl">🧪</span>
                  <div className="flex flex-1 flex-col">
                    <span className="font-medium text-base-content">Vitamin D</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-base-content/70">
                        {result.value} {VITAMIN_D_UNIT}
                      </span>
                      <span className={`badge badge-sm ${badgeClass}`}>{label}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-base-content/50">
                    <span className="text-sm">{formatDate(result.testedAt)}</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
