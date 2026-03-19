'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@web-shared/hooks/use-auth';
import { usePatientRecords } from '@web-shared/hooks/use-patient-records';
import { Button } from '@web-shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@web-shared/components/ui/card';
import { Input } from '@web-shared/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@web-shared/components/ui/dialog';
import { Label } from '@web-shared/components/ui/label';
import { Textarea } from '@web-shared/components/ui/textarea';
import { Skeleton } from '@web-shared/components/ui/skeleton';
import { Download, Plus, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RecordsPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const { records, isLoading, createRecord } = usePatientRecords(user?.id);
    const [isCreating, setIsCreating] = useState(false);
    const [newRecord, setNewRecord] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

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

    const handleCreateRecord = async () => {
        if (newRecord.trim()) {
            await createRecord({
                content: newRecord,
                type: 'USER_ENTRY',
            });
            setNewRecord('');
            setIsCreating(false);
        }
    };

    const filteredRecords = records?.filter((record) =>
        record.content.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];

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
                    <h1 className="text-2xl font-bold text-gray-900">Clinical Records</h1>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Search and Create */}
                <div className="mb-6 flex gap-4">
                    <Input
                        placeholder="Search records..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1"
                    />
                    <Dialog open={isCreating} onOpenChange={setIsCreating}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus size={16} className="mr-2" />
                                Add Record
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Personal Health Note</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Note</Label>
                                    <Textarea
                                        placeholder="Add any health notes or observations..."
                                        value={newRecord}
                                        onChange={(e) => setNewRecord(e.target.value)}
                                        rows={4}
                                    />
                                </div>
                                <Button onClick={handleCreateRecord} className="w-full">
                                    Save Record
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Records List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Your Clinical Records</CardTitle>
                        <CardDescription>All records are encrypted and GDPR-compliant</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {filteredRecords.length === 0 ? (
                            <div className="text-center py-8">
                                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No records found</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredRecords.map((record) => (
                                    <div key={record.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-500">
                                                    {new Date(record.createdAt).toLocaleDateString('de-DE', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                    })}
                                                </p>
                                                <p className="text-gray-900 mt-1">{record.content}</p>
                                                <p className="text-xs text-gray-500 mt-2">ID: {record.id}</p>
                                            </div>
                                            <Button variant="outline" size="sm">
                                                <Download size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* GDPR Info */}
                <Card className="mt-6 bg-blue-50 border-blue-200">
                    <CardHeader>
                        <CardTitle className="text-sm text-blue-900">Your Rights</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-blue-800">
                        <p>
                            Under GDPR, you have the right to access, export, or delete your medical records. Please contact our{' '}
                            <span className="font-semibold">Data Protection Officer</span> for these requests.
                        </p>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
