import { useState } from 'react';
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

export default function QADashboard() {
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<QAReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runQATests = async () => {
    setIsRunning(true);
    setError(null);
    
    try {
      // Generate required headers for bridge authentication
      const timestamp = Date.now().toString();
      const nonce = `web-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const bridgeToken = 'abcd1234'; // Using environment token
      
      const response = await fetch('/qa/bridge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bridgeToken}`,
          'X-Timestamp': timestamp,
          'X-Nonce': nonce,
        },
        body: JSON.stringify({ action: 'qaTests' })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.ok && result.data) {
          setReport(result.data);
        } else {
          setError('QA tests failed to run properly');
        }
      } else {
        const errorData = await response.json();
        setError(`Failed to run tests: ${errorData.error?.message || response.statusText}`);
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="page-qa-dashboard">
      {/* Warning Banner */}
      <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800 dark:text-yellow-200 font-semibold text-lg">
          ⚠️ DEV-ONLY — UNSECURED
        </AlertDescription>
      </Alert>

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">QA Dashboard</h1>
        <Button 
          onClick={runQATests} 
          disabled={isRunning}
          className="flex items-center gap-2"
          data-testid="button-run-qa-tests"
        >
          {isRunning ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {isRunning ? 'Running Tests...' : 'Run QA Tests'}
        </Button>
      </div>

      {error && (
        <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {report && (
        <div className="space-y-6">
          {/* Test Results Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                QA Test Results
                <div className="flex gap-2">
                  <Badge variant={report.failed === 0 ? "default" : "destructive"}>
                    {report.passed}/{report.totalTests} PASSED
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatTimestamp(report.timestamp)}
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {report.tests.map((test, index) => (
                  <div 
                    key={index} 
                    className="flex justify-between items-center p-3 rounded border"
                    data-testid={`test-result-${index}`}
                  >
                    <div>
                      <span className="font-medium">{test.name}</span>
                      <div className="text-sm text-muted-foreground">{test.details}</div>
                    </div>
                    <Badge 
                      variant={test.status === 'PASS' ? "default" : "destructive"}
                      data-testid={`badge-${test.status.toLowerCase()}`}
                    >
                      {test.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Raw JSON Report */}
          <Card>
            <CardHeader>
              <CardTitle>Raw JSON Report</CardTitle>
            </CardHeader>
            <CardContent>
              <pre 
                className="bg-muted p-4 rounded text-xs overflow-auto max-h-96 whitespace-pre-wrap"
                data-testid="json-report"
              >
                {JSON.stringify(report, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}

      {!report && !isRunning && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground">
              <p className="text-lg">No QA report available</p>
              <p className="text-sm">Click "Run QA Tests" to generate a report</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}