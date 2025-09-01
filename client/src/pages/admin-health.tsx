import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, RefreshCw, CheckCircle2, XCircle, AlertCircle, Settings, Database, Shield, Workflow, Monitor, Cloud } from 'lucide-react';
import { useTranslation } from '@/contexts/I18nProvider';

interface HealthTest {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface TestResult {
  testId: string;
  success: boolean;
  message: string;
  details?: any;
  error?: string;
  timestamp: string;
}

interface TestLog {
  id: string;
  testId: string;
  message: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
}

export default function AdminHealthPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [results, setResults] = useState<TestResult[]>([]);
  const [logs, setLogs] = useState<TestLog[]>([]);
  const [progress, setProgress] = useState(0);

  // Get available health tests
  const { data: healthTests = [], isLoading: loadingTests } = useQuery({
    queryKey: ['/api/admin/health/tests'],
    enabled: true
  });

  // Run individual test mutation
  const runTestMutation = useMutation({
    mutationFn: async (testId: string) => {
      const response = await fetch(`/api/admin/health/run-test/${testId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to run test');
      return response.json();
    }
  });

  // Run all tests mutation
  const runAllTestsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/health/run-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to run tests');
      return response.json();
    }
  });

  // Fix issues mutation
  const fixIssuesMutation = useMutation({
    mutationFn: async (issues: string[]) => {
      const response = await fetch('/api/admin/health/fix-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issues })
      });
      if (!response.ok) throw new Error('Failed to fix issues');
      return response.json();
    }
  });

  const addLog = (testId: string, message: string, level: 'info' | 'success' | 'warning' | 'error') => {
    const log: TestLog = {
      id: Date.now().toString(),
      testId,
      message,
      timestamp: new Date().toISOString(),
      level
    };
    setLogs(prev => [...prev, log]);
  };

  const runSingleTest = async (test: HealthTest) => {
    if (isPaused) return;

    addLog(test.id, `Starting ${test.name}...`, 'info');
    
    try {
      const result = await runTestMutation.mutateAsync(test.id);
      setResults(prev => [...prev, result]);
      
      if (result.success) {
        addLog(test.id, `✓ ${test.name} completed successfully`, 'success');
      } else {
        addLog(test.id, `✗ ${test.name} failed: ${result.message}`, 'error');
        setIsPaused(true);
        addLog('system', 'Test execution paused due to failure. Click "Resume" to continue after fixing issues.', 'warning');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(test.id, `✗ ${test.name} error: ${errorMessage}`, 'error');
      setIsPaused(true);
      addLog('system', 'Test execution paused due to error. Click "Resume" to continue after fixing issues.', 'warning');
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setIsPaused(false);
    setResults([]);
    setLogs([]);
    setCurrentTestIndex(0);
    setProgress(0);

    addLog('system', 'Starting comprehensive health check...', 'info');

    for (let i = 0; i < healthTests.length; i++) {
      if (isPaused) break;
      
      setCurrentTestIndex(i);
      setProgress((i / healthTests.length) * 100);
      
      await runSingleTest(healthTests[i]);
      
      if (isPaused) break;
    }

    if (!isPaused) {
      setProgress(100);
      addLog('system', 'All health checks completed successfully!', 'success');
    }
    
    setIsRunning(false);
  };

  const resumeTests = () => {
    setIsPaused(false);
    addLog('system', 'Resuming test execution...', 'info');
    
    // Continue from where we left off
    const remainingTests = healthTests.slice(currentTestIndex + 1);
    if (remainingTests.length > 0) {
      runRemainingTests(remainingTests);
    } else {
      setIsRunning(false);
      addLog('system', 'All tests completed.', 'info');
    }
  };

  const runRemainingTests = async (remainingTests: HealthTest[]) => {
    setIsRunning(true);
    
    for (let i = 0; i < remainingTests.length; i++) {
      if (isPaused) break;
      
      const testIndex = currentTestIndex + 1 + i;
      setCurrentTestIndex(testIndex);
      setProgress((testIndex / healthTests.length) * 100);
      
      await runSingleTest(remainingTests[i]);
      
      if (isPaused) break;
    }

    if (!isPaused) {
      setProgress(100);
      addLog('system', 'All health checks completed!', 'success');
    }
    
    setIsRunning(false);
  };

  const performSystemWideFixes = async () => {
    const failedTests = results.filter(r => !r.success);
    const issues = failedTests.map(r => r.message);
    
    addLog('system', 'Performing system-wide fixes...', 'info');
    
    try {
      const fixResult = await fixIssuesMutation.mutateAsync(issues);
      if (fixResult.success) {
        addLog('system', 'System fixes completed successfully', 'success');
        // Clear results to allow re-running tests
        setResults([]);
        setCurrentTestIndex(0);
        setProgress(0);
      } else {
        addLog('system', `Fix attempt failed: ${fixResult.message}`, 'error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog('system', `Fix error: ${errorMessage}`, 'error');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Infrastructure': return <Database className="h-4 w-4" />;
      case 'API': return <Monitor className="h-4 w-4" />;
      case 'Data': return <Database className="h-4 w-4" />;
      case 'Security': return <Shield className="h-4 w-4" />;
      case 'Workflow': return <Workflow className="h-4 w-4" />;
      case 'Services': return <Cloud className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getTestStatus = (testId: string) => {
    const result = results.find(r => r.testId === testId);
    if (!result) return 'pending';
    return result.success ? 'success' : 'failed';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Passed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'running':
        return <Badge variant="secondary"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Running</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const hasFailedTests = results.some(r => !r.success);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Health Checkup</h1>
          <p className="text-muted-foreground">
            Comprehensive testing and validation of all system components
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {hasFailedTests && !isRunning && (
            <Button 
              variant="secondary" 
              onClick={performSystemWideFixes}
              disabled={fixIssuesMutation.isPending}
              data-testid="button-fix-issues"
            >
              <Settings className="h-4 w-4 mr-2" />
              {fixIssuesMutation.isPending ? 'Fixing...' : 'Auto-Fix Issues'}
            </Button>
          )}
          
          {isPaused ? (
            <Button 
              onClick={resumeTests}
              disabled={isRunning && !isPaused}
              data-testid="button-resume-tests"
            >
              <Play className="h-4 w-4 mr-2" />
              Resume Tests
            </Button>
          ) : (
            <Button 
              onClick={runAllTests}
              disabled={isRunning || loadingTests}
              data-testid="button-run-tests"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run All Tests
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {isRunning && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Test Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Test {currentTestIndex + 1} of {healthTests.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              {isPaused && (
                <div className="flex items-center gap-2 text-yellow-600">
                  <Pause className="h-4 w-4" />
                  <span className="text-sm">Tests paused - fix issues and click Resume</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Execution Grid */}
      <div className="space-y-4">
        {healthTests.map((test: HealthTest, index: number) => {
          const status = index < currentTestIndex ? getTestStatus(test.id) : 
                        index === currentTestIndex && isRunning ? 'running' : 'pending';
          const testResult = results.find(r => r.testId === test.id);
          const testLogs = logs.filter(log => log.testId === test.id || log.testId === 'system');
          const hasErrors = testResult && !testResult.success;
          
          return (
            <Card 
              key={test.id}
              className={`${hasErrors ? 'border-red-200 bg-red-50' : ''}`}
              data-testid={`test-card-${test.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getCategoryIcon(test.category)}
                    <div>
                      <CardTitle className="text-lg">{test.name}</CardTitle>
                      <CardDescription>{test.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{test.category}</Badge>
                    {getStatusBadge(status)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Test Details and Actions */}
                  <div className="space-y-3">
                    {testResult && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Test Result:</h4>
                        <div className={`p-3 rounded-lg ${testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          <p className="text-sm">{testResult.message}</p>
                          {testResult.error && (
                            <p className="text-xs mt-1 font-mono">{testResult.error}</p>
                          )}
                        </div>
                        
                        {hasErrors && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => runSingleTest(test)}
                              disabled={isRunning}
                              data-testid={`button-retry-${test.id}`}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Retry Test
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => performSystemWideFixes()}
                              disabled={fixIssuesMutation.isPending}
                              data-testid={`button-fix-${test.id}`}
                            >
                              <Settings className="h-3 w-3 mr-1" />
                              {fixIssuesMutation.isPending ? 'Fixing...' : 'Auto-Fix'}
                            </Button>
                          </div>
                        )}
                        
                        {testResult.details && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                              View Technical Details
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto text-xs">
                              {JSON.stringify(testResult.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    )}
                    
                    {!testResult && status === 'pending' && (
                      <div className="p-3 bg-gray-100 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Test will run when you click "Run All Tests" or when previous tests complete.
                        </p>
                        <Button 
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={() => runSingleTest(test)}
                          disabled={isRunning}
                          data-testid={`button-run-single-${test.id}`}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Run This Test
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Test Logs */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Test Logs:</h4>
                    <ScrollArea className="h-[200px] w-full border rounded-lg p-2">
                      <div className="space-y-1">
                        {testLogs.length === 0 ? (
                          <div className="text-center text-muted-foreground py-4 text-xs">
                            No logs for this test yet
                          </div>
                        ) : (
                          testLogs.map((log, logIndex) => (
                            <div 
                              key={`${log.id}-${logIndex}`}
                              className="text-xs space-y-1"
                              data-testid={`log-entry-${test.id}-${logIndex}`}
                            >
                              <div className="flex items-start gap-2">
                                <span className="text-muted-foreground min-w-[50px]">
                                  {new Date(log.timestamp).toLocaleTimeString()}
                                </span>
                                <span className={`flex-1 ${getLogLevelColor(log.level)}`}>
                                  {log.message}
                                </span>
                              </div>
                              {logIndex < testLogs.length - 1 && <Separator className="my-1" />}
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

    </div>
  );
}