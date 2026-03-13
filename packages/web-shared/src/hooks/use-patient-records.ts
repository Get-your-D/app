'use client';

import { useEffect, useState } from 'react';

export function usePatientRecords(patientId?: string) {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!patientId) return;

        const fetchRecords = async () => {
            try {
                const response = await fetch(`/api/v1/patients/${patientId}/records`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setRecords(data);
                } else {
                    setError('Failed to fetch records');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch records');
            } finally {
                setLoading(false);
            }
        };

        fetchRecords();
    }, [patientId]);

    const createRecord = async (recordData: any) => {
        try {
            const response = await fetch(`/api/v1/records`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
                body: JSON.stringify(recordData),
            });

            if (response.ok) {
                const newRecord = await response.json();
                setRecords([newRecord, ...records]);
                return newRecord;
            } else {
                throw new Error('Failed to create record');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create record');
            throw err;
        }
    };

    const deleteRecord = async (recordId: string) => {
        try {
            const response = await fetch(`/api/v1/records/${recordId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
            });

            if (response.ok) {
                setRecords(records.filter((r: any) => r.id !== recordId));
            } else {
                throw new Error('Failed to delete record');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete record');
            throw err;
        }
    };

    return { records, loading, error, createRecord, deleteRecord };
}
