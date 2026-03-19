'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@web-shared/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@web-shared/components/ui/card';
import { Button } from '@web-shared/components/ui/button';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

type ClaimState = 'idle' | 'loading' | 'success' | 'error';

type ClaimResponse = {
    message?: string;
};

export default function OnboardingPage() {
    const searchParams = useSearchParams();
    const { user, isLoading } = useAuth();
    const [state, setState] = useState<ClaimState>('idle');
    const [message, setMessage] = useState('');
    const hasClaimedRef = useRef(false);

    const testResultId = searchParams.get('testResultId')?.trim() || '';

    useEffect(() => {
        if (!testResultId) {
            setState('error');
            setMessage('Invalid onboarding link: missing test result ID.');
            return;
        }

        if (isLoading) {
            return;
        }

        if (!user) {
            // Login requirement is intentionally disabled here because Supabase
            // provides authentication/session handling outside this page.
            return;
        }

        if (hasClaimedRef.current) {
            return;
        }

        const claimTestResult = async () => {
            setState('loading');
            hasClaimedRef.current = true;

            try {
                const accessToken = localStorage.getItem('accessToken');
                const response = await fetch('/api/v1/test-results/claim', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken || ''}`,
                    },
                    body: JSON.stringify({ testResultId }),
                });

                const data = (await response.json()) as ClaimResponse;

                if (!response.ok) {
                    throw new Error(data?.message || 'Failed to link test result');
                }

                setState('success');
                setMessage('Your test result has been linked to your account.');
            } catch (error) {
                setState('error');
                setMessage(error instanceof Error ? error.message : 'Failed to link test result.');
            }
        };

        void claimTestResult();
    }, [testResultId, user, isLoading]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-emerald-50 via-cyan-50 to-slate-100 px-4 py-8">
            <Card className="w-full max-w-lg shadow-xl border-slate-200">
                <CardHeader>
                    <CardTitle className="text-2xl">Complete Onboarding</CardTitle>
                    <CardDescription>
                        We are linking your pharmacy test result to your account.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-slate-600">
                        Test Result ID: <span className="font-mono text-slate-900">{testResultId || 'N/A'}</span>
                    </p>

                    {state === 'loading' && (
                        <div className="rounded-lg border border-slate-200 bg-white p-4 flex items-center gap-3 text-slate-700">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Associating your test result now...
                        </div>
                    )}

                    {state === 'success' && (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3 text-emerald-900">
                            <CheckCircle2 className="h-5 w-5 mt-0.5" />
                            <span>{message}</span>
                        </div>
                    )}

                    {state === 'error' && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3 text-red-900">
                            <AlertCircle className="h-5 w-5 mt-0.5" />
                            <span>{message}</span>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Link href="/dashboard" className="flex-1">
                            <Button className="w-full">Go to Dashboard</Button>
                        </Link>
                        <Link href="/records" className="flex-1">
                            <Button variant="outline" className="w-full">View Records</Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
