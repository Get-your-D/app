'use client';

import { useMemo, useState } from 'react';
import Papa from 'papaparse';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { z } from 'zod';

const rowSchema = z.object({
    firstName: z.string().min(1, 'Missing first name'),
    lastName: z.string().min(1, 'Missing last name'),
    email: z.string().email('Invalid email'),
    phone: z
        .string()
        .min(1, 'Missing phone')
        .regex(/^\+?[\d\s\-().]{7,20}$/, 'Invalid phone'),
    dateOfBirth: z.string().optional(),
    patientId: z.string().optional(),
    notes: z.string().optional(),
});

type PatientCsvRow = z.infer<typeof rowSchema> & {
    rowNumber: number;
    errors: string[];
    duplicateKey?: 'email' | 'phone' | null;
    duplicateSource?: 'existing' | 'file' | null;
};

type BulkResponse = {
    added: Array<{ id: string; email: string; phone: string }>;
    updated: Array<{ id: string; email: string; phone: string }>;
    skipped: Array<{ row: number; reason: string }>;
    failed: Array<{ row: number; reason: string }>;
};

const REQUIRED_HEADERS = ['name', 'email', 'phone'];
const TEMPLATE_CSV = `Name,Email,Phone,DOB,Patient ID,Notes\nAnna Müller,anna@example.com,+49 151 12345678,1989-04-10,PAT-001,Requires interpreter\nMax Weber,max@example.com,+49 171 5554433,1975-12-01,PAT-002,Allergic to penicillin\n`;

type ExistingPatient = { id: string; email: string; phone: string };

async function fetchPatients() {
    const res = await fetch('/api/patients');
    if (!res.ok) throw new Error('Failed to load patients');
    return res.json() as Promise<ExistingPatient[]>;
}

function splitName(name: string) {
    const cleaned = name.trim().replace(/\s+/g, ' ');
    if (!cleaned) return { firstName: '', lastName: '' };
    const parts = cleaned.split(' ');
    if (parts.length === 1) return { firstName: cleaned, lastName: '' };
    return {
        firstName: parts.slice(0, -1).join(' '),
        lastName: parts.at(-1) ?? '',
    };
}

function normalizeKey(value: string) {
    return value.trim().toLowerCase();
}

function detectDelimiter(text: string) {
    const candidates = [',', ';', '\t'];
    const lines = text.split(/\r?\n/).filter(Boolean).slice(0, 5);
    let best = ',';
    let bestScore = -1;
    for (const candidate of candidates) {
        const score = lines.reduce((sum, line) => sum + line.split(candidate).length, 0);
        if (score > bestScore) {
            best = candidate;
            bestScore = score;
        }
    }
    return best;
}

async function submitBulk(payload: { rows: PatientCsvRow[]; skipInvalid: boolean; duplicateMode: 'skip' | 'update' }) {
    const res = await fetch('/api/patients/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            patients: payload.rows.map(({ errors, rowNumber, duplicateKey, duplicateSource, ...row }) => row),
            skipInvalid: payload.skipInvalid,
            duplicateMode: payload.duplicateMode,
        }),
    });
    const json = await res.json();
    if (!res.ok) throw json;
    return json as BulkResponse;
}

export function BulkUpload() {
    const qc = useQueryClient();
    const { data: existingPatients = [] } = useQuery({ queryKey: ['patients'], queryFn: fetchPatients });
    const [rows, setRows] = useState<PatientCsvRow[]>([]);
    const [parseError, setParseError] = useState<string | null>(null);
    const [skipInvalid, setSkipInvalid] = useState(true);
    const [duplicateMode, setDuplicateMode] = useState<'skip' | 'update'>('skip');
    const [serverSummary, setServerSummary] = useState<BulkResponse | null>(null);

    const validRows = rows.filter((r) => r.errors.length === 0 && (!r.duplicateKey || duplicateMode === 'update'));
    const invalidRows = rows.filter((r) => r.errors.length > 0);
    const duplicateRows = rows.filter((r) => !!r.duplicateKey);

    const mutation = useMutation({
        mutationFn: submitBulk,
        onSuccess: (data) => {
            setServerSummary(data);
            qc.invalidateQueries({ queryKey: ['patients'] });
        },
    });

    function reset() {
        setRows([]);
        setParseError(null);
        setServerSummary(null);
        mutation.reset();
    }

    function downloadTemplate() {
        const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'patient-upload-template.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    function onFile(file: File) {
        setParseError(null);
        setServerSummary(null);
        file.text().then((text) => {
            const delimiter = detectDelimiter(text);
            Papa.parse<Record<string, string>>(text, {
                header: true,
                skipEmptyLines: true,
                delimiter,
                transformHeader: (header) => header.trim(),
                complete: ({ data, meta, errors }) => {
                    if (errors.length > 0) {
                        setParseError(errors.map((e) => e.message).join(', '));
                        return;
                    }

                    const normalizedHeaders = meta.fields?.map((f) => normalizeKey(f)) ?? [];
                    const missing = REQUIRED_HEADERS.filter((h) => !normalizedHeaders.includes(h));
                    if (missing.length > 0) {
                        setParseError(`Missing required headers: ${missing.join(', ')}`);
                        return;
                    }

                    const seenEmails = new Set<string>();
                    const seenPhones = new Set<string>();
                    const existingEmails = new Set(existingPatients.map((p) => p.email.toLowerCase()));
                    const existingPhones = new Set(existingPatients.map((p) => p.phone.trim()));
                    const nextRows = data.map((record, index) => {
                        const map = Object.fromEntries(
                            Object.entries(record).map(([key, value]) => [normalizeKey(key), (value ?? '').trim()]),
                        );
                        const { firstName, lastName } = splitName(map.name ?? '');
                        const candidate = {
                            firstName,
                            lastName,
                            email: map.email ?? '',
                            phone: map.phone ?? '',
                            dateOfBirth: map.dob ?? '',
                            patientId: map['patient id'] ?? '',
                            notes: map.notes ?? '',
                        };
                        const parsed = rowSchema.safeParse(candidate);
                        const emailLower = candidate.email.toLowerCase();
                        const phoneNorm = candidate.phone;
                        let duplicateKey: 'email' | 'phone' | null = null;
                        let duplicateSource: 'existing' | 'file' | null = null;
                        if (existingEmails.has(emailLower)) {
                            duplicateKey = 'email';
                            duplicateSource = 'existing';
                        } else if (existingPhones.has(phoneNorm)) {
                            duplicateKey = 'phone';
                            duplicateSource = 'existing';
                        } else if (seenEmails.has(emailLower)) {
                            duplicateKey = 'email';
                            duplicateSource = 'file';
                        } else if (seenPhones.has(phoneNorm)) {
                            duplicateKey = 'phone';
                            duplicateSource = 'file';
                        }
                        seenEmails.add(emailLower);
                        seenPhones.add(phoneNorm);

                        return {
                            ...candidate,
                            rowNumber: index + 1,
                            errors: parsed.success ? [] : parsed.error.errors.map((e) => e.message),
                            duplicateKey,
                            duplicateSource,
                        } satisfies PatientCsvRow;
                    });

                    setRows(nextRows);
                },
                error: (error: Error) => {
                    setParseError(error.message);
                },
            });
        });
    }

    const columns = useMemo<ColumnDef<PatientCsvRow>[]>(
        () => [
            { accessorKey: 'rowNumber', header: 'Row' },
            {
                accessorFn: (row) => `${row.firstName} ${row.lastName}`.trim(),
                id: 'name',
                header: 'Name',
            },
            { accessorKey: 'email', header: 'Email' },
            { accessorKey: 'phone', header: 'Phone' },
            {
                id: 'status',
                header: 'Validation Status',
                cell: ({ row }) => {
                    const original = row.original;
                    if (original.duplicateKey) {
                        return <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">{original.duplicateSource === 'existing' ? 'Existing' : 'File'} duplicate {original.duplicateKey}</span>;
                    }
                    if (original.errors.length > 0) {
                        return <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">Invalid</span>;
                    }
                    return <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">Ready</span>;
                },
            },
            {
                id: 'issues',
                header: 'Issues',
                cell: ({ row }) => {
                    const original = row.original;
                    const issues = [...original.errors];
                    if (original.duplicateKey) issues.push(`${original.duplicateSource === 'existing' ? 'Existing record' : 'Duplicate row'} by ${original.duplicateKey}`);
                    return issues.length ? <div className="text-xs text-red-600">{issues.join('; ')}</div> : <span className="text-xs text-gray-400">None</span>;
                },
            },
        ],
        [],
    );

    const table = useReactTable({
        data: rows,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    function handleUpload() {
        const payloadRows = skipInvalid ? validRows : rows.filter((r) => (!r.duplicateKey || duplicateMode === 'update'));
        mutation.mutate({ rows: payloadRows, skipInvalid, duplicateMode });
    }

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Bulk CSV Upload</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Required headers: <span className="font-medium">Name, Email, Phone</span>. Optional: DOB, Patient ID, Notes.
                        </p>
                        <p className="mt-1 text-xs text-gray-400">Delimiters supported: comma, semicolon, tab.</p>
                    </div>
                    <button
                        type="button"
                        onClick={downloadTemplate}
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
                    >
                        Download Template
                    </button>
                </div>

                <div className="mt-5 flex flex-col gap-4 rounded-lg border border-dashed border-blue-300 bg-white p-5">
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-6 py-8 text-center hover:border-blue-400 hover:bg-blue-50/40">
                        <input
                            type="file"
                            accept=".csv,text/csv,.txt"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) onFile(file);
                            }}
                        />
                        <div className="text-sm font-medium text-gray-900">Choose CSV file</div>
                        <div className="text-xs text-gray-500">Upload one file to preview and validate before importing.</div>
                    </label>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm">
                            <input type="checkbox" checked={skipInvalid} onChange={(e) => setSkipInvalid(e.target.checked)} />
                            Skip invalid rows and upload valid ones
                        </label>
                        <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm">
                            <div className="mb-2 font-medium text-gray-700">Duplicate handling</div>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="duplicateMode"
                                        checked={duplicateMode === 'skip'}
                                        onChange={() => setDuplicateMode('skip')}
                                    />
                                    Skip duplicates
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="duplicateMode"
                                        checked={duplicateMode === 'update'}
                                        onChange={() => setDuplicateMode('update')}
                                    />
                                    Update duplicates
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {parseError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{parseError}</div>
            )}

            {rows.length > 0 && (
                <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <div className="text-sm text-gray-500">Rows Parsed</div>
                            <div className="mt-1 text-2xl font-semibold text-gray-900">{rows.length}</div>
                        </div>
                        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                            <div className="text-sm text-green-700">Ready to Upload</div>
                            <div className="mt-1 text-2xl font-semibold text-green-900">{validRows.length}</div>
                        </div>
                        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                            <div className="text-sm text-red-700">Invalid Rows</div>
                            <div className="mt-1 text-2xl font-semibold text-red-900">{invalidRows.length}</div>
                        </div>
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                            <div className="text-sm text-amber-700">Duplicates</div>
                            <div className="mt-1 text-2xl font-semibold text-amber-900">{duplicateRows.length}</div>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-200 px-5 py-4">
                            <h3 className="text-base font-semibold text-gray-900">Pre-upload Validation Preview</h3>
                            <p className="mt-1 text-sm text-gray-500">Review each row before importing. Invalid rows show detailed error messages.</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    {table.getHeaderGroups().map((hg) => (
                                        <tr key={hg.id}>
                                            {hg.headers.map((header) => (
                                                <th key={header.id} className="px-4 py-3 text-left font-medium text-gray-600">
                                                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                                </th>
                                            ))}
                                        </tr>
                                    ))}
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {table.getRowModel().rows.map((row) => (
                                        <tr key={row.id} className={row.original.errors.length || row.original.duplicateKey ? 'bg-red-50/30' : ''}>
                                            {row.getVisibleCells().map((cell) => (
                                                <td key={cell.id} className="px-4 py-3 align-top text-gray-800">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={reset}
                            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Reset
                        </button>
                        <button
                            type="button"
                            onClick={handleUpload}
                            disabled={mutation.isPending || (!skipInvalid && invalidRows.length > 0)}
                            className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                            {mutation.isPending ? 'Uploading…' : 'Import Patients'}
                        </button>
                    </div>
                </>
            )}

            {serverSummary && (
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900">Import Summary</h3>
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
                        <div className="rounded-lg bg-green-50 p-4">
                            <div className="text-sm text-green-700">Patients Added</div>
                            <div className="mt-1 text-2xl font-semibold text-green-900">{serverSummary.added.length}</div>
                        </div>
                        <div className="rounded-lg bg-amber-50 p-4">
                            <div className="text-sm text-amber-700">Skipped</div>
                            <div className="mt-1 text-2xl font-semibold text-amber-900">{serverSummary.skipped.length}</div>
                        </div>
                        <div className="rounded-lg bg-blue-50 p-4">
                            <div className="text-sm text-blue-700">Updated</div>
                            <div className="mt-1 text-2xl font-semibold text-blue-900">{serverSummary.updated.length}</div>
                        </div>
                        <div className="rounded-lg bg-red-50 p-4">
                            <div className="text-sm text-red-700">Failed</div>
                            <div className="mt-1 text-2xl font-semibold text-red-900">{serverSummary.failed.length}</div>
                        </div>
                    </div>

                    {(serverSummary.skipped.length > 0 || serverSummary.failed.length > 0) && (
                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                            {serverSummary.skipped.length > 0 && (
                                <div>
                                    <h4 className="mb-2 text-sm font-semibold text-gray-900">Skipped Rows</h4>
                                    <ul className="space-y-1 text-sm text-amber-800">
                                        {serverSummary.skipped.map((item) => (
                                            <li key={`skip-${item.row}`}>Row {item.row}: {item.reason}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {serverSummary.failed.length > 0 && (
                                <div>
                                    <h4 className="mb-2 text-sm font-semibold text-gray-900">Failed Rows</h4>
                                    <ul className="space-y-1 text-sm text-red-700">
                                        {serverSummary.failed.map((item) => (
                                            <li key={`fail-${item.row}`}>Row {item.row}: {item.reason}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
