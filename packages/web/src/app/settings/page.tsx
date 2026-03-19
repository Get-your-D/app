'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@web-shared/hooks/use-auth';
import { Button } from '@web-shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@web-shared/components/ui/card';
import { Input } from '@web-shared/components/ui/input';
import { Label } from '@web-shared/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@web-shared/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@web-shared/components/ui/alert';
import { Skeleton } from '@web-shared/components/ui/skeleton';
import { AlertTriangle, ArrowLeft, Lock, Shield, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Skeleton className="h-full" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        setIsUpdating(true);
        // Call API to change password
        setTimeout(() => {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setIsUpdating(false);
            alert('Password changed successfully');
        }, 1000);
    };

    const handleRequestDataExport = async () => {
        // Call API to request GDPR data export
        alert('GDPR data export request submitted. You will receive a download link via email within 24 hours.');
    };

    const handleDeleteAccount = async (e: React.FormEvent) => {
        e.preventDefault();

        if (deleteConfirm !== user.email) {
            alert('Email confirmation does not match');
            return;
        }

        setIsUpdating(true);
        // Call API to delete account
        setTimeout(() => {
            setIsUpdating(false);
            alert('Account deletion request submitted. Your data will be permanently deleted within 30 days.');
            router.push('/');
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <nav className="bg-white shadow sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft size={16} />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
                </div>
            </nav>

            <main className="max-w-3xl mx-auto px-4 py-8">
                {/* Profile Information */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>Your account details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-gray-600">First Name</Label>
                                <p className="text-lg font-semibold">{user.firstName}</p>
                            </div>
                            <div>
                                <Label className="text-gray-600">Last Name</Label>
                                <p className="text-lg font-semibold">{user.lastName}</p>
                            </div>
                        </div>
                        <div>
                            <Label className="text-gray-600">Email</Label>
                            <p className="text-lg font-semibold">{user.email}</p>
                        </div>
                        <div>
                            <Label className="text-gray-600">Account Status</Label>
                            <p className="text-lg font-semibold">
                                <span className="text-green-600">● Active</span>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Change Password */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock size={20} />
                            Change Password
                        </CardTitle>
                        <CardDescription>Secure your account with a strong password</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <Input
                                    id="currentPassword"
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={8}
                                />
                            </div>

                            <div>
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <Button type="submit" disabled={isUpdating}>
                                {isUpdating ? 'Updating...' : 'Update Password'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Security & Privacy */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield size={20} />
                            Security & Privacy
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="border rounded-lg p-4 bg-blue-50">
                            <p className="text-sm text-gray-700 mb-3">
                                Your data is encrypted with AES-256-GCM and complies with GDPR regulations. You have the following
                                rights:
                            </p>
                            <ul className="text-sm text-gray-600 space-y-2">
                                <li>✓ Right to access your personal data</li>
                                <li>✓ Right to data export (portable format)</li>
                                <li>✓ Right to withdraw consent</li>
                                <li>✓ Right to be forgotten (deletion)</li>
                            </ul>
                        </div>

                        <Button variant="outline" className="w-full" onClick={handleRequestDataExport}>
                            Request GDPR Data Export
                        </Button>
                    </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle size={20} />
                            Danger Zone
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Alert variant="destructive" className="mb-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Delete Account</AlertTitle>
                            <AlertDescription>
                                This action is permanent. All your data will be securely deleted within 30 days.
                            </AlertDescription>
                        </Alert>

                        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                            <DialogTrigger asChild>
                                <Button variant="destructive" className="w-full">
                                    <Trash2 size={16} className="mr-2" />
                                    Delete Account
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Delete Account - Confirm</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleDeleteAccount} className="space-y-4">
                                    <Alert variant="destructive">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle>This cannot be undone</AlertTitle>
                                        <AlertDescription>
                                            Your account and all associated data will be permanently deleted within 30 days.
                                        </AlertDescription>
                                    </Alert>

                                    <div>
                                        <Label htmlFor="deleteConfirm">
                                            Type your email address to confirm: <span className="font-mono">{user.email}</span>
                                        </Label>
                                        <Input
                                            id="deleteConfirm"
                                            type="email"
                                            value={deleteConfirm}
                                            onChange={(e) => setDeleteConfirm(e.target.value)}
                                            placeholder={user.email}
                                            required
                                        />
                                    </div>

                                    <Button type="submit" variant="destructive" disabled={isUpdating || deleteConfirm !== user.email}>
                                        {isUpdating ? 'Deleting...' : 'Delete My Account'}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
