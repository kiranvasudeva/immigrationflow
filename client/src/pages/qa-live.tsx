import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Play, RefreshCw } from 'lucide-react';

interface QATest {
  name: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

interface QAReport {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  tests: QATest[];
}

interface AuditEntry {
  timestamp: string;
  ip: string;
  action: string;
  result: 'ok' | 'err';
  error?: string;
}

// Safe fetcher for last-report that treats 404 as empty state
const fetchLastReport = async (): Promise<QAReport | { ok: false; reason: string; __empty: true }> => {
  const response = await fetch('/qa/last-report', {
    headers: { Accept: 'application/json' }
  });

  // 404 is valid "empty" state, not an error
  if (response.status === 404) {
    return { ok: false, reason: "NoReport", __empty: true };
  }

  // Non-404 errors should be thrown
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
  }

  // Ensure JSON response
  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    const text = await response.text();
    throw new Error(`Non-JSON response: ${text.slice(0, 200)}`);
  }

  return response.json();
};

export default function QALivePage() {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch last QA report with safe fetcher
  const { data: reportData, isLoading: reportLoading, error: reportError } = useQuery({
    queryKey: ['qa-last-report'],
    queryFn: fetchLastReport,
    retry: (failureCount, error) => {
      // Don't retry 404s (empty state), only retry other errors up to 2 times
      return !error.message.includes('HTTP 404') && failureCount < 2;
    },
    staleTime: 10_000, // 10 seconds
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Extract QA report from response (null if empty state)
  const qaReport: QAReport | null = reportData && 'tests' in reportData ? reportData : null;
  const isEmpty = reportData && '__empty' in reportData;

  // Fetch audit logs
  const { data: auditLogs, refetch: refetchAudit, isLoading: auditLoading, error: auditError } = useQuery<AuditEntry[]>({
    queryKey: ['/qa/audit-logs'],
    refetchInterval: 15000, // Auto-refresh every 15 seconds
    retry: 1, // Only retry once on failure
  });

  const runQATests = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const response = await fetch('/qa/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.ok && result.report) {
          // Invalidate and refetch the report
          await queryClient.invalidateQueries({ queryKey: ['qa-last-report'] });
        } else {
          setError('QA tests completed but returned unexpected format');
        }
      } else {
        const errorText = await response.text();
        setError(`Failed to run tests (${response.status}): ${errorText}`);
      }
    } catch (error) {
      console.error('Error running QA tests:', error);
      setError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Warning Banner */}
      <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800 dark:text-yellow-200 font-semibold text-lg">
          🚨 DEV-ONLY / UNSECURED (will be locked later) 🚨
        </AlertDescription>
      </Alert>

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">QA Live Dashboard</h1>
        <Button 
          onClick={runQATests} 
          disabled={isRunning}
          className="flex items-center gap-2"
        >
          {isRunning ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {isRunning ? 'Running...' : 'Run QA Tests'}
        </Button>
      </div>

      {/* Error Banner - Only show non-404 errors */}
      {(error || (reportError && !reportError.message.includes('HTTP 404')) || auditError) && (
        <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            {error || (reportError && !reportError.message.includes('HTTP 404') ? reportError?.message : '') || auditError?.message || 'Unknown error occurred'}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QA Report Section */}
        <Card>
          <CardHeader>
            <CardTitle>Latest QA Report</CardTitle>
          </CardHeader>
          <CardContent>
            {reportLoading ? (
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Loading report...</span>
              </div>
            ) : reportError && !reportError.message.includes('HTTP 404') ? (
              <div className="text-red-600">
                Error loading report: {reportError.message}
              </div>
            ) : isEmpty || !qaReport ? (
              <div className="text-gray-500 text-center py-8">
                <div className="text-lg font-medium mb-4">No QA Report Yet</div>
                <div className="text-sm mb-4">Click the button below to run your first QA test suite.</div>
                <Button 
                  onClick={runQATests} 
                  disabled={isRunning}
                  className="flex items-center gap-2"
                >
                  {isRunning ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {isRunning ? 'Running Tests...' : 'Run QA Tests'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {formatTimestamp(qaReport.timestamp)}
                  </span>
                  <div className="flex gap-2">
                    <Badge variant={qaReport.failed === 0 ? "default" : "destructive"}>
                      {qaReport.passed}/{qaReport.totalTests} PASSED
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {qaReport.tests.map((test, index) => (
                    <div key={index} className="flex justify-between items-center p-2 rounded border">
                      <span className="font-medium">{test.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={test.status === 'PASS' ? "default" : "destructive"}>
                          {test.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {/* JSON Viewer */}
                <details className="mt-4">
                  <summary className="cursor-pointer font-medium text-sm">
                    View Raw JSON
                  </summary>
                  <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto max-h-64">
                    {JSON.stringify(qaReport, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Endpoints Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Test Endpoints</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={async () => {
                try {
                  const response = await fetch('/health');
                  const data = await response.json();
                  alert(`Health Check (${response.status}): ${JSON.stringify(data).slice(0, 200)}`);
                } catch (err) {
                  alert(`Health Check Failed: ${err}`);
                }
              }}
            >
              Ping Health → GET /health
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={async () => {
                try {
                  const response = await fetch('/qa/last-report');
                  const text = await response.text();
                  alert(`Last Report (${response.status}): ${text.slice(0, 200)}`);
                } catch (err) {
                  alert(`Last Report Failed: ${err}`);
                }
              }}
            >
              Fetch Last Report → GET /qa/last-report
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={async () => {
                try {
                  // TODO: Add proper authentication headers when security is implemented
                  const response = await fetch('/qa/bridge', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'qaTests' })
                  });
                  const text = await response.text();
                  alert(`QA Bridge (${response.status}): ${text.slice(0, 200)}`);
                } catch (err) {
                  alert(`QA Bridge Failed: ${err}`);
                }
              }}
            >
              Run QA Tests → POST /qa/bridge
            </Button>
          </CardContent>
        </Card>

        {/* Audit Logs Section */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bridge Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {auditLoading ? (
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Loading audit logs...</span>
              </div>
            ) : auditLogs && auditLogs.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-auto">
                {auditLogs.map((entry, index) => (
                  <div key={index} className="flex justify-between items-center p-2 rounded border text-sm">
                    <div className="flex-1">
                      <span className="font-medium">{entry.action}</span>
                      {entry.error && (
                        <span className="text-red-600 ml-2">({entry.error})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={entry.result === 'ok' ? "default" : "destructive"}>
                        {entry.result.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No recent activity</p>
                <p className="text-sm">Bridge calls will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dev Console - Shows last error to prevent blank page */}
      {(error || (reportError && !reportError.message.includes('HTTP 404'))) && (
        <div className="mt-4 p-2 bg-muted rounded text-xs text-muted-foreground border">
          <strong>Dev Console:</strong> {error || reportError?.message || 'No errors'}
        </div>
      )}
    </div>
  );
}