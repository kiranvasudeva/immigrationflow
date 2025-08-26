import { z } from 'zod';

// Romanian government API integration service
// This is a simulation of real API integration with IGI, AJOFM, and consulate systems

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

export class GovernmentApiService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.GOVERNMENT_API_BASE_URL || 'https://api.simulation.gov.ro';
    this.apiKey = process.env.GOVERNMENT_API_KEY || 'simulation_key';
  }

  // IGI (Romanian Immigration Office) API integration
  async getIgiStatus(applicationId: string): Promise<IgiStatusResponse> {
    try {
      // Simulate API call with realistic response
      await this.delay(1000 + Math.random() * 2000); // Simulate network delay

      // Simulate different statuses based on application ID pattern
      const mockResponse: IgiStatusResponse = {
        applicationId,
        status: this.simulateIgiStatus(applicationId),
        lastUpdated: new Date().toISOString(),
        nextSteps: this.getIgiNextSteps(applicationId),
        estimatedCompletion: this.getEstimatedCompletion(),
        documents: this.simulateDocumentStatus()
      };

      return IgiStatusResponseSchema.parse(mockResponse);
    } catch (error) {
      console.error('Error fetching IGI status:', error);
      throw new Error('Failed to fetch IGI application status');
    }
  }

  // AJOFM (Romanian Employment Agency) API integration
  async getAjofmStatus(applicationId: string): Promise<AjofmStatusResponse> {
    try {
      await this.delay(800 + Math.random() * 1500);

      const mockResponse: AjofmStatusResponse = {
        applicationId,
        laborMarketTestStatus: this.simulateAjofmStatus(applicationId),
        testResults: this.simulateLaborMarketTest(applicationId),
        approvalNumber: this.simulateAjofmStatus(applicationId) === 'APPROVED' ? `AJOFM-${applicationId.slice(-6)}` : undefined,
        validUntil: this.simulateAjofmStatus(applicationId) === 'APPROVED' ? 
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : undefined
      };

      return AjofmStatusResponseSchema.parse(mockResponse);
    } catch (error) {
      console.error('Error fetching AJOFM status:', error);
      throw new Error('Failed to fetch AJOFM application status');
    }
  }

  // Romanian Consulate API integration
  async getConsulateStatus(applicationId: string, consulateCode: string): Promise<ConsulateStatusResponse> {
    try {
      await this.delay(600 + Math.random() * 1200);

      const mockResponse: ConsulateStatusResponse = {
        applicationId,
        appointmentDate: this.simulateAppointmentDate(),
        status: this.simulateConsulateStatus(applicationId),
        visaStatus: this.simulateVisaStatus(applicationId),
        visaNumber: this.simulateVisaStatus(applicationId) === 'ISSUED' ? `ROU${applicationId.slice(-8)}` : undefined,
        pickupDate: this.simulatePickupDate(),
        consulate: this.getConsulateName(consulateCode)
      };

      return ConsulateStatusResponseSchema.parse(mockResponse);
    } catch (error) {
      console.error('Error fetching Consulate status:', error);
      throw new Error('Failed to fetch Consulate application status');
    }
  }

  // Combined status check for all systems
  async getComprehensiveStatus(workerId: string, applicationIds: {
    igi?: string;
    ajofm?: string;
    consulate?: { id: string; code: string };
  }) {
    const results: {
      igi?: IgiStatusResponse;
      ajofm?: AjofmStatusResponse;
      consulate?: ConsulateStatusResponse;
    } = {};

    try {
      const promises = [];

      if (applicationIds.igi) {
        promises.push(
          this.getIgiStatus(applicationIds.igi).then(status => ({ type: 'igi', status }))
        );
      }

      if (applicationIds.ajofm) {
        promises.push(
          this.getAjofmStatus(applicationIds.ajofm).then(status => ({ type: 'ajofm', status }))
        );
      }

      if (applicationIds.consulate) {
        promises.push(
          this.getConsulateStatus(applicationIds.consulate.id, applicationIds.consulate.code)
            .then(status => ({ type: 'consulate', status }))
        );
      }

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        if (response.type === 'igi') results.igi = response.status as IgiStatusResponse;
        if (response.type === 'ajofm') results.ajofm = response.status as AjofmStatusResponse;
        if (response.type === 'consulate') results.consulate = response.status as ConsulateStatusResponse;
      });

      return results;
    } catch (error) {
      console.error('Error fetching comprehensive status:', error);
      throw new Error('Failed to fetch comprehensive application status');
    }
  }

  // Helper methods for simulation
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private simulateIgiStatus(applicationId: string): IgiStatusResponse['status'] {
    const hash = this.hashCode(applicationId);
    const statuses: IgiStatusResponse['status'][] = ['SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED'];
    return statuses[Math.abs(hash) % statuses.length];
  }

  private simulateAjofmStatus(applicationId: string): AjofmStatusResponse['laborMarketTestStatus'] {
    const hash = this.hashCode(applicationId);
    const statuses: AjofmStatusResponse['laborMarketTestStatus'][] = ['PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED'];
    return statuses[Math.abs(hash) % statuses.length];
  }

  private simulateConsulateStatus(applicationId: string): ConsulateStatusResponse['status'] {
    const hash = this.hashCode(applicationId);
    const statuses: ConsulateStatusResponse['status'][] = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'];
    return statuses[Math.abs(hash) % statuses.length];
  }

  private simulateVisaStatus(applicationId: string): ConsulateStatusResponse['visaStatus'] {
    const hash = this.hashCode(applicationId);
    const statuses: ConsulateStatusResponse['visaStatus'][] = ['PENDING', 'ISSUED', 'DENIED'];
    return statuses[Math.abs(hash) % statuses.length];
  }

  private simulateLaborMarketTest(applicationId: string) {
    if (this.simulateAjofmStatus(applicationId) === 'PENDING') return undefined;
    
    return {
      availableRomanians: Math.floor(Math.random() * 10),
      positionsOffered: Math.floor(Math.random() * 5) + 1,
      testDuration: '30 days',
      completedAt: this.simulateAjofmStatus(applicationId) === 'APPROVED' || this.simulateAjofmStatus(applicationId) === 'REJECTED' ? 
        new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined
    };
  }

  private simulateDocumentStatus() {
    const documents = [
      'Passport Copy',
      'Employment Contract',
      'Academic Qualifications',
      'Medical Certificate',
      'Criminal Record Certificate'
    ];
    
    return documents.map(name => ({
      name,
      status: (['RECEIVED', 'VERIFIED', 'MISSING', 'REJECTED'] as const)[Math.floor(Math.random() * 4)],
      notes: Math.random() > 0.7 ? 'Document requires additional verification' : undefined
    }));
  }

  private getIgiNextSteps(applicationId: string): string[] {
    const status = this.simulateIgiStatus(applicationId);
    const steps: Record<IgiStatusResponse['status'], string[]> = {
      'SUBMITTED': ['Wait for initial review', 'Prepare for interview if requested'],
      'IN_REVIEW': ['Provide additional documents if requested', 'Check status weekly'],
      'APPROVED': ['Collect work permit', 'Register with local authorities'],
      'REJECTED': ['Review rejection reasons', 'Prepare appeal if applicable'],
      'EXPIRED': ['Submit new application', 'Update all documents']
    };
    return steps[status] || [];
  }

  private simulateAppointmentDate(): string {
    return new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString();
  }

  private simulatePickupDate(): string {
    return new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString();
  }

  private getEstimatedCompletion(): string {
    return new Date(Date.now() + (30 + Math.random() * 90) * 24 * 60 * 60 * 1000).toISOString();
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

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }
}

export const governmentApiService = new GovernmentApiService();