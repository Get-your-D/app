'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@web-shared/hooks/use-auth';
import { useAppointments } from '@web-shared/hooks/use-appointments';
import { Button } from '@web-shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@web-shared/components/ui/card';
import { Skeleton } from '@web-shared/components/ui/skeleton';
import { Calendar, Heart, MessageSquare, Settings, LogOut, Phone } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
    const router = useRouter();
    const { user, logout, isLoading: authLoading } = useAuth();
    const { appointments, isLoading: appointmentsLoading } = useAppointments({ limit: 3 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user && appointments) {
            setIsLoading(false);
        }
    }, [user, appointments]);

    if (authLoading || appointmentsLoading || isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <Skeleton className="h-full" />
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header */}
            <nav className="bg-white shadow sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Patient Portal</h1>
                        <p className="text-xs text-gray-500">Your personal health dashboard</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 hidden sm:block">Welcome, {user.firstName}!</span>
                        <Link href="/settings">
                            <Button variant="outline" size="sm">
                                <Settings size={16} className="mr-2" />
                                <span className="hidden sm:inline">Settings</span>
                            </Button>
                        </Link>
                        <Button variant="destructive" size="sm" onClick={handleLogout}>
                            <LogOut size={16} className="mr-2" />
                            <span className="hidden sm:inline">Logout</span>
                        </Button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Welcome Card */}
                <Card className="mb-8 border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50">
                    <CardHeader>
                        <CardTitle>Welcome to Your Health Portal</CardTitle>
                        <CardDescription>
                            Manage your appointments, access your health records, and stay connected with your healthcare providers
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-700">
                            ✓ Your medical data is encrypted and secure • ✓ GDPR compliant • ✓ Telemedicine ready
                        </p>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Link href="/appointments">
                        <Card className="hover:shadow-lg cursor-pointer transition">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Appointments</CardTitle>
                                <Calendar className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
                                <p className="text-xs text-gray-500 mt-1">Upcoming appointments</p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/health-records">
                        <Card className="hover:shadow-lg cursor-pointer transition">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Health Records</CardTitle>
                                <Heart className="h-4 w-4 text-red-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">View</div>
                                <p className="text-xs text-gray-500 mt-1">Medical history & records</p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/messages">
                        <Card className="hover:shadow-lg cursor-pointer transition">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Messages</CardTitle>
                                <MessageSquare className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">0</div>
                                <p className="text-xs text-gray-500 mt-1">Unread messages</p>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* Upcoming Appointments */}
                <Card className="mb-8">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Your Upcoming Appointments</CardTitle>
                                <CardDescription>Schedule and manage your consultations</CardDescription>
                            </div>
                            <Link href="/appointments">
                                <Button variant="outline" size="sm">
                                    View All
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {upcomingAppointments.length === 0 ? (
                            <div className="text-center py-8">
                                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 mb-4">No upcoming appointments</p>
                                <Button>Schedule an Appointment</Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {upcomingAppointments.map((appointment) => (
                                    <div
                                        key={appointment.id}
                                        className="border rounded-lg p-4 bg-gradient-to-r from-gray-50 to-transparent hover:shadow-md transition"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-semibold text-gray-900">
                                                    {appointment.appointmentType === 'telemedicine' ? '💻 Video Consultation' : '🏥 In-Person Visit'}
                                                </p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    📅{' '}
                                                    {new Date(appointment.appointmentDate).toLocaleDateString('de-DE', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                    })}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    🕐{' '}
                                                    {new Date(appointment.appointmentDate).toLocaleTimeString('de-DE', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>
                                            <Link href={`/appointments/${appointment.id}`}>
                                                <Button variant="outline" size="sm">
                                                    Details
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Health Tips */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Quick Tips</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <p>• Keep your appointments - reschedule 24h in advance if needed</p>
                            <p>• Keep your emergency contact information updated</p>
                            <p>• Prepare medical history info for new appointments</p>
                            <p>• Download your health records anytime (GDPR right)</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Need Help?</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                                <Phone size={16} className="text-blue-600" />
                                <span>Call: +49 30 123456789</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <MessageSquare size={16} className="text-blue-600" />
                                <span>Email: support@healthcare.com</span>
                            </div>
                            <Button variant="outline" size="sm" className="w-full">
                                Contact Support
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* GDPR Footer */}
                <Card className="mt-8 bg-gray-50 border-gray-200">
                    <CardContent className="pt-6">
                        <p className="text-xs text-gray-600 text-center">
                            Your personal health information is protected by GDPR regulations and encrypted with AES-256-GCM. You have
                            the right to access, export, or delete your data at any time. Contact our Data Protection Officer for
                            privacy concerns.
                        </p>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
