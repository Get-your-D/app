'use client';

import { useState } from 'react';
import { useAuth } from '@web-shared/hooks/use-auth';
import { Button } from '@web-shared/components/ui/button';
import { Input } from '@web-shared/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@web-shared/components/ui/card';
import { Label } from '@web-shared/components/ui/label';
import { Alert, AlertDescription } from '@web-shared/components/ui/alert';
import { Checkbox } from '@web-shared/components/ui/checkbox';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
    const { register, isLoading, error } = useAuth();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        dateOfBirth: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [agreeDPA, setAgreeDPA] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        if (!agreeTerms || !agreeDPA) {
            alert('You must agree to the terms and data protection agreement');
            return;
        }

        try {
            await register({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                dateOfBirth: formData.dateOfBirth,
                phone: formData.phone,
                password: formData.password,
            });
        } catch (err) {
            console.error('Registration failed:', err);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-2">
                    <CardTitle className="text-2xl">Create Account</CardTitle>
                    <CardDescription>Join our healthcare platform</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleRegister} className="space-y-3">
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    placeholder="Max"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    name="lastName"
                                    placeholder="Müller"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="max.mueller@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dateOfBirth">Date of Birth</Label>
                            <Input
                                id="dateOfBirth"
                                name="dateOfBirth"
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                placeholder="+49 30 123456789"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2 top-2.5 text-gray-500"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500">Minimum 8 characters, with uppercase, numbers, and symbols</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="space-y-2 bg-gray-50 p-3 rounded border border-gray-200">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="terms"
                                    checked={agreeTerms}
                                    onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                                />
                                <Label htmlFor="terms" className="font-normal text-sm cursor-pointer">
                                    I agree to the Terms of Service
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="dpa"
                                    checked={agreeDPA}
                                    onCheckedChange={(checked) => setAgreeDPA(checked as boolean)}
                                />
                                <Label htmlFor="dpa" className="font-normal text-sm cursor-pointer">
                                    I agree to the Data Protection Agreement (GDPR compliant)
                                </Label>
                            </div>
                        </div>

                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? 'Creating account...' : 'Create Account'}
                        </Button>
                    </form>

                    <div className="mt-6 border-t pt-4">
                        <p className="text-sm text-center text-gray-600">
                            Already have an account?{' '}
                            <Link href="/login" className="text-blue-600 hover:underline font-semibold">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
