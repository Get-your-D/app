import { NextRequest, NextResponse } from 'next/server';
import { testResultStore } from '../_store';

type JwtPayload = {
    sub?: string;
    userId?: string;
};

type ClaimRequestBody = {
    testResultId?: string;
};

function getUserIdFromAuthHeader(authHeader: string | null): string | null {
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const tokenParts = token.split('.');
    if (tokenParts.length < 2) {
        return null;
    }

    try {
        const payloadRaw = Buffer.from(tokenParts[1], 'base64url').toString('utf-8');
        const payload = JSON.parse(payloadRaw) as JwtPayload;
        return payload.sub || payload.userId || null;
    } catch {
        return null;
    }
}

export async function POST(request: NextRequest) {
    const userId = getUserIdFromAuthHeader(request.headers.get('authorization'));
    if (!userId) {
        return NextResponse.json(
            { message: 'Unauthorized: missing or invalid access token' },
            { status: 401 },
        );
    }

    const body = (await request.json()) as ClaimRequestBody;
    const testResultId = typeof body.testResultId === 'string' ? body.testResultId.trim() : '';

    if (!testResultId) {
        return NextResponse.json({ message: 'testResultId is required' }, { status: 400 });
    }

    const existingClaim = testResultStore.claims[testResultId];

    if (existingClaim && existingClaim.claimedByUserId !== userId) {
        return NextResponse.json(
            { message: 'This test result is already linked to another account.' },
            { status: 409 },
        );
    }

    const claim = {
        testResultId,
        claimedByUserId: userId,
        claimedAt: existingClaim?.claimedAt ?? new Date().toISOString(),
    };

    testResultStore.claims[testResultId] = claim;

    return NextResponse.json({
        message: 'Test result linked successfully',
        claim,
    });
}
