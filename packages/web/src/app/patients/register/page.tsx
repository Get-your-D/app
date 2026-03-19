'use client';

import { BulkUpload } from './_components/bulk-upload';
import { ManualForm } from './_components/manual-form';
import { useQuery } from '@tanstack/react-query';

async function fetchPatients() {
    const res = await fetch('/api/patients');
    if (!res.ok) throw new Error('Failed to load patients');
    return res.json();
}

export default function PatientRegistrationPage() {
    const { data: patients = [] } = useQuery({ queryKey: ['patients'], queryFn: fetchPatients });

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)]">
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Patient Intake</p>
                        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-gray-950">Register Patients</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
                            Support front-desk workflows with fast manual entry and robust bulk CSV upload, including
                            duplicate detection, row-level validation, and import summaries.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-white/70 bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
                        <div className="text-xs uppercase tracking-wide text-gray-500">Patients in current session</div>
                        <div className="mt-1 text-3xl font-semibold text-gray-950">{patients.length}</div>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
                    <section className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="h-9 w-1 rounded-full bg-blue-600" />
                            <div>
                                <h2 className="text-xl font-semibold text-gray-950">Manual Entry</h2>
                                <p className="text-sm text-gray-500">Register a single patient with required and optional details.</p>
                            </div>
                        </div>
                        <ManualForm />
                    </section>

                    <aside className="space-y-6">
                        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
                            <h2 className="text-xl font-semibold text-gray-950">Workflow Options</h2>
                            <ul className="mt-4 space-y-3 text-sm text-gray-600">
                                <li className="rounded-xl bg-gray-50 px-4 py-3">Use manual entry for one-off registrations and quick walk-ins.</li>
                                <li className="rounded-xl bg-gray-50 px-4 py-3">Use CSV upload for imports from scheduling, CRM, or intake exports.</li>
                                <li className="rounded-xl bg-gray-50 px-4 py-3">Review validation preview before importing to avoid preventable data issues.</li>
                            </ul>
                        </section>

                        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="h-9 w-1 rounded-full bg-emerald-600" />
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-950">Bulk CSV Upload</h2>
                                    <p className="text-sm text-gray-500">Upload multiple registrations with validation and duplicate handling.</p>
                                </div>
                            </div>
                            <BulkUpload />
                        </section>
                    </aside>
                </div>
            </div>
        </div>
    );
}
