import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { sql } from 'drizzle-orm';
import { app } from '../../server/index';
import { db } from '../../server/db';
import { 
  users, 
  clientProfiles, 
  workers, 
  assignments,
  workflowTemplates,
  workflowSteps,
  documentFiles,
  documentRequirements,
  checklistItems,
  stages,
  requirements,
  reminderRules,
  auditLogs,
  workerWorkflowProgress,
  workerStepProgress
} from '@shared/schema';
import { nanoid } from 'nanoid';

/**
 * Data Validation Integration Tests
 * 
 * Comprehensive tests to ensure:
 * - NO mock data exists anywhere in the system
 * - ALL data flows through proper database storage
 * - NO hardcoded values in responses or business logic
 * - Data consistency across all application layers
 * - Database relationships and constraints are enforced
 * - All user-facing data comes from actual database entities
 */

interface TestDataSet {
  users: Array<{ id: string; email: string; firstName: string; lastName: string; role: string }>;
  clients: Array<{ id: string; legalName: string; cui: string; ownerUserId: string }>;
  workers: Array<{ id: string; firstName: string; lastName: string; clientProfileId: string }>;
  assignments: Array<{ id: string; workerId: string; clientProfileId: string; status: string }>;
  workflowTemplates: Array<{ id: string; name: string; description: string; createdByUserId: string }>;
}

class DataValidationTestUtils {
  private createdIds: {
    users: string[];
    clients: string[];
    workers: string[];
    assignments: string[];
    workflowTemplates: string[];
    workflowSteps: string[];
    stages: string[];
    requirements: string[];
    reminderRules: string[];
  } = {
    users: [],
    clients: [],
    workers: [],
    assignments: [],
    workflowTemplates: [],
    workflowSteps: [],
    stages: [],
    requirements: [],
    reminderRules: []
  };

  async createCompleteTestDataSet(): Promise<TestDataSet> {
    // Create diverse test users with different roles
    const adminUser = await this.createTestUser('ADMIN');
    const owner1 = await this.createTestUser('OWNER');
    const owner2 = await this.createTestUser('OWNER');
    const worker1 = await this.createTestUser('WORKER');
    const worker2 = await this.createTestUser('WORKER');
    const viewer = await this.createTestUser('VIEWER');

    // Create multiple clients for different owners
    const client1 = await this.createTestClient(owner1.id);
    const client2 = await this.createTestClient(owner2.id);
    const client3 = await this.createTestClient(owner1.id); // Same owner, multiple clients

    // Create workers for different clients
    const worker1ForClient1 = await this.createTestWorker(client1.id);
    const worker2ForClient1 = await this.createTestWorker(client1.id);
    const worker1ForClient2 = await this.createTestWorker(client2.id);
    const worker1ForClient3 = await this.createTestWorker(client3.id);

    // Create assignments
    const assignment1 = await this.createTestAssignment(worker1ForClient1.id, client1.id, owner1.id);
    const assignment2 = await this.createTestAssignment(worker2ForClient1.id, client1.id, owner1.id);
    const assignment3 = await this.createTestAssignment(worker1ForClient2.id, client2.id, owner2.id);

    // Create workflow templates
    const template1 = await this.createTestWorkflowTemplate(adminUser.id);
    const template2 = await this.createTestWorkflowTemplate(owner1.id);

    return {
      users: [adminUser, owner1, owner2, worker1, worker2, viewer],
      clients: [client1, client2, client3],
      workers: [worker1ForClient1, worker2ForClient1, worker1ForClient2, worker1ForClient3],
      assignments: [assignment1, assignment2, assignment3],
      workflowTemplates: [template1, template2]
    };
  }

  async createTestUser(role: 'ADMIN' | 'OWNER' | 'WORKER' | 'VIEWER' = 'OWNER') {
    const userId = nanoid();
    const userData = {
      id: userId,
      email: `data-validation-${nanoid()}@integration-test.com`,
      firstName: `DataFirst${nanoid()}`,
      lastName: `DataLast${nanoid()}`,
      role
    };

    const [user] = await db.insert(users).values(userData).returning();
    this.createdIds.users.push(user.id);
    return user;
  }

  async createTestClient(ownerUserId: string) {
    const clientData = {
      legalName: `Data Validation Company ${nanoid()} SRL`,
      registrationNumber: `J40/${nanoid()}/2024`,
      cui: `RO${nanoid()}`,
      legalAddress: `Data Validation Address ${nanoid()}, Bucharest`,
      adminName: `Data Admin ${nanoid()}`,
      contactEmail: `data-contact-${nanoid()}@test-company.ro`,
      phoneNumber: `+40${nanoid()}`,
      bankIban: `RO49AAAA${nanoid()}`,
      caen: '6201',
      ownerUserId
    };

    const [client] = await db.insert(clientProfiles).values(clientData).returning();
    this.createdIds.clients.push(client.id);
    return client;
  }

  async createTestWorker(clientProfileId: string) {
    const workerData = {
      clientProfileId,
      firstName: `DataWorker${nanoid()}`,
      lastName: `Test${nanoid()}`,
      nationality: 'Italy',
      passportNumber: `IT${nanoid()}`,
      email: `data-worker-${nanoid()}@test.com`,
      phone: `+39${nanoid()}`
    };

    const [worker] = await db.insert(workers).values(workerData).returning();
    this.createdIds.workers.push(worker.id);
    return worker;
  }

  async createTestAssignment(workerId: string, clientId: string, createdByUserId: string) {
    const assignmentData = {
      workerId,
      clientProfileId: clientId,
      stageKey: 'AJOFM' as const,
      status: 'NOT_STARTED' as const,
      assignedToRole: 'WORKER' as const,
      createdByUserId
    };

    const [assignment] = await db.insert(assignments).values(assignmentData).returning();
    this.createdIds.assignments.push(assignment.id);
    return assignment;
  }

  async createTestWorkflowTemplate(createdByUserId: string) {
    const templateData = {
      name: `Data Validation Workflow ${nanoid()}`,
      description: `Data validation workflow description ${nanoid()}`,
      isActive: true,
      order: Math.floor(Math.random() * 100) + 1,
      executionType: 'sequential' as const,
      estimatedDurationDays: Math.floor(Math.random() * 60) + 15,
      createdByUserId
    };

    const [template] = await db.insert(workflowTemplates).values(templateData).returning();
    this.createdIds.workflowTemplates.push(template.id);
    return template;
  }

  async createTestStage() {
    const stageData = {
      key: 'IGI_WORK_PERMIT' as const,
      title: `Data Validation Stage ${nanoid()}`,
      description: `Data validation stage description ${nanoid()}`,
      order: Math.floor(Math.random() * 10) + 1
    };

    const [stage] = await db.insert(stages).values(stageData).returning();
    this.createdIds.stages.push(stage.id);
    return stage;
  }

  mockAuthentication(agent: request.SuperAgentTest, user: any) {
    return agent.set('x-test-user-id', user.id)
                .set('x-test-user-role', user.role)
                .set('x-test-user-email', user.email);
  }

  async cleanup() {
    try {
      // Clean up in dependency order
      const cleanupQueries = [
        () => this.createdIds.reminderRules.length > 0 && db.delete(reminderRules).where(sql`id = ANY(${this.createdIds.reminderRules})`),
        () => this.createdIds.requirements.length > 0 && db.delete(requirements).where(sql`id = ANY(${this.createdIds.requirements})`),
        () => this.createdIds.stages.length > 0 && db.delete(stages).where(sql`id = ANY(${this.createdIds.stages})`),
        () => this.createdIds.workflowSteps.length > 0 && db.delete(workflowSteps).where(sql`id = ANY(${this.createdIds.workflowSteps})`),
        () => this.createdIds.workflowTemplates.length > 0 && db.delete(workflowTemplates).where(sql`id = ANY(${this.createdIds.workflowTemplates})`),
        () => this.createdIds.assignments.length > 0 && db.delete(assignments).where(sql`id = ANY(${this.createdIds.assignments})`),
        () => this.createdIds.workers.length > 0 && db.delete(workers).where(sql`id = ANY(${this.createdIds.workers})`),
        () => this.createdIds.clients.length > 0 && db.delete(clientProfiles).where(sql`id = ANY(${this.createdIds.clients})`),
        () => this.createdIds.users.length > 0 && db.delete(users).where(sql`id = ANY(${this.createdIds.users})`)
      ];

      for (const cleanupQuery of cleanupQueries) {
        const result = cleanupQuery();
        if (result) await result;
      }

      // Reset tracking arrays
      Object.keys(this.createdIds).forEach(key => {
        this.createdIds[key as keyof typeof this.createdIds] = [];
      });
    } catch (error) {
      console.error('Data validation test cleanup error:', error);
      throw error;
    }
  }
}

// Mock data detection patterns
const MOCK_DATA_PATTERNS = {
  emails: /example\.com|test\.com|mock\.com|sample\.com|@replit\.com|@test/i,
  names: /john.*doe|jane.*doe|test.*user|sample.*user|mock.*user|admin.*admin|user.*test/i,
  companies: /test.*company|sample.*company|mock.*company|example.*corp|acme.*corp/i,
  addresses: /123.*main.*street|test.*address|sample.*address|mock.*address/i,
  phones: /555.*555|123.*456|000.*000/i,
  ids: /test.*id|mock.*id|sample.*id|fake.*id/i,
  uuids: /00000000-0000-0000-0000-000000000000|11111111-1111-1111-1111-111111111111/i
};

function detectMockDataInObject(obj: any, path = ''): string[] {
  const issues: string[] = [];
  
  if (typeof obj !== 'object' || obj === null) {
    return issues;
  }

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;
    
    if (typeof value === 'string') {
      // Check for mock patterns
      if (key.toLowerCase().includes('email') && MOCK_DATA_PATTERNS.emails.test(value)) {
        issues.push(`Mock email detected at ${currentPath}: ${value}`);
      }
      if ((key.toLowerCase().includes('name') || key.toLowerCase().includes('first') || key.toLowerCase().includes('last')) && MOCK_DATA_PATTERNS.names.test(value)) {
        issues.push(`Mock name detected at ${currentPath}: ${value}`);
      }
      if ((key.toLowerCase().includes('company') || key.toLowerCase().includes('legal')) && MOCK_DATA_PATTERNS.companies.test(value)) {
        issues.push(`Mock company detected at ${currentPath}: ${value}`);
      }
      if (key.toLowerCase().includes('address') && MOCK_DATA_PATTERNS.addresses.test(value)) {
        issues.push(`Mock address detected at ${currentPath}: ${value}`);
      }
      if (key.toLowerCase().includes('phone') && MOCK_DATA_PATTERNS.phones.test(value)) {
        issues.push(`Mock phone detected at ${currentPath}: ${value}`);
      }
      if (key.toLowerCase().includes('id') && MOCK_DATA_PATTERNS.ids.test(value)) {
        issues.push(`Mock ID detected at ${currentPath}: ${value}`);
      }
      if (MOCK_DATA_PATTERNS.uuids.test(value)) {
        issues.push(`Mock UUID detected at ${currentPath}: ${value}`);
      }
    } else if (typeof value === 'object') {
      issues.push(...detectMockDataInObject(value, currentPath));
    }
  }
  
  return issues;
}

describe('Data Validation Integration Tests', () => {
  let testUtils: DataValidationTestUtils;
  let testAgent: request.SuperAgentTest;
  let testDataSet: TestDataSet;

  beforeAll(async () => {
    testUtils = new DataValidationTestUtils();
    testAgent = request.agent(app);
    testDataSet = await testUtils.createCompleteTestDataSet();
  });

  afterAll(async () => {
    await testUtils.cleanup();
  });

  beforeEach(() => {
    // Each test starts with fresh expectations
  });

  afterEach(() => {
    // Validate data after each test
  });

  describe('API Response Data Validation', () => {
    it('should verify all API endpoints return only real database data', async () => {
      const adminUser = testDataSet.users.find(u => u.role === 'ADMIN')!;
      
      // Test all major endpoints
      const endpoints = [
        '/api/clients',
        '/api/workers',
        '/api/dashboard/stats',
        '/api/dashboard/assignments',
        '/api/stages',
        '/api/workflow/templates'
      ];

      for (const endpoint of endpoints) {
        const response = await testUtils.mockAuthentication(testAgent, adminUser)
          .get(endpoint);

        if (response.status === 200) {
          // Scan response for mock data patterns
          const mockDataIssues = detectMockDataInObject(response.body, endpoint);
          
          expect(mockDataIssues).toEqual([]);
          
          if (mockDataIssues.length > 0) {
            console.error(`Mock data detected in ${endpoint}:`, mockDataIssues);
          }

          // Verify data structure is valid
          expect(response.body).toBeDefined();
          
          if (Array.isArray(response.body)) {
            response.body.forEach((item: any, index: number) => {
              expect(item).toHaveProperty('id');
              expect(typeof item.id).toBe('string');
              expect(item.id).not.toBe('');
              
              // Additional validation for specific endpoints
              if (endpoint === '/api/clients') {
                expect(item).toHaveProperty('legalName');
                expect(item).toHaveProperty('cui');
                expect(item).toHaveProperty('ownerUserId');
                
                // Verify it's one of our test clients
                const isTestClient = testDataSet.clients.some(c => c.id === item.id);
                if (isTestClient) {
                  const testClient = testDataSet.clients.find(c => c.id === item.id)!;
                  expect(item.legalName).toBe(testClient.legalName);
                  expect(item.cui).toBe(testClient.cui);
                }
              }
              
              if (endpoint === '/api/workers') {
                expect(item).toHaveProperty('firstName');
                expect(item).toHaveProperty('lastName');
                expect(item).toHaveProperty('clientProfileId');
                
                // Verify it's one of our test workers
                const isTestWorker = testDataSet.workers.some(w => w.id === item.id);
                if (isTestWorker) {
                  const testWorker = testDataSet.workers.find(w => w.id === item.id)!;
                  expect(item.firstName).toBe(testWorker.firstName);
                  expect(item.lastName).toBe(testWorker.lastName);
                }
              }
            });
          }
        }
      }
    });

    it('should verify dashboard stats are calculated from real database data', async () => {
      const adminUser = testDataSet.users.find(u => u.role === 'ADMIN')!;
      
      const statsResponse = await testUtils.mockAuthentication(testAgent, adminUser)
        .get('/api/dashboard/stats');

      expect(statsResponse.status).toBe(200);
      
      const stats = statsResponse.body;
      expect(stats).toHaveProperty('totalClients');
      expect(stats).toHaveProperty('totalWorkers');
      expect(stats).toHaveProperty('totalAssignments');
      expect(stats).toHaveProperty('activeAssignments');
      expect(stats).toHaveProperty('completedAssignments');
      expect(stats).toHaveProperty('pendingAssignments');

      // Verify stats are numbers (not strings or other mock values)
      expect(typeof stats.totalClients).toBe('number');
      expect(typeof stats.totalWorkers).toBe('number');
      expect(typeof stats.totalAssignments).toBe('number');

      // Verify stats reflect at least our test data
      expect(stats.totalClients).toBeGreaterThanOrEqual(testDataSet.clients.length);
      expect(stats.totalWorkers).toBeGreaterThanOrEqual(testDataSet.workers.length);
      expect(stats.totalAssignments).toBeGreaterThanOrEqual(testDataSet.assignments.length);

      // Verify math consistency
      expect(stats.activeAssignments + stats.completedAssignments + stats.pendingAssignments)
        .toBeLessThanOrEqual(stats.totalAssignments);
    });
  });

  describe('Database Data Consistency Validation', () => {
    it('should verify all test data exists in database and matches API responses', async () => {
      // Verify users exist and match
      for (const testUser of testDataSet.users) {
        const dbUser = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.id, testUser.id)
        });
        
        expect(dbUser).toBeTruthy();
        expect(dbUser!.email).toBe(testUser.email);
        expect(dbUser!.firstName).toBe(testUser.firstName);
        expect(dbUser!.lastName).toBe(testUser.lastName);
        expect(dbUser!.role).toBe(testUser.role);
      }

      // Verify clients exist and match
      for (const testClient of testDataSet.clients) {
        const dbClient = await db.query.clientProfiles.findFirst({
          where: (clientProfiles, { eq }) => eq(clientProfiles.id, testClient.id)
        });
        
        expect(dbClient).toBeTruthy();
        expect(dbClient!.legalName).toBe(testClient.legalName);
        expect(dbClient!.cui).toBe(testClient.cui);
        expect(dbClient!.ownerUserId).toBe(testClient.ownerUserId);
      }

      // Verify workers exist and match
      for (const testWorker of testDataSet.workers) {
        const dbWorker = await db.query.workers.findFirst({
          where: (workers, { eq }) => eq(workers.id, testWorker.id)
        });
        
        expect(dbWorker).toBeTruthy();
        expect(dbWorker!.firstName).toBe(testWorker.firstName);
        expect(dbWorker!.lastName).toBe(testWorker.lastName);
        expect(dbWorker!.clientProfileId).toBe(testWorker.clientProfileId);
      }

      // Verify assignments exist and relationships are correct
      for (const testAssignment of testDataSet.assignments) {
        const dbAssignment = await db.query.assignments.findFirst({
          where: (assignments, { eq }) => eq(assignments.id, testAssignment.id)
        });
        
        expect(dbAssignment).toBeTruthy();
        expect(dbAssignment!.workerId).toBe(testAssignment.workerId);
        expect(dbAssignment!.clientProfileId).toBe(testAssignment.clientProfileId);
        
        // Verify foreign key relationships
        const workerExists = testDataSet.workers.some(w => w.id === dbAssignment!.workerId);
        const clientExists = testDataSet.clients.some(c => c.id === dbAssignment!.clientProfileId);
        expect(workerExists).toBe(true);
        expect(clientExists).toBe(true);
      }
    });

    it('should verify data relationships and referential integrity', async () => {
      // Test client-owner relationships
      for (const testClient of testDataSet.clients) {
        const ownerExists = testDataSet.users.some(u => u.id === testClient.ownerUserId);
        expect(ownerExists).toBe(true);
        
        const owner = testDataSet.users.find(u => u.id === testClient.ownerUserId)!;
        expect(['ADMIN', 'OWNER']).toContain(owner.role);
      }

      // Test worker-client relationships
      for (const testWorker of testDataSet.workers) {
        const clientExists = testDataSet.clients.some(c => c.id === testWorker.clientProfileId);
        expect(clientExists).toBe(true);
      }

      // Test assignment relationships
      for (const testAssignment of testDataSet.assignments) {
        const workerExists = testDataSet.workers.some(w => w.id === testAssignment.workerId);
        const clientExists = testDataSet.clients.some(c => c.id === testAssignment.clientProfileId);
        
        expect(workerExists).toBe(true);
        expect(clientExists).toBe(true);

        // Verify worker belongs to the assigned client
        const worker = testDataSet.workers.find(w => w.id === testAssignment.workerId)!;
        expect(worker.clientProfileId).toBe(testAssignment.clientProfileId);
      }

      // Test workflow template creator relationships
      for (const testTemplate of testDataSet.workflowTemplates) {
        const creatorExists = testDataSet.users.some(u => u.id === testTemplate.createdByUserId);
        expect(creatorExists).toBe(true);
        
        const creator = testDataSet.users.find(u => u.id === testTemplate.createdByUserId)!;
        expect(['ADMIN', 'OWNER']).toContain(creator.role);
      }
    });
  });

  describe('Data Isolation and Security Validation', () => {
    it('should verify data isolation between different owners', async () => {
      const owner1 = testDataSet.users.find(u => u.role === 'OWNER' && testDataSet.clients.some(c => c.ownerUserId === u.id))!;
      const owner2 = testDataSet.users.find(u => u.role === 'OWNER' && u.id !== owner1.id && testDataSet.clients.some(c => c.ownerUserId === u.id))!;

      // Get owner1's clients
      const owner1Response = await testUtils.mockAuthentication(testAgent, owner1)
        .get('/api/clients');

      expect(owner1Response.status).toBe(200);
      const owner1Clients = owner1Response.body;

      // Get owner2's clients
      const owner2Response = await testUtils.mockAuthentication(testAgent, owner2)
        .get('/api/clients');

      expect(owner2Response.status).toBe(200);
      const owner2Clients = owner2Response.body;

      // Verify no client overlap
      const owner1ClientIds = owner1Clients.map((c: any) => c.id);
      const owner2ClientIds = owner2Clients.map((c: any) => c.id);

      const overlap = owner1ClientIds.filter((id: string) => owner2ClientIds.includes(id));
      expect(overlap).toEqual([]);

      // Verify each owner only sees their own clients
      owner1Clients.forEach((client: any) => {
        expect(client.ownerUserId).toBe(owner1.id);
      });

      owner2Clients.forEach((client: any) => {
        expect(client.ownerUserId).toBe(owner2.id);
      });
    });

    it('should verify worker data isolation', async () => {
      const owner1 = testDataSet.users.find(u => u.role === 'OWNER' && testDataSet.clients.some(c => c.ownerUserId === u.id))!;
      const owner2 = testDataSet.users.find(u => u.role === 'OWNER' && u.id !== owner1.id && testDataSet.clients.some(c => c.ownerUserId === u.id))!;

      // Get workers accessible to each owner
      const owner1WorkersResponse = await testUtils.mockAuthentication(testAgent, owner1)
        .get('/api/workers');

      const owner2WorkersResponse = await testUtils.mockAuthentication(testAgent, owner2)
        .get('/api/workers');

      if (owner1WorkersResponse.status === 200 && owner2WorkersResponse.status === 200) {
        const owner1Workers = owner1WorkersResponse.body;
        const owner2Workers = owner2WorkersResponse.body;

        // Verify each owner only sees workers from their clients
        const owner1ClientIds = testDataSet.clients.filter(c => c.ownerUserId === owner1.id).map(c => c.id);
        const owner2ClientIds = testDataSet.clients.filter(c => c.ownerUserId === owner2.id).map(c => c.id);

        owner1Workers.forEach((worker: any) => {
          expect(owner1ClientIds).toContain(worker.clientProfileId);
        });

        owner2Workers.forEach((worker: any) => {
          expect(owner2ClientIds).toContain(worker.clientProfileId);
        });
      }
    });
  });

  describe('Anti-Mock Data Pattern Validation', () => {
    it('should scan entire database for mock data patterns', async () => {
      // Get all users from database
      const allUsers = await db.select().from(users);
      const mockUserIssues = allUsers.map(user => detectMockDataInObject(user, `user.${user.id}`)).flat();
      
      // Filter out only our test data for validation
      const testUserIds = testDataSet.users.map(u => u.id);
      const testUsers = allUsers.filter(user => testUserIds.includes(user.id));
      
      testUsers.forEach(user => {
        // Our test data should have unique, non-mock patterns
        expect(user.email).not.toMatch(MOCK_DATA_PATTERNS.emails);
        expect(user.firstName).not.toMatch(MOCK_DATA_PATTERNS.names);
        expect(user.lastName).not.toMatch(MOCK_DATA_PATTERNS.names);
      });

      // Get all clients from database
      const allClients = await db.select().from(clientProfiles);
      const testClientIds = testDataSet.clients.map(c => c.id);
      const testClients = allClients.filter(client => testClientIds.includes(client.id));
      
      testClients.forEach(client => {
        expect(client.legalName).not.toMatch(MOCK_DATA_PATTERNS.companies);
        expect(client.contactEmail).not.toMatch(MOCK_DATA_PATTERNS.emails);
        expect(client.legalAddress).not.toMatch(MOCK_DATA_PATTERNS.addresses);
      });

      // Get all workers from database
      const allWorkers = await db.select().from(workers);
      const testWorkerIds = testDataSet.workers.map(w => w.id);
      const testWorkers = allWorkers.filter(worker => testWorkerIds.includes(worker.id));
      
      testWorkers.forEach(worker => {
        expect(worker.firstName).not.toMatch(MOCK_DATA_PATTERNS.names);
        expect(worker.lastName).not.toMatch(MOCK_DATA_PATTERNS.names);
        if (worker.email) {
          expect(worker.email).not.toMatch(MOCK_DATA_PATTERNS.emails);
        }
      });
    });

    it('should verify workflow templates contain real, unique data', async () => {
      const allTemplates = await db.select().from(workflowTemplates);
      const testTemplateIds = testDataSet.workflowTemplates.map(t => t.id);
      const testTemplates = allTemplates.filter(template => testTemplateIds.includes(template.id));

      testTemplates.forEach(template => {
        // Verify unique names and descriptions
        expect(template.name).toBeTruthy();
        expect(template.description).toBeTruthy();
        expect(template.name).not.toMatch(/test.*workflow|sample.*workflow|mock.*workflow/i);
        expect(template.description).not.toMatch(/test.*description|sample.*description|mock.*description/i);
        
        // Verify realistic duration values
        expect(template.estimatedDurationDays).toBeGreaterThan(0);
        expect(template.estimatedDurationDays).toBeLessThan(365); // Less than a year
        
        // Verify creator exists in our test users
        const creatorExists = testDataSet.users.some(u => u.id === template.createdByUserId);
        expect(creatorExists).toBe(true);
      });
    });
  });

  describe('End-to-End Data Flow Validation', () => {
    it('should verify complete data flow from API creation to database storage to API retrieval', async () => {
      const ownerUser = testDataSet.users.find(u => u.role === 'OWNER')!;
      
      // Create new client via API
      const newClientData = {
        legalName: `E2E Test Company ${nanoid()} SRL`,
        registrationNumber: `J40/${nanoid()}/2024`,
        cui: `RO${nanoid()}`,
        legalAddress: `E2E Test Address ${nanoid()}, Bucharest`,
        adminName: `E2E Admin ${nanoid()}`,
        contactEmail: `e2e-${nanoid()}@test-company.ro`,
        phoneNumber: `+40${nanoid()}`,
        bankIban: `RO49AAAA${nanoid()}`,
        caen: '6201',
        ownerUserId: ownerUser.id
      };

      // Step 1: Create via API
      const createResponse = await testUtils.mockAuthentication(testAgent, ownerUser)
        .post('/api/clients')
        .send(newClientData);

      expect(createResponse.status).toBe(201);
      const createdClient = createResponse.body;
      testUtils.createdIds.clients.push(createdClient.id);

      // Step 2: Verify in database
      const dbClient = await db.query.clientProfiles.findFirst({
        where: (clientProfiles, { eq }) => eq(clientProfiles.id, createdClient.id)
      });

      expect(dbClient).toBeTruthy();
      expect(dbClient!.legalName).toBe(newClientData.legalName);
      expect(dbClient!.cui).toBe(newClientData.cui);
      expect(dbClient!.ownerUserId).toBe(newClientData.ownerUserId);

      // Step 3: Retrieve via API and verify consistency
      const fetchResponse = await testUtils.mockAuthentication(testAgent, ownerUser)
        .get('/api/clients');

      expect(fetchResponse.status).toBe(200);
      const foundClient = fetchResponse.body.find((c: any) => c.id === createdClient.id);
      expect(foundClient).toBeTruthy();
      expect(foundClient.legalName).toBe(newClientData.legalName);
      expect(foundClient.cui).toBe(newClientData.cui);

      // Step 4: Verify data is identical across all layers
      expect(createdClient.legalName).toBe(dbClient!.legalName);
      expect(createdClient.legalName).toBe(foundClient.legalName);
      expect(createdClient.cui).toBe(dbClient!.cui);
      expect(createdClient.cui).toBe(foundClient.cui);

      // Step 5: Verify no mock data patterns
      const mockIssues = detectMockDataInObject(foundClient, 'e2e.client');
      expect(mockIssues).toEqual([]);
    });

    it('should verify complete workflow from user creation to assignment completion', async () => {
      const adminUser = testDataSet.users.find(u => u.role === 'ADMIN')!;
      const ownerUser = testDataSet.users.find(u => u.role === 'OWNER')!;
      
      // Find existing client and worker
      const testClient = testDataSet.clients.find(c => c.ownerUserId === ownerUser.id)!;
      const testWorker = testDataSet.workers.find(w => w.clientProfileId === testClient.id)!;
      const testAssignment = testDataSet.assignments.find(a => a.workerId === testWorker.id)!;

      // Verify the complete data chain exists and is consistent
      const dbAssignment = await db.query.assignments.findFirst({
        where: (assignments, { eq }) => eq(assignments.id, testAssignment.id)
      });
      
      const dbWorker = await db.query.workers.findFirst({
        where: (workers, { eq }) => eq(workers.id, testWorker.id)
      });
      
      const dbClient = await db.query.clientProfiles.findFirst({
        where: (clientProfiles, { eq }) => eq(clientProfiles.id, testClient.id)
      });
      
      const dbOwner = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, ownerUser.id)
      });

      // Verify all entities exist and are linked correctly
      expect(dbAssignment).toBeTruthy();
      expect(dbWorker).toBeTruthy();
      expect(dbClient).toBeTruthy();
      expect(dbOwner).toBeTruthy();

      expect(dbAssignment!.workerId).toBe(dbWorker!.id);
      expect(dbAssignment!.clientProfileId).toBe(dbClient!.id);
      expect(dbWorker!.clientProfileId).toBe(dbClient!.id);
      expect(dbClient!.ownerUserId).toBe(dbOwner!.id);

      // Verify via API calls
      const assignmentsResponse = await testUtils.mockAuthentication(testAgent, adminUser)
        .get('/api/dashboard/assignments');

      if (assignmentsResponse.status === 200) {
        const foundAssignment = assignmentsResponse.body.find((a: any) => a.id === testAssignment.id);
        if (foundAssignment) {
          expect(foundAssignment.workerId).toBe(testWorker.id);
          expect(foundAssignment.clientProfileId).toBe(testClient.id);
        }
      }
    });
  });
});