import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/contexts/I18nProvider';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CalendarDays, TrendingUp, Users, FileText, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { apiRequest } from '@/lib/queryClient';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AnalyticsPage() {
  const { t } = useTranslation();
  usePageTitle('nav.analytics');
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedClient, setSelectedClient] = useState('all');
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    enabled: isAuthenticated && !isLoading,
  });

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['/api/dashboard/assignments'],
    enabled: isAuthenticated && !isLoading,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients'],
  });

  const { data: analyticsEvents = [] } = useQuery({
    queryKey: ['/api/analytics/events', { clientId: selectedClient !== 'all' ? selectedClient : undefined }],
    enabled: user?.role === 'ADMIN',
  });

  const { data: monthlyData = [] } = useQuery({
    queryKey: ['/api/analytics/monthly'],
    enabled: isAuthenticated && !isLoading,
  });

  // Process assignment data for charts
  const statusData = (assignments as any[]).reduce((acc: any[], assignment: any) => {
    const existing = acc.find(item => item.status === assignment.status);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({
        status: assignment.status.replace('_', ' '),
        count: 1,
        color: COLORS[acc.length % COLORS.length]
      });
    }
    return acc;
  }, []);

  // Stage progression data
  const stageData = (assignments as any[]).reduce((acc: any[], assignment: any) => {
    const stageName = assignment.stage?.name || 'Unknown';
    const existing = acc.find(item => item.stage === stageName);
    if (existing) {
      existing.total += 1;
      if (assignment.status === 'ACCEPTED') {
        existing.completed += 1;
      }
    } else {
      acc.push({
        stage: stageName,
        total: 1,
        completed: assignment.status === 'ACCEPTED' ? 1 : 0,
        pending: assignment.status !== 'ACCEPTED' ? 1 : 0
      });
    }
    return acc;
  }, []);

  // Client performance data
  const clientData = (assignments as any[]).reduce((acc: any[], assignment: any) => {
    const clientName = assignment.clientProfile?.legalName || 'Unknown';
    const existing = acc.find(item => item.client === clientName);
    if (existing) {
      existing.total += 1;
      if (assignment.status === 'ACCEPTED') {
        existing.completed += 1;
      }
    } else {
      acc.push({
        client: clientName.length > 20 ? clientName.substring(0, 17) + '...' : clientName,
        total: 1,
        completed: assignment.status === 'ACCEPTED' ? 1 : 0
      });
    }
    return acc;
  }, []);

  // Monthly progress data is now fetched from the API

  if (statsLoading || assignmentsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">{t('pages.analytics.title') || 'Analytics Dashboard'}</h1>
            <p className="text-secondary mt-1">{t('pages.analytics.subtitle') || 'Comprehensive analytics and reporting for immigration workflows'}</p>
          </div>
          <div className="flex space-x-4">
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t('analytics.placeholders.allClients') || 'All Clients'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('analytics.options.allClients') || 'All Clients'}</SelectItem>
                  {(clients as any[]).map((client: any) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder={t('analytics.placeholders.period') || 'Period'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">{t('periods.7days') || '7 Days'}</SelectItem>
                  <SelectItem value="30">{t('periods.30days') || '30 Days'}</SelectItem>
                  <SelectItem value="90">{t('periods.90days') || '90 Days'}</SelectItem>
                  <SelectItem value="365">{t('periods.1year') || '1 Year'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
        </div>
        
        <div className="space-y-6">

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('analytics.headers.totalClients') || 'Total Clients'}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-clients">
              {(stats as any)?.totalClients || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('analytics.headers.activeWorkers') || 'Active Workers'}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-active-workers">
              {(stats as any)?.activeWorkers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently in process
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('analytics.headers.pendingActions') || 'Pending Actions'}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-pending-actions">
              {(stats as any)?.pendingActions || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('analytics.completed.month') || 'Completed (Month)'}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-completed-month">
              {(stats as any)?.completedThisMonth || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +18% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.headers.statusDistribution') || 'Assignment Status Distribution'}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.headers.stageProgress') || 'Stage Progress'}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" stackId="a" fill="#22c55e" />
                <Bar dataKey="pending" stackId="a" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.headers.monthlyTrend') || 'Monthly Progress Trend'}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData as any[]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} />
                <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} />
                <Line type="monotone" dataKey="rejected" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.headers.clientPerformance') || 'Client Performance'}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={clientData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="client" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#22c55e" />
                <Bar dataKey="total" fill="#e5e7eb" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.headers.recentActivity') || 'Recent Activity'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(assignments as any[]).slice(0, 5).map((assignment: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">
                      {assignment.requirement?.title || 'Unknown Requirement'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {assignment.worker?.firstName} {assignment.worker?.lastName} • {assignment.clientProfile?.companyName}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="capitalize">
                  {assignment.status.replace('_', ' ').toLowerCase()}
                </Badge>
              </div>
            ))}
            
            {(assignments as any[]).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No recent activity to display
              </div>
            )}
          </div>
        </CardContent>
      </Card>
        </div>
      </main>
    </div>
  );
}