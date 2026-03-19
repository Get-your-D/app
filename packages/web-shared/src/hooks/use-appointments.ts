'use client';

import { useEffect, useState } from 'react';

export function useAppointments(filters?: { patientId?: string; providerId?: string; status?: string }) {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const params = new URLSearchParams();
                if (filters?.patientId) params.append('patientId', filters.patientId);
                if (filters?.providerId) params.append('providerId', filters.providerId);
                if (filters?.status) params.append('status', filters.status);

                const response = await fetch(`/api/v1/appointments?${params.toString()}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setAppointments(data);
                } else {
                    setError('Failed to fetch appointments');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch appointments');
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, [filters]);

    const createAppointment = async (appointmentData: any) => {
        try {
            const response = await fetch(`/api/v1/appointments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
                body: JSON.stringify(appointmentData),
            });

            if (response.ok) {
                const newAppointment = await response.json();
                setAppointments([...appointments, newAppointment]);
                return newAppointment;
            } else {
                throw new Error('Failed to create appointment');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create appointment');
            throw err;
        }
    };

    const recordConsent = async (appointmentId: string, consentData: any) => {
        try {
            const response = await fetch(`/api/v1/appointments/${appointmentId}/consent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
                body: JSON.stringify(consentData),
            });

            if (response.ok) {
                // Update local state
                setAppointments(
                    appointments.map((a: any) =>
                        a.id === appointmentId ? { ...a, patientConsentRecorded: true } : a,
                    ),
                );
            } else {
                throw new Error('Failed to record consent');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to record consent');
            throw err;
        }
    };

    return { appointments, loading, isLoading: loading, error, createAppointment, recordConsent };
}
