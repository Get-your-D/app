'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@web-shared/hooks/use-auth';
import { useAppointments } from '@web-shared/hooks/use-appointments';
import { Button } from '@web-shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@web-shared/components/ui/card';
import { Skeleton } from '@web-shared/components/ui/skeleton';
import { Calendar, FileText, Settings, LogOut, Clock, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
    const router = useRouter();
    const { user, logout, isLoading: authLoading } = useAuth();
    const { appointments, isLoading: appointmentsLoading } = useAppointments({
        limit: 5,
        status: 'scheduled',
    });

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    if (authLoading || appointmentsLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <nav className="bg-white shadow">
                    <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-900">Healthcare Portal</h1>
                    </div>
                </nav>
                <main className="max-w-7xl mx-auto px-4 py-8">
                    <Skeleton className="h-32 w-full mb-6" />
                    <Skeleton className="h-32 w-full mb-6" />
                </main>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    const upcomingAppointments = appointments?.filter(
        (apt) => new Date(apt.appointmentDate) > new Date(),
    ) || [];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <nav className="bg-white shadow sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Healthcare Portal</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-gray-600">{user.firstName} {user.lastName}</span>
                        <Link href="/settings">
                            <Button variant="outline" size="sm">
                                <Settings size={16} className="mr-2" />
                                Settings
                            </Button>
                        </Link>
                        <Button variant="destructive" size="sm" onClick={handleLogout}>
                            <LogOut size={16} className="mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Welcome Section */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Welcome, {user.firstName}!</CardTitle>
                        <CardDescription>Your healthcare dashboard</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600">
                            Your medical records are encrypted and securely stored. This portal provides access to your appointments,
                            clinical records, and health information in compliance with GDPR regulations.
                        </p>
                    </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
                            <Calendar className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
                            <p className="text-xs text-gray-500">Next 30 days</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Clinical Records</CardTitle>
                            <FileText className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Information</div>
                            <p className="text-xs text-gray-500">
                                <Link href="/records" className="text-blue-600 hover:underline">
                                    View all records
                                </Link>
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Account Status</CardTitle>
                            <User className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Active</div>
                            <p className="text-xs text-gray-500">All systems operational</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Upcoming Appointments */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Upcoming Appointments</CardTitle>
                                <CardDescription>Your scheduled consultations</CardDescription>
                            </div>
                            <Link href="/appointments">
                                <Button variant="outline">View All</Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {upcomingAppointments.length === 0 ? (
                            <p className="text-gray-500">No upcoming appointments. Schedule one now.</p>
                        ) : (
                            <div className="space-y-4">
                                {upcomingAppointments.slice(0, 5).map((appointment) => (
                                    <div key={appointment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-gray-900">
                                                    {appointment.appointmentType === 'telemedicine' ? '💻' : '🏥'}{' '}
                                                    {appointment.appointmentType === 'telemedicine' ? 'Telemedicine' : 'In-Person'}{' '}
                                                    Appointment
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    <Clock size={14} className="inline mr-1" />
                                                    {new Date(appointment.appointmentDate).toLocaleDateString('de-DE', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>
                                            <Link href={`/appointments/${appointment.id}`}>
                                                <Button variant="outline" size="sm">
                                                    View Details
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
