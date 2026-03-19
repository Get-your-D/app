import { NextRequest, NextResponse } from 'next/server';

function getBaseUrl(request: NextRequest): string {
    const configuredBase = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (configuredBase) {
        return configuredBase.replace(/\/$/, '');
    }
    return request.nextUrl.origin;
}

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ testResultId: string }> },
) {
    const { testResultId: rawTestResultId } = await context.params;
    const testResultId = rawTestResultId?.trim();

    if (!testResultId) {
        return NextResponse.json({ message: 'testResultId is required' }, { status: 400 });
    }

    const baseUrl = getBaseUrl(request);
    const onboardingUrl = `${baseUrl}/onboarding?testResultId=${encodeURIComponent(testResultId)}`;
    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(onboardingUrl)}`;

    return NextResponse.json({
        testResultId,
        onboardingUrl,
        qrCodeImageUrl,
        instructions: 'Print or display this QR code at the pharmacy counter after the test is completed.',
    });
}
