import { JSX } from 'react';

export default function HomePage(): JSX.Element {
  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-base-content">Good morning 👋</h1>
      <div className="flex flex-col gap-4">
        <div className="card card-border bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-base">Latest Results</h2>
            <p className="text-sm text-base-content/60">No recent test results to display.</p>
          </div>
        </div>
        <div className="card card-border bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-base">Active Consents</h2>
            <p className="text-sm text-base-content/60">You have no active consents.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
