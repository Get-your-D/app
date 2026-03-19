'use client';

import { useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from './ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';

interface AuditTrailViewerProps {
    resourceId: string;
    resourceType: string;
}

export function AuditTrailViewer({ resourceId, resourceType }: AuditTrailViewerProps) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const params = new URLSearchParams({
                    resourceType,
                    resourceId,
                });

                const response = await fetch(`/api/v1/audit?${params.toString()}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setLogs(data);
                } else {
                    setError('Failed to fetch audit trail');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch audit trail');
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [resourceId, resourceType]);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Audit Trail / Prüfprotokoll</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Audit Trail / Prüfprotokoll</CardTitle>
                </CardHeader>
                <CardContent className="text-red-600">{error}</CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Audit Trail / Prüfprotokoll</CardTitle>
                <CardDescription>
                    GDPR-compliant activity log for {resourceType}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Timestamp / Zeit</TableHead>
                            <TableHead>Action / Aktion</TableHead>
                            <TableHead>User / Benutzer</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>IP Address</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-slate-500 py-4">
                                    No audit logs found / Keine Prüfprotokolle gefunden
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log: any) => (
                                <TableRow key={log.id}>
                                    <TableCell className="text-sm">
                                        {new Date(log.createdAt).toLocaleString('de-DE')}
                                    </TableCell>
                                    <TableCell className="text-sm font-medium">{log.action}</TableCell>
                                    <TableCell className="text-sm text-slate-600">{log.userId || 'System'}</TableCell>
                                    <TableCell>
                                        <span
                                            className={`px-2 py-1 rounded text-xs font-medium ${log.status === 'success'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                }`}
                                        >
                                            {log.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-600 font-mono">
                                        {log.ipAddress || '-'}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
