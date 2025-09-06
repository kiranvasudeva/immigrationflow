import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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

export default function QALivePage() {
  const [isRunning, setIsRunning] = useState(false);

  // Fetch last QA report
  const { data: qaReport, refetch: refetchReport, isLoading: reportLoading } = useQuery<QAReport>({
    queryKey: ['/qa/last-report'],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Fetch audit logs
  const { data: auditLogs, refetch: refetchAudit, isLoading: auditLoading } = useQuery<AuditEntry[]>({
    queryKey: ['/qa/audit-logs'],
    refetchInterval: 15000, // Auto-refresh every 15 seconds
  });

  const runQATests = async () => {
    setIsRunning(true);
    try {
      const response = await fetch('/qa/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // Refresh both report and audit logs
        await Promise.all([refetchReport(), refetchAudit()]);
      } else {
        console.error('Failed to run QA tests:', response.statusText);
      }
    } catch (error) {
      console.error('Error running QA tests:', error);
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
            ) : qaReport ? (
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
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No QA report available</p>
                <p className="text-sm">Run QA tests to generate a report</p>
              </div>
            )}
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
    </div>
  );
}