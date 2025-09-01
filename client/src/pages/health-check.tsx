import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, AlertCircle, Play, Loader2, FileText, Shield, Database, Globe } from 'lucide-react';
import { useI18n } from '@/contexts/I18nProvider';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  message?: string;
  duration?: number;
  details?: any;
}

interface TestCategory {
  name: string;
  description: string;
  tests: TestResult[];
  icon: any;
}

export default function HealthCheck() {
  const { t } = useI18n();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [testCategories, setTestCategories] = useState<TestCategory[]>([
    {
      name: 'Unit & Integration Tests',
      description: '16 test files with 26+ individual tests',
      icon: FileText,
      tests: [
        { name: 'API Integration Tests', status: 'pending' },
        { name: 'Security RBAC Tests', status: 'pending' },
        { name: 'Data Validation Tests', status: 'pending' },
        { name: 'Frontend-Backend Integration', status: 'pending' },
        { name: 'Authentication & Authorization', status: 'pending' },
        { name: 'File Upload Security', status: 'pending' },
        { name: 'Email & Reminder Systems', status: 'pending' },
        { name: 'PDF Generation', status: 'pending' },
        { name: 'Background Job Processing', status: 'pending' },
        { name: 'End-to-End Workflows', status: 'pending' }
      ]
    },
    {
      name: 'Validation Scripts',
      description: '19 comprehensive validation scripts',
      icon: Shield,
      tests: [
        { name: 'Thorough Validation Test (1440 lines)', status: 'pending' },
        { name: 'Comprehensive Browser Test', status: 'pending' },
        { name: 'Comprehensive UI Test', status: 'pending' },
        { name: 'Authenticated UI Test', status: 'pending' },
        { name: 'HTTP Frontend Test', status: 'pending' },
        { name: 'Puppeteer Frontend Test', status: 'pending' },
        { name: 'Quick UI Validation', status: 'pending' },
        { name: 'Endpoint Mismatch Detection', status: 'pending' },
        { name: 'Mock Data Detection', status: 'pending' }
      ]
    },
    {
      name: 'Data Integrity',
      description: 'Database and storage validation',
      icon: Database,
      tests: [
        { name: 'No Mock Data Verification', status: 'pending' },
        { name: 'Database Schema Validation', status: 'pending' },
        { name: 'Foreign Key Constraints', status: 'pending' },
        { name: 'Data Consistency Check', status: 'pending' },
        { name: 'Storage Integrity', status: 'pending' }
      ]
    },
    {
      name: 'System Performance',
      description: 'Performance and response metrics',
      icon: Globe,
      tests: [
        { name: 'API Response Times', status: 'pending' },
        { name: 'Frontend Load Times', status: 'pending' },
        { name: 'Database Query Performance', status: 'pending' },
        { name: 'Memory Usage', status: 'pending' },
        { name: 'Network Latency', status: 'pending' }
      ]
    }
  ]);

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    setLogs(prev => [`[${timestamp}] ${prefix} ${message}`, ...prev]);
  };

  const updateTestStatus = (categoryIndex: number, testIndex: number, status: TestResult['status'], message?: string) => {
    setTestCategories(prev => {
      const updated = [...prev];
      updated[categoryIndex].tests[testIndex] = {
        ...updated[categoryIndex].tests[testIndex],
        status,
        message
      };
      return updated;
    });
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setProgress(0);
    setLogs([]);
    addLog('Starting comprehensive system health check...', 'info');
    
    try {
      const response = await fetch('/api/health-check/run-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includeAllTests: true })
      });

      if (!response.ok) {
        throw new Error('Failed to start health check');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'progress') {
                  setProgress(data.progress);
                  setCurrentTest(data.currentTest);
                } else if (data.type === 'log') {
                  addLog(data.message, data.level);
                } else if (data.type === 'test-update') {
                  updateTestStatus(data.categoryIndex, data.testIndex, data.status, data.message);
                } else if (data.type === 'complete') {
                  addLog(`Health check complete! Passed: ${data.passed}/${data.total}`, 
                    data.passed === data.total ? 'success' : 'warning');
                }
              } catch (e) {
                console.error('Failed to parse SSE data:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      addLog(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running': return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'skipped': return <AlertCircle className="w-4 h-4 text-gray-400" />;
      default: return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants: Record<TestResult['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      running: 'secondary',
      passed: 'default',
      failed: 'destructive',
      skipped: 'outline'
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const totalTests = testCategories.reduce((sum, cat) => sum + cat.tests.length, 0);
  const passedTests = testCategories.reduce((sum, cat) => 
    sum + cat.tests.filter(t => t.status === 'passed').length, 0);
  const failedTests = testCategories.reduce((sum, cat) => 
    sum + cat.tests.filter(t => t.status === 'failed').length, 0);

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="page-health-check">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">System Health Check</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive validation suite with 35+ tests to ensure system integrity
          </p>
        </div>
        <Button 
          onClick={runAllTests} 
          disabled={isRunning}
          size="lg"
          data-testid="button-run-tests"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Run All Tests
            </>
          )}
        </Button>
      </div>

      {isRunning && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress: {Math.round(progress)}%</span>
                <span className="text-muted-foreground">{currentTest}</span>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tests</p>
                <p className="text-2xl font-bold" data-testid="text-total-tests">{totalTests}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Passed</p>
                <p className="text-2xl font-bold text-green-600" data-testid="text-passed-tests">{passedTests}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600" data-testid="text-failed-tests">{failedTests}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Test Categories</h2>
          {testCategories.map((category, catIndex) => {
            const Icon = category.icon;
            return (
              <Card key={catIndex} data-testid={`card-category-${catIndex}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {category.name}
                  </CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {category.tests.map((test, testIndex) => (
                      <div 
                        key={testIndex} 
                        className="flex items-center justify-between p-2 rounded hover:bg-muted/50"
                        data-testid={`test-item-${catIndex}-${testIndex}`}
                      >
                        <div className="flex items-center gap-2">
                          {getStatusIcon(test.status)}
                          <span className="text-sm">{test.name}</span>
                        </div>
                        {getStatusBadge(test.status)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Test Logs</h2>
          <Card className="h-[600px]">
            <CardContent className="p-0">
              <ScrollArea className="h-full p-4">
                <div className="space-y-1 font-mono text-sm">
                  {logs.length === 0 ? (
                    <p className="text-muted-foreground">No logs yet. Click "Run All Tests" to start.</p>
                  ) : (
                    logs.map((log, index) => (
                      <div key={index} className="text-xs" data-testid={`log-entry-${index}`}>
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}