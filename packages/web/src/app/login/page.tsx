'use client';

import { useState } from 'react';
import { useAuth } from '@web-shared/hooks/use-auth';
import { Button } from '@web-shared/components/ui/button';
import { Input } from '@web-shared/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@web-shared/components/ui/card';
import { Label } from '@web-shared/components/ui/label';
import { Alert, AlertDescription } from '@web-shared/components/ui/alert';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
    const { login, isLoading, error } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [mfaRequired, setMfaRequired] = useState(false);
    const [mfaCode, setMfaCode] = useState('');

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const result = await login(email, password, mfaCode || undefined);

        if (result?.mfaRequired) {
            setMfaRequired(true);
            return;
        }

        const nextPath = searchParams.get('next');
        if (nextPath) {
            router.push(nextPath);
            return;
        }

        router.push('/dashboard');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 px-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-2">
                    <CardTitle className="text-2xl">Healthcare Portal</CardTitle>
                    <CardDescription>
                        {mfaRequired ? 'Enter your 6-digit code' : 'Sign in to your account'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={(e) => {
                            void handleLogin(e);
                        }}
                        className="space-y-4"
                    >
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {!mfaRequired ? (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                        disabled={isLoading}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                            disabled={isLoading}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-2 top-2.5 text-gray-500 hover:text-gray-700"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <Link href="/forgot-password" className="text-blue-600 hover:underline">
                                        Forgot password?
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="mfa">Authenticator Code</Label>
                                <Input
                                    id="mfa"
                                    type="text"
                                    placeholder="000000"
                                    value={mfaCode}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                                    }
                                    maxLength={6}
                                    disabled={isLoading}
                                    required
                                    className="text-center text-2xl tracking-widest"
                                />
                                <p className="text-xs text-gray-500">Enter the 6-digit code from your authenticator app</p>
                            </div>
                        )}

                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? 'Please wait...' : mfaRequired ? 'Verify' : 'Sign In'}
                        </Button>
                    </form>

                    <div className="mt-6 border-t pt-4">
                        <p className="text-sm text-center text-gray-600">
                            Don&apos;t have an account?{' '}
                            <Link href="/register" className="text-blue-600 hover:underline font-semibold">
                                Sign up
                            </Link>
                        </p>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-gray-500 text-center">
                            This is a GDPR-compliant healthcare platform. Your data is encrypted and secured.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
