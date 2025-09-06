import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Play, User, Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';

interface QACheck {
  name: string;
  ok: boolean;
  details?: string;
  error?: string;
}

interface QAReport {
  ok: boolean;
  checks: QACheck[];
  errors: { name: string; reason: string; path?: string }[];
  summary: {
    passed: number;
    failed: number;
    timestamp: string;
  };
}

interface TestUser {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

const QAEnvironmentGuard = ({ children }: { children: React.ReactNode }) => {
  const isDevelopment = import.meta.env.DEV || import.meta.env.VITE_QA_MODE === 'true';
  
  if (!isDevelopment) {
    return (
      <div className="container mx-auto py-8" data-testid="qa-production-warning">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">QA Dashboard Not Available</h3>
              <p className="text-muted-foreground">
                The QA dashboard is only available in development mode or with QA_MODE enabled.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default function QADashboard() {
  const { user } = useAuth();
  const [impersonatedUser, setImpersonatedUser] = useState<TestUser | null>(null);
  const queryClient = useQueryClient();

  // Environment gate - only show in development
  const isDevelopment = import.meta.env.DEV || import.meta.env.VITE_QA_MODE === 'true';
  
  // Role gate - only admins can access
  if (user?.role !== 'ADMIN') {
    return (
      <div className="container mx-auto py-8" data-testid="qa-access-denied">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-muted-foreground mb-4">
                QA Dashboard requires administrator access.
              </p>
              <Button asChild>
                <Link href="/">Back to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <QAEnvironmentGuard>
      <QADashboardContent 
        impersonatedUser={impersonatedUser}
        setImpersonatedUser={setImpersonatedUser}
      />
    </QAEnvironmentGuard>
  );
}

function QADashboardContent({ 
  impersonatedUser, 
  setImpersonatedUser 
}: { 
  impersonatedUser: TestUser | null;
  setImpersonatedUser: (user: TestUser | null) => void;
}) {
  const queryClient = useQueryClient();

  // Fetch smoke test results
  const { 
    data: report, 
    isLoading, 
    error,
    refetch 
  } = useQuery<QAReport>({
    queryKey: ['/api/qa/smoke'],
    enabled: false, // Only run when manually triggered
  });

  // Run smoke tests mutation
  const runTestsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/qa/smoke');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/qa/smoke'] });
    },
  });

  // Impersonation mutation
  const impersonateMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest('POST', '/admin/impersonate', { userId });
      return response.json();
    },
    onSuccess: (data) => {
      setImpersonatedUser(data.user);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
  });

  // Stop impersonation mutation
  const stopImpersonationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/admin/unimpersonate');
      return response.json();
    },
    onSuccess: () => {
      setImpersonatedUser(null);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
  });

  // Test users for impersonation
  const testUsers = [
    { id: '1', email: 'admin@demo.law', role: 'ADMIN' },
    { id: '2', email: 'client@demo.law', role: 'OWNER' },
    { id: '3', email: 'worker@demo.law', role: 'WORKER' },
    { id: '4', email: 'viewer@demo.law', role: 'VIEWER' },
  ];

  const handleRunTests = () => {
    runTestsMutation.mutate();
    refetch();
  };

  return (
    <div className="container mx-auto py-8 space-y-8" data-testid="qa-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">QA Dashboard</h1>
          <p className="text-muted-foreground">
            System health checks and testing tools for development
          </p>
        </div>
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          Development Only
        </Badge>
      </div>

      {/* Impersonation Banner */}
      {impersonatedUser && (
        <Alert className="border-blue-200 bg-blue-50" data-testid="impersonation-banner">
          <User className="h-4 w-4" />
          <AlertTitle>Impersonating User</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              Currently impersonating: <strong>{impersonatedUser.email}</strong> ({impersonatedUser.role})
            </span>
            <Button 
              size="sm" 
              onClick={() => stopImpersonationMutation.mutate()}
              disabled={stopImpersonationMutation.isPending}
              data-testid="button-stop-impersonation"
            >
              {stopImpersonationMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Stop Impersonation
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Test Controls */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Smoke Tests */}
        <Card data-testid="card-smoke-tests">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Smoke Tests
            </CardTitle>
            <CardDescription>
              Run comprehensive system health checks across all components
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleRunTests}
              disabled={isLoading || runTestsMutation.isPending}
              className="w-full"
              data-testid="button-run-tests"
            >
              {(isLoading || runTestsMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Run Smoke Tests
            </Button>

            {error && (
              <Alert variant="destructive" data-testid="alert-test-error">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Test Failed</AlertTitle>
                <AlertDescription>
                  {error instanceof Error ? error.message : 'Unknown error occurred'}
                </AlertDescription>
              </Alert>
            )}

            {runTestsMutation.error && (
              <Alert variant="destructive" data-testid="alert-run-error">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Failed to Run Tests</AlertTitle>
                <AlertDescription>
                  {runTestsMutation.error instanceof Error 
                    ? runTestsMutation.error.message 
                    : 'Unknown error occurred'}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Impersonation */}
        <Card data-testid="card-impersonation">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Impersonation
            </CardTitle>
            <CardDescription>
              Switch to different user roles for testing role-based access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select 
              onValueChange={(userId) => impersonateMutation.mutate(userId)}
              disabled={impersonateMutation.isPending || impersonatedUser !== null}
            >
              <SelectTrigger data-testid="select-impersonate-user">
                <SelectValue placeholder="Select user to impersonate" />
              </SelectTrigger>
              <SelectContent>
                {testUsers.map((testUser) => (
                  <SelectItem key={testUser.id} value={testUser.id}>
                    {testUser.email} ({testUser.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {impersonateMutation.error && (
              <Alert variant="destructive" data-testid="alert-impersonation-error">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Impersonation Failed</AlertTitle>
                <AlertDescription>
                  {impersonateMutation.error instanceof Error 
                    ? impersonateMutation.error.message 
                    : 'Unknown error occurred'}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      {report && (
        <Card data-testid="card-test-results">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Test Results</span>
              <Badge variant={report.ok ? "default" : "destructive"}>
                {report.ok ? (
                  <><CheckCircle className="h-4 w-4 mr-1" /> All Passed</>
                ) : (
                  <><XCircle className="h-4 w-4 mr-1" /> {report.summary.failed} Failed</>
                )}
              </Badge>
            </CardTitle>
            <CardDescription>
              {report.summary.passed} passed, {report.summary.failed} failed • {' '}
              {new Date(report.summary.timestamp).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.checks.map((check, index) => (
                <div 
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    check.ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                  data-testid={`check-result-${index}`}
                >
                  {check.ok ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{check.name}</div>
                    {check.details && (
                      <div className="text-sm text-muted-foreground">{check.details}</div>
                    )}
                    {check.error && (
                      <div className="text-sm text-red-600 mt-1">{check.error}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {report.errors.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-red-700 mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Critical Errors ({report.errors.length})
                </h4>
                <div className="space-y-2">
                  {report.errors.map((error, index) => (
                    <div 
                      key={index}
                      className="text-sm bg-red-100 border border-red-200 rounded p-2"
                      data-testid={`critical-error-${index}`}
                    >
                      <div className="font-medium text-red-800">{error.name}</div>
                      <div className="text-red-600">{error.reason}</div>
                      {error.path && <div className="text-red-500 text-xs">{error.path}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}