'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@web-shared/hooks/use-auth';
import { Button } from '@web-shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@web-shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@web-shared/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@web-shared/components/ui/skeleton';
import { Users, Calendar, AlertTriangle, TrendingUp, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
    const router = useRouter();
    const { user, logout, isLoading: authLoading } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [metrics, setMetrics] = useState({
        totalPatients: 0,
        totalProviders: 0,
        appointmentsThisWeek: 0,
        gdprRequests: 0,
        branchIncidents: 0,
    });
    const [trendData, setTrendData] = useState<any[]>([]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        // Fetch dashboard metrics
        const fetchMetrics = async () => {
            try {
                // Simulate API call
                setMetrics({
                    totalPatients: 1240,
                    totalProviders: 45,
                    appointmentsThisWeek: 312,
                    gdprRequests: 8,
                    branchIncidents: 2,
                });

                setTrendData([
                    { date: 'Mon', appointments: 65, registrations: 12 },
                    { date: 'Tue', appointments: 72, registrations: 15 },
                    { date: 'Wed', appointments: 68, registrations: 10 },
                    { date: 'Thu', appointments: 78, registrations: 18 },
                    { date: 'Fri', appointments: 85, registrations: 20 },
                    { date: 'Sat', appointments: 45, registrations: 8 },
                    { date: 'Sun', appointments: 32, registrations: 5 },
                ]);
            } catch (error) {
                console.error('Failed to fetch metrics:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user?.role === 'ADMIN' || user?.role === 'PROVIDER') {
            fetchMetrics();
        }
    }, [user]);

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    const allowedRoles = ['ADMIN', 'COMPLIANCE_OFFICER'];
    if (user && !allowedRoles.includes(user.role)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle>Access Denied</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600 mb-4">You don't have permission to access the admin dashboard.</p>
                        <Button onClick={handleLogout}>Go to Patient Portal</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

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

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <nav className="bg-white shadow sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Provider Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">{user.firstName} {user.lastName}</span>
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
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                            <Users className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.totalPatients}</div>
                            <p className="text-xs text-gray-500">+5% from last month</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">This Week</CardTitle>
                            <Calendar className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.appointmentsThisWeek}</div>
                            <p className="text-xs text-gray-500">Appointments</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">GDPR Requests</CardTitle>
                            <TrendingUp className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.gdprRequests}</div>
                            <p className="text-xs text-gray-500">Pending</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Providers</CardTitle>
                            <Users className="h-4 w-4 text-gray-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.totalProviders}</div>
                            <p className="text-xs text-gray-500">Active</p>
                        </CardContent>
                    </Card>

                    <Card className={metrics.branchIncidents > 0 ? 'border-red-200 bg-red-50' : ''}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Security</CardTitle>
                            <AlertTriangle className={`h-4 w-4 ${metrics.branchIncidents > 0 ? 'text-red-600' : 'text-green-600'}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.branchIncidents}</div>
                            <p className="text-xs text-gray-500">Incidents</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Weekly Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="appointments" stroke="#3b82f6" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>New Registrations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="registrations" fill="#10b981" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Admin Functions */}
                <Tabs defaultValue="gdpr" className="w-full">
                    <TabsList>
                        <TabsTrigger value="gdpr">GDPR Requests</TabsTrigger>
                        <TabsTrigger value="compliance">Compliance</TabsTrigger>
                        <TabsTrigger value="security">Security Incidents</TabsTrigger>
                        <TabsTrigger value="audit">Audit Trail</TabsTrigger>
                    </TabsList>

                    <TabsContent value="gdpr" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>GDPR Data Requests</CardTitle>
                                <CardDescription>Access, export, and deletion requests</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="border rounded-lg p-4 hover:bg-gray-50">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold">Data Export Request #000{i}</p>
                                                    <p className="text-sm text-gray-600">Patient: Max Müller</p>
                                                    <p className="text-xs text-gray-500">Submitted: 2 days ago</p>
                                                </div>
                                                <Button variant="outline" size="sm">
                                                    Process
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="compliance">
                        <Card>
                            <CardHeader>
                                <CardTitle>Compliance Status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <p className="font-semibold text-green-900">✓ GDPR Compliant</p>
                                    <p className="text-sm text-green-700">All encryption and audit requirements met</p>
                                </div>
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <p className="font-semibold text-green-900">✓ TISAX C3 Verified</p>
                                    <p className="text-sm text-green-700">German medical data protection standards</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security">
                        <Card>
                            <CardHeader>
                                <CardTitle>Security Incidents</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {metrics.branchIncidents > 0 ? (
                                    <div className="space-y-4">
                                        <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                                            <p className="font-semibold text-red-900">Failed Login Attempts - High</p>
                                            <p className="text-sm text-red-700">24 failed attempts detected from IP 192.168.1.x</p>
                                            <Button variant="destructive" size="sm" className="mt-2">
                                                Investigate
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-600">No security incidents detected</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="audit">
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Audit Log</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    {[
                                        'Patient record accessed by Dr. Schmidt - 2 hours ago',
                                        'User registered: john@example.com - 4 hours ago',
                                        'Password reset completed - 6 hours ago',
                                        'Data export requested by patient - 1 day ago',
                                        'System backup completed successfully - 2 days ago',
                                    ].map((entry, i) => (
                                        <div key={i} className="border-b pb-2 text-gray-600">
                                            {entry}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
