import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from '@/contexts/I18nProvider';
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  const [location, setLocation] = useLocation();
  
  // Navigation state
  const [activeSection, setActiveSection] = useState<string>("overview");

  // Auth check
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Update active section based on current route
  useEffect(() => {
    if (location === '/' || location === '/dashboard') {
      setActiveSection('overview');
    }
  }, [location]);

  // Fetch data
  const { data: stats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    enabled: isAuthenticated
  });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-2">Analytics and system summary</p>
            </div>
          </div>
          
          {/* Navigation Tabs - Analytics Only */}
          <div className="flex space-x-1 border-b border-gray-200">
            <button
              onClick={() => setActiveSection('overview')}
              className="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors bg-blue-50 text-blue-600 border-b-2 border-blue-600"
              data-testid="tab-overview"
            >
              Analytics & Summary
            </button>
          </div>
        </div>

        {/* Dashboard Statistics - Only show on overview */}
        {activeSection === 'overview' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Clients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(stats as any).totalClients || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Workers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(stats as any).totalWorkers || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Workers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(stats as any).activeWorkers || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Workflow Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(stats as any).totalWorkflowTemplates || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Pending Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(stats as any).pendingActions || 0}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Additional Analytics Section */}
        {activeSection === 'overview' && (
          <div className="w-full space-y-6">
            {/* Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Workflow Status Distribution</CardTitle>
                  <CardDescription>Overview of all workflow statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'In Progress', value: stats?.inProgressWorkflows || 5, fill: '#3b82f6' },
                          { name: 'Completed', value: stats?.completedWorkflows || 8, fill: '#10b981' },
                          { name: 'Pending', value: stats?.pendingWorkflows || 3, fill: '#f59e0b' },
                          { name: 'Cancelled', value: stats?.cancelledWorkflows || 1, fill: '#ef4444' }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#3b82f6" />
                        <Cell fill="#10b981" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Activity</CardTitle>
                  <CardDescription>Workflow activities over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={[
                        { month: 'Jan', workflows: stats?.monthlyWorkflows?.[0] || 12 },
                        { month: 'Feb', workflows: stats?.monthlyWorkflows?.[1] || 19 },
                        { month: 'Mar', workflows: stats?.monthlyWorkflows?.[2] || 15 },
                        { month: 'Apr', workflows: stats?.monthlyWorkflows?.[3] || 22 },
                        { month: 'May', workflows: stats?.monthlyWorkflows?.[4] || 18 },
                        { month: 'Jun', workflows: stats?.monthlyWorkflows?.[5] || 25 }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="workflows" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Activity Summary */}
            <Card>
              <CardHeader>
                <CardTitle>System Summary</CardTitle>
                <CardDescription>Key metrics and recent activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{stats?.totalClients || 0}</div>
                    <div className="text-sm text-gray-600">Total Clients</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{stats?.totalWorkers || 0}</div>
                    <div className="text-sm text-gray-600">Total Workers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">{stats?.activeWorkflows || 0}</div>
                    <div className="text-sm text-gray-600">Active Workflows</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}