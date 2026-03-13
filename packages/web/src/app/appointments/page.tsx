'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@web-shared/hooks/use-auth';
import { useAppointments } from '@web-shared/hooks/use-appointments';
import { AppointmentConsentForm } from '@web-shared/components/AppointmentConsentForm';
import { Button } from '@web-shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@web-shared/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@web-shared/components/ui/dialog';
import { Badge } from '@web-shared/components/ui/badge';
import { Skeleton } from '@web-shared/components/ui/skeleton';
import { Calendar, Clock, MapPin, Video, ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AppointmentsPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const { appointments, isLoading } = useAppointments({});
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
    const [showConsentForm, setShowConsentForm] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Skeleton className="h-full" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const upcomingAppointments = appointments?.filter(
        (apt) => new Date(apt.appointmentDate) > new Date(),
    ) || [];
    const pastAppointments = appointments?.filter(
        (apt) => new Date(apt.appointmentDate) <= new Date(),
    ) || [];

    const getStatusBadge = (status: string) => {
        const variants: { [key: string]: any } = {
            scheduled: 'outline',
            cancelled: 'destructive',
            completed: 'secondary',
        };
        return variants[status] || 'outline';
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
                    <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Upcoming Appointments */}
                <Card className="mb-8">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Upcoming Appointments</CardTitle>
                                <CardDescription>Your scheduled consultations</CardDescription>
                            </div>
                            <Button>
                                <Plus size={16} className="mr-2" />
                                Schedule New
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {upcomingAppointments.length === 0 ? (
                            <div className="text-center py-8">
                                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No upcoming appointments</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {upcomingAppointments.map((appointment) => (
                                    <div key={appointment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="font-semibold text-gray-900">Consultation</p>
                                                <Badge variant={getStatusBadge(appointment.status)} className="mt-1">
                                                    {appointment.status}
                                                </Badge>
                                            </div>
                                            <Dialog open={showConsentForm && selectedAppointment?.id === appointment.id}>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedAppointment(appointment);
                                                            setShowConsentForm(true);
                                                        }}
                                                    >
                                                        Consent
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Appointment Consent</DialogTitle>
                                                    </DialogHeader>
                                                    <AppointmentConsentForm
                                                        appointmentId={appointment.id}
                                                        appointmentDate={new Date(appointment.appointmentDate)}
                                                        onSubmit={() => setShowConsentForm(false)}
                                                    />
                                                </DialogContent>
                                            </Dialog>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="flex items-center text-gray-600">
                                                <Clock size={16} className="mr-2" />
                                                {new Date(appointment.appointmentDate).toLocaleDateString('de-DE')}
                                            </div>
                                            <div className="flex items-center text-gray-600">
                                                {appointment.appointmentType === 'telemedicine' ? (
                                                    <>
                                                        <Video size={16} className="mr-2" />
                                                        Telemedicine
                                                    </>
                                                ) : (
                                                    <>
                                                        <MapPin size={16} className="mr-2" />
                                                        In-Person
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Past Appointments */}
                {pastAppointments.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Past Appointments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {pastAppointments.map((appointment) => (
                                    <div key={appointment.id} className="border rounded-lg p-4 bg-gray-50">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-gray-900">
                                                    {new Date(appointment.appointmentDate).toLocaleDateString('de-DE')}
                                                </p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {appointment.appointmentType === 'telemedicine' ? 'Telemedicine' : 'In-Person'}{' '}
                                                    Consultation
                                                </p>
                                            </div>
                                            <Badge variant="secondary">{appointment.status}</Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
}
