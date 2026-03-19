'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

// ── Zod schema ────────────────────────────────────────────────────────────────
const schema = z.object({
    firstName: z.string().min(1, 'First name is required').max(50, 'Max 50 characters'),
    lastName: z.string().min(1, 'Last name is required').max(50, 'Max 50 characters'),
    email: z.string().email('Invalid email address'),
    phone: z
        .string()
        .min(1, 'Phone number is required')
        .regex(/^\+?[\d\s\-().]{7,20}$/, 'Invalid phone number (7–20 digits, may include +, -, spaces)'),
    dateOfBirth: z.string().optional(),
    patientId: z.string().optional(),
    notes: z.string().max(1000, 'Max 1000 characters').optional(),
});

type FormData = z.infer<typeof schema>;
type FieldErrors = Partial<Record<keyof FormData, string>>;

const EMPTY: FormData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    patientId: '',
    notes: '',
};

async function registerPatient(data: FormData) {
    const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw json;
    return json;
}

// ── Tiny shared UI helpers ────────────────────────────────────────────────────
function Field({
    label,
    id,
    required,
    error,
    children,
}: {
    label: string;
    id: string;
    required?: boolean;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1">
            <label htmlFor={id} className="text-sm font-medium text-gray-700">
                {label}
                {required && <span className="ml-0.5 text-red-500">*</span>}
            </label>
            {children}
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
}

const inputCls = (err?: string) =>
    `w-full rounded-md border px-3 py-2 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-blue-500 ${err ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
    }`;

// ── Component ─────────────────────────────────────────────────────────────────
export function ManualForm() {
    const qc = useQueryClient();
    const [form, setForm] = useState<FormData>(EMPTY);
    const [errors, setErrors] = useState<FieldErrors>({});
    const [addedPatient, setAddedPatient] = useState<(FormData & { id: string }) | null>(null);

    const mutation = useMutation({
        mutationFn: registerPatient,
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ['patients'] });
            setAddedPatient(data);
        },
        onError: (err: { error?: string; message?: string }) => {
            if (err.error === 'duplicate_email') setErrors((p) => ({ ...p, email: err.message }));
            else if (err.error === 'duplicate_phone') setErrors((p) => ({ ...p, phone: err.message }));
            else setErrors((p) => ({ ...p, email: err.message ?? 'Registration failed' }));
        },
    });

    function touch(name: keyof FormData, value: string) {
        setForm((p) => ({ ...p, [name]: value }));
        if (errors[name]) setErrors((p) => ({ ...p, [name]: undefined }));
    }

    function validate() {
        const r = schema.safeParse(form);
        if (r.success) { setErrors({}); return true; }
        const fe: FieldErrors = {};
        for (const e of r.error.errors) {
            const f = e.path[0] as keyof FormData;
            if (!fe[f]) fe[f] = e.message;
        }
        setErrors(fe);
        return false;
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (validate()) mutation.mutate(form);
    }

    function reset() {
        setForm(EMPTY); setErrors({}); setAddedPatient(null); mutation.reset();
    }

    // ── Success state ────────────────────────────────────────────────────────
    if (addedPatient) {
        return (
            <div className="flex flex-col items-center gap-6 py-10 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-gray-900">Patient Registered</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {addedPatient.firstName} {addedPatient.lastName} has been successfully registered.
                    </p>
                </div>
                <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-gray-50 p-4 text-left text-sm">
                    <dl className="space-y-1">
                        {[
                            ['Patient ID', (addedPatient as any).id],
                            ['Email', addedPatient.email],
                            ['Phone', addedPatient.phone],
                            ...(addedPatient.dateOfBirth ? [['Date of Birth', addedPatient.dateOfBirth]] : []),
                        ].map(([k, v]) => (
                            <div key={k} className="flex gap-2">
                                <dt className="w-28 shrink-0 font-medium text-gray-600">{k}:</dt>
                                <dd className="text-gray-900">{v}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={reset}
                        className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        + Add Another Patient
                    </button>
                    <a
                        href="/patients"
                        className="rounded-md border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        View All Patients
                    </a>
                </div>
            </div>
        );
    }

    // ── Form ──────────────────────────────────────────────────────────────────
    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* API-level error banner */}
            {mutation.isError && !errors.email && !errors.phone && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    Registration failed. Please try again.
                </div>
            )}

            {/* Required fields */}
            <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Required Information
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="First Name" id="firstName" required error={errors.firstName}>
                        <input
                            id="firstName" name="firstName" autoComplete="given-name"
                            value={form.firstName} onChange={(e) => touch('firstName', e.target.value)}
                            className={inputCls(errors.firstName)} placeholder="e.g. Anna"
                        />
                    </Field>
                    <Field label="Last Name" id="lastName" required error={errors.lastName}>
                        <input
                            id="lastName" name="lastName" autoComplete="family-name"
                            value={form.lastName} onChange={(e) => touch('lastName', e.target.value)}
                            className={inputCls(errors.lastName)} placeholder="e.g. Müller"
                        />
                    </Field>
                    <Field label="Email Address" id="email" required error={errors.email}>
                        <input
                            id="email" name="email" type="email" autoComplete="email"
                            value={form.email} onChange={(e) => touch('email', e.target.value)}
                            className={inputCls(errors.email)} placeholder="patient@example.com"
                        />
                    </Field>
                    <Field label="Phone Number" id="phone" required error={errors.phone}>
                        <input
                            id="phone" name="phone" type="tel" autoComplete="tel"
                            value={form.phone} onChange={(e) => touch('phone', e.target.value)}
                            className={inputCls(errors.phone)} placeholder="+49 151 234 56789"
                        />
                    </Field>
                </div>
            </div>

            {/* Optional fields */}
            <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Optional Information
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Date of Birth" id="dateOfBirth" error={errors.dateOfBirth}>
                        <input
                            id="dateOfBirth" name="dateOfBirth" type="date"
                            value={form.dateOfBirth} onChange={(e) => touch('dateOfBirth', e.target.value)}
                            className={inputCls(errors.dateOfBirth)}
                        />
                    </Field>
                    <Field label="Patient ID / Medical Record Number" id="patientId" error={errors.patientId}>
                        <input
                            id="patientId" name="patientId"
                            value={form.patientId} onChange={(e) => touch('patientId', e.target.value)}
                            className={inputCls(errors.patientId)} placeholder="Leave blank to auto-generate"
                        />
                    </Field>
                </div>
                <div className="mt-4">
                    <Field label="Notes / Additional Information" id="notes" error={errors.notes}>
                        <textarea
                            id="notes" name="notes" rows={3}
                            value={form.notes} onChange={(e) => touch('notes', e.target.value)}
                            className={`${inputCls(errors.notes)} resize-none`}
                            placeholder="Allergies, current medications, special accommodations…"
                        />
                        <p className="mt-1 text-right text-xs text-gray-400">{form.notes?.length ?? 0}/1000</p>
                    </Field>
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                    type="button" onClick={() => setForm(EMPTY)}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Clear
                </button>
                <button
                    type="submit" disabled={mutation.isPending}
                    className="flex items-center gap-2 rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                    {mutation.isPending && (
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                    )}
                    Register Patient
                </button>
            </div>
        </form>
    );
}
