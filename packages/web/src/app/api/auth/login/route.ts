import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

export async function POST(request: NextRequest) {
    const body = await request.json();

    try {
        const response = await fetch(`${API_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (response.ok) {
            const res = NextResponse.json(data, { status: response.status });

            // Set secure HTTP-only cookie
            res.cookies.set('authToken', data.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 15 * 60, // 15 minutes
            });

            res.cookies.set('refreshToken', data.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60, // 7 days
            });

            return res;
        } else {
            return NextResponse.json(data, { status: response.status });
        }
    } catch (error) {
        return NextResponse.json(
            { error: 'Authentication failed' },
            { status: 500 }
        );
    }
}
