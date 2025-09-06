import { z } from 'zod';
import { Storage } from '../storage.js';

// Government status tracking service
// Manages government application statuses that are manually updated by users in the system
// No external API connections - all data is entered by admins, clients, and workers

// API Response schemas
const IgiStatusResponseSchema = z.object({
  applicationId: z.string(),
  status: z.enum(['SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED']),
  lastUpdated: z.string(),
  nextSteps: z.array(z.string()),
  estimatedCompletion: z.string().optional(),
  documents: z.array(z.object({
    name: z.string(),
    status: z.enum(['RECEIVED', 'VERIFIED', 'MISSING', 'REJECTED']),
    notes: z.string().optional()
  }))
});

const AjofmStatusResponseSchema = z.object({
  applicationId: z.string(),
  laborMarketTestStatus: z.enum(['PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED']),
  testResults: z.object({
    availableRomanians: z.number(),
    positionsOffered: z.number(),
    testDuration: z.string(),
    completedAt: z.string().optional()
  }).optional(),
  approvalNumber: z.string().optional(),
  validUntil: z.string().optional()
});

const ConsulateStatusResponseSchema = z.object({
  applicationId: z.string(),
  appointmentDate: z.string().optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']),
  visaStatus: z.enum(['PENDING', 'ISSUED', 'DENIED']).optional(),
  visaNumber: z.string().optional(),
  pickupDate: z.string().optional(),
  consulate: z.string()
});

export type IgiStatusResponse = z.infer<typeof IgiStatusResponseSchema>;
export type AjofmStatusResponse = z.infer<typeof AjofmStatusResponseSchema>;
export type ConsulateStatusResponse = z.infer<typeof ConsulateStatusResponseSchema>;

export class GovernmentStatusService {
  private storage: Storage;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  // IGI (Romanian Immigration Office) status from internal data
  async getIgiStatus(workerId: string): Promise<IgiStatusResponse | null> {
    try {
      // Get worker's workflow progress for IGI-related steps
      const workerProgress = await this.storage.getWorkerWorkflowProgress(workerId);
      const igiStep = workerProgress.find(p => p.stepId.includes('igi') || p.stepId.includes('work-permit'));
      
      if (!igiStep) {
        return null;
      }

      const response: IgiStatusResponse = {
        applicationId: igiStep.stepId,
        status: this.mapStepStatusToIgiStatus(igiStep.status),
        lastUpdated: igiStep.updatedAt.toISOString(),
        nextSteps: this.getNextStepsForStatus(igiStep.status),
        estimatedCompletion: igiStep.dueDate?.toISOString(),
        documents: igiStep.documents?.map(doc => ({
          name: doc.name,
          status: this.mapDocumentStatus(doc.status),
          notes: doc.notes
        })) || []
      };

      return IgiStatusResponseSchema.parse(response);
    } catch (error) {
      console.error('Error fetching IGI status:', error);
      throw new Error('Failed to fetch IGI application status');
    }
  }

  // AJOFM (Romanian Employment Agency) status from internal data
  async getAjofmStatus(workerId: string): Promise<AjofmStatusResponse | null> {
    try {
      // Get worker's workflow progress for AJOFM-related steps
      const workerProgress = await this.storage.getWorkerWorkflowProgress(workerId);
      const ajofmStep = workerProgress.find(p => p.stepId.includes('ajofm') || p.stepId.includes('labor-market'));
      
      if (!ajofmStep) {
        return null;
      }

      const response: AjofmStatusResponse = {
        applicationId: ajofmStep.stepId,
        laborMarketTestStatus: this.mapStepStatusToAjofmStatus(ajofmStep.status),
        testResults: ajofmStep.metadata ? {
          availableRomanians: ajofmStep.metadata.availableRomanians || 0,
          positionsOffered: ajofmStep.metadata.positionsOffered || 1,
          testDuration: ajofmStep.metadata.testDuration || '30 days',
          completedAt: ajofmStep.status === 'COMPLETED' ? ajofmStep.updatedAt.toISOString() : undefined
        } : undefined,
        approvalNumber: ajofmStep.status === 'COMPLETED' ? ajofmStep.metadata?.approvalNumber : undefined,
        validUntil: ajofmStep.status === 'COMPLETED' ? ajofmStep.metadata?.validUntil : undefined
      };

      return AjofmStatusResponseSchema.parse(response);
    } catch (error) {
      console.error('Error fetching AJOFM status:', error);
      throw new Error('Failed to fetch AJOFM application status');
    }
  }

  // Romanian Consulate status from internal data
  async getConsulateStatus(workerId: string, consulateCode: string): Promise<ConsulateStatusResponse | null> {
    try {
      // Get worker's workflow progress for consulate-related steps
      const workerProgress = await this.storage.getWorkerWorkflowProgress(workerId);
      const consulateStep = workerProgress.find(p => p.stepId.includes('consulate') || p.stepId.includes('visa'));
      
      if (!consulateStep) {
        return null;
      }

      const response: ConsulateStatusResponse = {
        applicationId: consulateStep.stepId,
        appointmentDate: consulateStep.metadata?.appointmentDate,
        status: this.mapStepStatusToConsulateStatus(consulateStep.status),
        visaStatus: consulateStep.metadata?.visaStatus,
        visaNumber: consulateStep.metadata?.visaNumber,
        pickupDate: consulateStep.metadata?.pickupDate,
        consulate: this.getConsulateName(consulateCode)
      };

      return ConsulateStatusResponseSchema.parse(response);
    } catch (error) {
      console.error('Error fetching Consulate status:', error);
      throw new Error('Failed to fetch Consulate application status');
    }
  }

  // Combined status check for all systems based on internal data
  async getComprehensiveStatus(workerId: string, consulateCode?: string) {
    const results: {
      igi?: IgiStatusResponse;
      ajofm?: AjofmStatusResponse;
      consulate?: ConsulateStatusResponse;
    } = {};

    try {
      // Get all statuses for the worker
      const igiStatus = await this.getIgiStatus(workerId);
      const ajofmStatus = await this.getAjofmStatus(workerId);
      const consulateStatus = consulateCode ? await this.getConsulateStatus(workerId, consulateCode) : null;

      if (igiStatus) results.igi = igiStatus;
      if (ajofmStatus) results.ajofm = ajofmStatus;
      if (consulateStatus) results.consulate = consulateStatus;

      return results;
    } catch (error) {
      console.error('Error fetching comprehensive status:', error);
      throw new Error('Failed to fetch comprehensive application status');
    }
  }

  // Helper methods for mapping internal data to government status formats
  private mapStepStatusToIgiStatus(status: string): IgiStatusResponse['status'] {
    // Using database schema stepStatusEnum values: PENDING, IN_PROGRESS, COMPLETED, REJECTED, SKIPPED
    switch (status) {
      case 'PENDING': return 'SUBMITTED';
      case 'IN_PROGRESS': return 'IN_REVIEW';
      case 'COMPLETED': return 'APPROVED';
      case 'REJECTED': return 'REJECTED';
      case 'SKIPPED': return 'APPROVED'; // Treat skipped as approved
      default: return 'SUBMITTED';
    }
  }

  private mapStepStatusToAjofmStatus(status: string): AjofmStatusResponse['laborMarketTestStatus'] {
    // Using database schema stepStatusEnum values: PENDING, IN_PROGRESS, COMPLETED, REJECTED, SKIPPED
    switch (status) {
      case 'PENDING': return 'PENDING';
      case 'IN_PROGRESS': return 'IN_PROGRESS';
      case 'COMPLETED': return 'APPROVED';
      case 'REJECTED': return 'REJECTED';
      case 'SKIPPED': return 'APPROVED'; // Treat skipped as approved
      default: return 'PENDING';
    }
  }

  private mapStepStatusToConsulateStatus(status: string): ConsulateStatusResponse['status'] {
    // Using database schema stepStatusEnum values: PENDING, IN_PROGRESS, COMPLETED, REJECTED, SKIPPED
    switch (status) {
      case 'PENDING': return 'SCHEDULED';
      case 'IN_PROGRESS': return 'SCHEDULED';
      case 'COMPLETED': return 'COMPLETED';
      case 'REJECTED': return 'CANCELLED';
      case 'SKIPPED': return 'COMPLETED'; // Treat skipped as completed
      default: return 'SCHEDULED';
    }
  }

  private mapDocumentStatus(status: string): 'RECEIVED' | 'VERIFIED' | 'MISSING' | 'REJECTED' {
    switch (status) {
      case 'UPLOADED': return 'RECEIVED';
      case 'APPROVED': return 'VERIFIED';
      case 'REJECTED': return 'REJECTED';
      default: return 'MISSING';
    }
  }

  private getNextStepsForStatus(status: string): string[] {
    // Using database schema stepStatusEnum values: PENDING, IN_PROGRESS, COMPLETED, REJECTED, SKIPPED
    switch (status) {
      case 'PENDING':
        return ['Submit required documents', 'Complete application form'];
      case 'IN_PROGRESS':
        return ['Monitor application status', 'Respond to any requests'];
      case 'COMPLETED':
        return ['Collect documents', 'Proceed to next step'];
      case 'REJECTED':
        return ['Review rejection reasons', 'Resubmit application'];
      case 'SKIPPED':
        return ['Proceed to next step'];
      default:
        return [];
    }
  }

  private getConsulateName(code: string): string {
    const consulates: Record<string, string> = {
      'BUC': 'Romanian Consulate - Bucharest',
      'LON': 'Romanian Consulate - London',
      'PAR': 'Romanian Consulate - Paris',
      'BER': 'Romanian Consulate - Berlin',
      'ROM': 'Romanian Consulate - Rome',
      'MAD': 'Romanian Consulate - Madrid'
    };
    return consulates[code] || 'Romanian Consulate';
  }
}

// Export factory function for dependency injection
export function createGovernmentStatusService(storage: Storage) {
  return new GovernmentStatusService(storage);
}