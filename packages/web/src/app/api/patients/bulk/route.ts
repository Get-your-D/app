import { NextRequest, NextResponse } from 'next/server';
import type { PatientRecord } from '../route';

// Use a separate but coordinated store via a globalThis key so both routes
// share state without a shared import (Next.js may tree-shake re-exports).
declare global {
    // eslint-disable-next-line no-var
    var __patientStore: PatientRecord[] | undefined;
}

if (!globalThis.__patientStore) {
    globalThis.__patientStore = [];
}
const store = globalThis.__patientStore;

export type BulkPatient = Omit<PatientRecord, 'id' | 'createdAt'>;

type BulkRequest = {
    patients: BulkPatient[];
    duplicateMode?: 'skip' | 'update';
    skipInvalid?: boolean;
};

type BulkResult = {
    added: PatientRecord[];
    updated: PatientRecord[];
    skipped: Array<{ row: number; reason: string; patient: BulkPatient }>;
    failed: Array<{ row: number; reason: string; patient: BulkPatient }>;
};

function generateId() {
    return `PAT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function POST(req: NextRequest) {
    const { patients, duplicateMode = 'skip' }: BulkRequest = await req.json();

    const result: BulkResult = { added: [], updated: [], skipped: [], failed: [] };

    // Also sync with the single-patient store via globalThis
    // so GET /api/patients reflects bulk-added records
    // (parent route also checks globalThis.__patientStore)
    const seenEmails = new Set(store.map((p) => p.email.toLowerCase()));
    const seenPhones = new Set(store.map((p) => p.phone));

    for (let i = 0; i < patients.length; i++) {
        const p = patients[i];
        const emailLower = p.email?.toLowerCase().trim();
        const phoneNorm = p.phone?.trim();
        const existingIndex = store.findIndex(
            (record) => record.email.toLowerCase() === emailLower || record.phone.trim() === phoneNorm,
        );

        try {
            if (existingIndex >= 0) {
                if (duplicateMode === 'update') {
                    const existing = store[existingIndex];
                    const updated: PatientRecord = {
                        ...existing,
                        firstName: p.firstName.trim(),
                        lastName: p.lastName.trim(),
                        email: emailLower,
                        phone: phoneNorm,
                        ...(p.dateOfBirth ? { dateOfBirth: p.dateOfBirth } : {}),
                        ...(p.patientId?.trim() ? { patientId: p.patientId.trim() } : {}),
                        ...(p.notes !== undefined ? { notes: p.notes.trim() } : {}),
                    };
                    store[existingIndex] = updated;
                    result.updated.push(updated);
                } else {
                    result.skipped.push({ row: i + 1, reason: `Duplicate patient: ${p.email || p.phone}`, patient: p });
                }
                continue;
            }

            if (seenEmails.has(emailLower) || seenPhones.has(phoneNorm)) {
                result.failed.push({ row: i + 1, reason: 'Duplicate row within upload file', patient: p });
                continue;
            }

            const record: PatientRecord = {
                id: generateId(),
                firstName: p.firstName.trim(),
                lastName: p.lastName.trim(),
                email: emailLower,
                phone: phoneNorm,
                ...(p.dateOfBirth ? { dateOfBirth: p.dateOfBirth } : {}),
                patientId: p.patientId?.trim() || generateId(),
                ...(p.notes ? { notes: p.notes.trim() } : {}),
                createdAt: new Date().toISOString(),
            };

            store.push(record);
            seenEmails.add(emailLower);
            seenPhones.add(phoneNorm);
            result.added.push(record);
        } catch {
            result.failed.push({ row: i + 1, reason: 'Unexpected error', patient: p });
        }
    }

    return NextResponse.json(result, { status: 200 });
}

export async function GET() {
    return NextResponse.json(store);
}
