import { NextRequest, NextResponse } from 'next/server';

export type PatientRecord = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth?: string;
    patientId?: string;
    notes?: string;
    createdAt: string;
};

// Shared store via globalThis so both single and bulk routes use the same array
declare global {
    // eslint-disable-next-line no-var
    var __patientStore: PatientRecord[] | undefined;
}
if (!globalThis.__patientStore) globalThis.__patientStore = [];
const store = globalThis.__patientStore;

function generateId() {
    return `PAT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function GET() {
    return NextResponse.json(store);
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { firstName, lastName, email, phone, dateOfBirth, patientId, notes } = body as PatientRecord;

    const emailLower = email?.toLowerCase().trim();
    const phoneNorm = phone?.trim();

    if (!firstName || !lastName || !email || !phone) {
        return NextResponse.json({ error: 'validation', message: 'Missing required fields' }, { status: 400 });
    }

    const dupEmail = store.find((p) => p.email.toLowerCase() === emailLower);
    if (dupEmail) {
        return NextResponse.json(
            { error: 'duplicate_email', message: `A patient with email ${email} is already registered` },
            { status: 409 },
        );
    }

    const dupPhone = store.find((p) => p.phone.trim() === phoneNorm);
    if (dupPhone) {
        return NextResponse.json(
            { error: 'duplicate_phone', message: `A patient with phone ${phone} is already registered` },
            { status: 409 },
        );
    }

    const record: PatientRecord = {
        id: generateId(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: emailLower,
        phone: phoneNorm,
        ...(dateOfBirth ? { dateOfBirth } : {}),
        patientId: patientId?.trim() || generateId(),
        ...(notes ? { notes: notes.trim() } : {}),
        createdAt: new Date().toISOString(),
    };

    store.push(record);
    return NextResponse.json(record, { status: 201 });
}
