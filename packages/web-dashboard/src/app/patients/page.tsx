import { JSX } from 'react';
import { PatientsTable } from '../../components/patients/patients-table';

// TODO: Wire this up to a real API backed by Prisma / ts-rest.
// For now we use a typed placeholder dataset based on the Patient + TestResult schema.

export interface PatientRow {
  id: string;
  name: string;
  email: string;
  lastTestDate: string | null;
  compliancePercent: number | null;
  retestDueDate: string | null;
  retestRelativeLabel: string | null;
  status: 'Active' | 'Inactive' | 'Overdue' | 'PendingFirstTest';
}

function getPatients(): PatientRow[] {
  // Placeholder data; replace with a call to your API route once implemented.
  return [
    {
      id: '1',
      name: 'Alice Example',
      email: 'alice@example.com',
      lastTestDate: '2026-03-01',
      compliancePercent: 92,
      retestDueDate: '2026-09-01',
      retestRelativeLabel: 'In 169 days',
      status: 'Active',
    },
    {
      id: '2',
      name: 'Bob Sample',
      email: 'bob@example.com',
      lastTestDate: null,
      compliancePercent: null,
      retestDueDate: '2026-03-10',
      retestRelativeLabel: 'Overdue by 6 days',
      status: 'PendingFirstTest',
    },
  ];
}

export default function PatientsPage(): JSX.Element {
  const patients = getPatients();

  return (
    <div data-theme="solarGoldDashboard" className="flex min-h-screen flex-col bg-base-200 text-base-content">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <header className="card border border-base-300 bg-base-100 shadow-md">
          <div className="card-body flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
              Patients
              </h1>
              <p className="mt-1 text-sm text-base-content/70">
                Monitor vitamin D testing compliance and upcoming re-tests.
              </p>
            </div>
          </div>
        </header>

        <div className="card border border-base-300 bg-base-100 shadow-md">
          <div className="card-body p-4 sm:p-5">
          <PatientsTable data={patients} />
          </div>
        </div>
      </main>
    </div>
  );
}

