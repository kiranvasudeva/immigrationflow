import { useState, useEffect, useRef } from 'react';
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
  const consoleRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll console to bottom when new logs are added
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

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
      const hasAnyFailures = results.some(r => !r.success);
      if (hasAnyFailures) {
        addLog('system', 'Health checks completed with issues detected.', 'warning');
      } else {
        addLog('system', 'All health checks completed successfully!', 'success');
      }
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
      const hasAnyFailures = results.some(r => !r.success);
      if (hasAnyFailures) {
        addLog('system', 'All tests completed with issues detected.', 'warning');
      } else {
        addLog('system', 'All tests completed successfully!', 'success');
      }
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
      const hasAnyFailures = results.some(r => !r.success);
      if (hasAnyFailures) {
        addLog('system', 'Remaining health checks completed with issues detected.', 'warning');
      } else {
        addLog('system', 'All remaining health checks completed successfully!', 'success');
      }
    }
    
    setIsRunning(false);
  };

  const performSystemWideFixes = async () => {
    const failedTests = results.filter(r => !r.success);
    const issues = failedTests.map(r => r.message);
    
    addLog('system', '🔧 Starting automatic system repair...', 'info');
    addLog('system', `Found ${failedTests.length} failed tests to repair`, 'info');
    
    try {
      const fixResult = await fixIssuesMutation.mutateAsync(issues);
      
      if (fixResult.success) {
        addLog('system', '✅ System repairs completed successfully!', 'success');
        if (fixResult.fixes && fixResult.fixes.length > 0) {
          fixResult.fixes.forEach((fix: string) => {
            addLog('system', `  ✓ ${fix}`, 'success');
          });
        }
        // Clear results to allow re-running tests
        setResults([]);
        setCurrentTestIndex(0);
        setProgress(0);
      } else {
        addLog('system', `❌ Fix attempt failed: ${fixResult.message}`, 'error');
        
        // Show detailed error information
        if (fixResult.errors && fixResult.errors.length > 0) {
          addLog('system', '📋 Detailed error breakdown:', 'warning');
          fixResult.errors.forEach((error: string, index: number) => {
            addLog('system', `  ${index + 1}. ${error}`, 'error');
          });
        }
        
        if (fixResult.fixes && fixResult.fixes.length > 0) {
          addLog('system', '✅ Partial fixes applied:', 'warning');
          fixResult.fixes.forEach((fix: string) => {
            addLog('system', `  ✓ ${fix}`, 'success');
          });
        }
        
        if (fixResult.summary) {
          addLog('system', `📊 Summary: ${fixResult.summary.totalFixes} fixes, ${fixResult.summary.totalErrors} errors, ${fixResult.summary.repairTime}`, 'info');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog('system', `💥 Critical fix error: ${errorMessage}`, 'error');
      addLog('system', 'Try running individual tests to identify specific issues', 'warning');
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
          <Button 
            variant="secondary" 
            onClick={performSystemWideFixes}
            disabled={fixIssuesMutation.isPending || (!hasFailedTests && results.length === 0)}
            data-testid="button-fix-issues"
            title={!hasFailedTests && results.length === 0 ? "Run tests first to identify issues to fix" : "Automatically fix detected system issues"}
          >
            <Settings className="h-4 w-4 mr-2" />
            {fixIssuesMutation.isPending ? 'Fixing...' : 'Auto-Fix Issues'}
          </Button>
          
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

      {/* New Layout: Tests List + Unified Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tests List (Left Side) */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Tests</CardTitle>
              <CardDescription>Click on any test to view details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {healthTests.map((test: HealthTest, index: number) => {
                const status = index < currentTestIndex ? getTestStatus(test.id) : 
                              index === currentTestIndex && isRunning ? 'running' : 'pending';
                const testResult = results.find(r => r.testId === test.id);
                const hasErrors = testResult && !testResult.success;
                
                return (
                  <div 
                    key={test.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                      hasErrors ? 'border-red-200 bg-red-50' : 
                      testResult?.success ? 'border-green-200 bg-green-50' : 
                      'border-gray-200'
                    }`}
                    data-testid={`test-item-${test.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(test.category)}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{test.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{test.description}</p>
                        </div>
                      </div>
                      <div className="ml-2">
                        {getStatusBadge(status)}
                      </div>
                    </div>
                    
                    {testResult && (
                      <div className="mt-2">
                        <div className={`p-2 rounded text-xs ${
                          testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {testResult.message}
                        </div>
                        
                        {hasErrors && (
                          <div className="flex gap-1 mt-2">
                            <Button 
                              size="sm"
                              variant="outline"
                              className="h-6 text-xs px-2"
                              onClick={() => runSingleTest(test)}
                              disabled={isRunning}
                              data-testid={`button-retry-${test.id}`}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Retry
                            </Button>
                            <Button 
                              size="sm"
                              className="h-6 text-xs px-2"
                              onClick={() => performSystemWideFixes()}
                              disabled={fixIssuesMutation.isPending}
                              data-testid={`button-fix-${test.id}`}
                            >
                              <Settings className="h-3 w-3 mr-1" />
                              Fix
                            </Button>
                          </div>
                        )}
                        
                        {testResult.details && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                              Technical Details
                            </summary>
                            <pre className="mt-1 p-2 bg-gray-100 rounded overflow-auto text-xs max-h-32">
                              {JSON.stringify(testResult.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    )}
                    
                    {!testResult && status === 'pending' && (
                      <Button 
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs px-2 mt-2"
                        onClick={() => runSingleTest(test)}
                        disabled={isRunning}
                        data-testid={`button-run-single-${test.id}`}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Run
                      </Button>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
        
        {/* Unified Console (Right Side) */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                System Console
              </CardTitle>
              <CardDescription>Real-time output from all tests and system operations</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] w-full border rounded-lg p-4">
                <div ref={consoleRef} className="space-y-2">
                  {logs.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <Monitor className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No console output yet</p>
                      <p className="text-xs">Run tests to see detailed execution logs</p>
                    </div>
                  ) : (
                    logs.map((log, logIndex) => (
                      <div 
                        key={`${log.id}-${logIndex}`}
                        className="font-mono text-sm border-l-2 pl-3 py-1 transition-colors hover:bg-gray-50"
                        style={{
                          borderLeftColor: 
                            log.level === 'success' ? '#22c55e' :
                            log.level === 'error' ? '#ef4444' :
                            log.level === 'warning' ? '#f59e0b' : '#6b7280'
                        }}
                        data-testid={`console-log-${logIndex}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-muted-foreground text-xs min-w-[80px]">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="text-xs text-muted-foreground min-w-[80px]">
                            [{log.testId === 'system' ? 'SYSTEM' : log.testId.toUpperCase()}]
                          </span>
                          <span className={`flex-1 ${getLogLevelColor(log.level)}`}>
                            {log.message}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
              
              {logs.length > 0 && (
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <span className="text-xs text-muted-foreground">
                    {logs.length} log entries
                  </span>
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => setLogs([])}
                    data-testid="button-clear-console"
                  >
                    Clear Console
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}