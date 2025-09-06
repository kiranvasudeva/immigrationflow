// QA Report Cache Service
interface QAReport {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  tests: Array<{
    name: string;
    status: 'PASS' | 'FAIL';
    details: string;
  }>;
}

class QAReportCache {
  private lastReport: QAReport | null = null;

  setReport(report: QAReport): void {
    this.lastReport = report;
  }

  getReport(): QAReport | null {
    return this.lastReport;
  }

  hasReport(): boolean {
    return this.lastReport !== null;
  }
}

export const qaReportCache = new QAReportCache();
export type { QAReport };