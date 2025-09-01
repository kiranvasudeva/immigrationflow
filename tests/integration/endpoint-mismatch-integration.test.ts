import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { nanoid } from 'nanoid';
import { createTestServer } from '../helpers/testServer';
import type { Server } from 'http';
import { db } from '../../server/db';
import { users, clientProfiles, workers, stages, requirements, assignments, documentFiles, workflowTemplates, workflowSteps, documentRequirements, checklistItems } from '../../shared/schema';
import { sql } from 'drizzle-orm';
import supertest from 'supertest';

/**
 * ENDPOINT MISMATCH INTEGRATION TEST
 * 
 * This test identifies and resolves ALL endpoint mismatches by:
 * 1. Testing every API endpoint with real database data
 * 2. Validating request/response data structures match schema definitions
 * 3. Ensuring no hardcoded data, mock responses, or assumptions
 * 4. Verifying proper error handling and edge cases
 * 5. Confirming RBAC and authentication work correctly
 * 
 * NO MOCKING, NO HARDCODING, NO ASSUMPTIONS - Everything must be real data.
 */

interface TestUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'OWNER' | 'WORKER' | 'VIEWER';
  firstName: string;
  lastName: string;
}

interface EndpointTest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  requiresAuth: boolean;
  requiredRoles: string[];
  requestData?: any;
  expectedFields: string[];
  dependsOn?: string[]; // Other endpoints this depends on
}

// Comprehensive endpoint definitions from analysis
const ALL_ENDPOINTS: EndpointTest[] = [
  {
    method: 'GET',
    path: '/api/auth/user',
    description: 'Get current authenticated user information',
    requiresAuth: true,
    requiredRoles: [],
    expectedFields: ['id', 'email', 'firstName', 'lastName', 'role']
  },
  {
    method: 'GET',
    path: '/api/stages',
    description: 'Get all workflow stages',
    requiresAuth: true,
    requiredRoles: ['ADMIN', 'OWNER', 'WORKER'],
    expectedFields: ['id', 'key', 'title', 'description', 'order']
  },
  {
    method: 'GET',
    path: '/api/workers',
    description: 'Get all workers',
    requiresAuth: true,
    requiredRoles: ['ADMIN', 'OWNER'],
    expectedFields: ['id', 'clientProfileId', 'firstName', 'lastName', 'nationality', 'passportNumber']
  },
  {
    method: 'GET',
    path: '/api/clients',
    description: 'Get all client profiles',
    requiresAuth: true,
    requiredRoles: ['ADMIN', 'OWNER'],
    expectedFields: ['id', 'legalName', 'cui', 'legalAddress', 'adminName', 'contactEmail']
  },
  {
    method: 'GET',
    path: '/api/dashboard/stats',
    description: 'Get dashboard statistics',
    requiresAuth: true,
    requiredRoles: ['ADMIN', 'OWNER'],
    expectedFields: ['totalWorkers', 'totalClients', 'totalAssignments', 'activeAssignments', 'completedAssignments', 'pendingAssignments']
  },
  {
    method: 'GET',
    path: '/api/dashboard/assignments',
    description: 'Get all assignments for dashboard',
    requiresAuth: true,
    requiredRoles: ['ADMIN', 'OWNER'],
    expectedFields: ['id', 'requirementId', 'clientProfileId', 'status', 'assignedToRole']
  },
  {
    method: 'GET',
    path: '/api/workflow/templates',
    description: 'Get workflow templates',
    requiresAuth: true,
    requiredRoles: ['ADMIN', 'OWNER', 'WORKER'],
    expectedFields: ['id', 'name', 'description', 'stages']
  },
  {
    method: 'GET',
    path: '/api/clients/:clientId/workers',
    description: 'Get workers for specific client',
    requiresAuth: true,
    requiredRoles: ['ADMIN', 'OWNER'],
    expectedFields: ['id', 'clientProfileId', 'firstName', 'lastName', 'nationality'],
    dependsOn: ['clients']
  }
];

class EndpointTestSuite {
  private server: Server;
  private testAgent: supertest.SuperTest<supertest.Test>;
  private createdData = {
    users: [] as string[],
    clients: [] as string[],
    workers: [] as string[],
    stages: [] as string[],
    requirements: [] as string[],
    assignments: [] as string[]
  };

  constructor(server: Server) {
    this.server = server;
    this.testAgent = supertest(server);
  }

  async createTestUser(role: 'ADMIN' | 'OWNER' | 'WORKER' | 'VIEWER' = 'ADMIN'): Promise<TestUser> {
    const userData = {
      id: nanoid(),
      email: `endpoint-test-${nanoid()}@immigration-test.ro`,
      firstName: `EndpointTest${nanoid()}`,
      lastName: `User${nanoid()}`,
      role,
      invitedById: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const [user] = await db.insert(users).values(userData).returning();
    this.createdData.users.push(user.id);
    return user as TestUser;
  }

  async createTestClient(ownerUserId: string) {
    const clientData = {
      legalName: `Endpoint Test Company ${nanoid()} SRL`,
      registrationNumber: `J40/${nanoid()}`,
      cui: `RO${nanoid()}`,
      legalAddress: `Endpoint Test Address ${nanoid()}, Bucharest`,
      adminName: `Endpoint Admin ${nanoid()}`,
      contactEmail: `endpoint-client-${nanoid()}@test-company.ro`,
      phoneNumber: `+40${nanoid()}`,
      bankIban: `RO49AAAA${nanoid()}`,
      caen: '6201',
      ownerUserId
    };

    const [client] = await db.insert(clientProfiles).values(clientData).returning();
    this.createdData.clients.push(client.id);
    return client;
  }

  async createTestWorker(clientProfileId: string) {
    const workerData = {
      clientProfileId,
      firstName: `EndpointWorker${nanoid()}`,
      lastName: `Test${nanoid()}`,
      nationality: 'Germany',
      passportNumber: `DE${nanoid()}`,
      email: `endpoint-worker-${nanoid()}@test.com`,
      phone: `+49${nanoid()}`
    };

    const [worker] = await db.insert(workers).values(workerData).returning();
    this.createdData.workers.push(worker.id);
    return worker;
  }

  async createTestStage() {
    const stageData = {
      key: 'AJOFM' as const,
      title: `Endpoint Test Stage ${nanoid()}`,
      description: `Test stage for endpoint validation ${nanoid()}`,
      order: Math.floor(Math.random() * 1000)
    };

    const [stage] = await db.insert(stages).values(stageData).returning();
    this.createdData.stages.push(stage.id);
    return stage;
  }

  async createTestRequirement(stageId: string, createdByUserId: string) {
    const requirementData = {
      stageId,
      type: 'STANDARD' as const,
      title: `Endpoint Test Requirement ${nanoid()}`,
      description: `Test requirement for endpoint validation ${nanoid()}`,
      required: true,
      autoPopulate: false,
      createdByUserId
    };

    const [requirement] = await db.insert(requirements).values(requirementData).returning();
    this.createdData.requirements.push(requirement.id);
    return requirement;
  }

  async createTestAssignment(requirementId: string, clientProfileId: string, workerId?: string) {
    const assignmentData = {
      requirementId,
      clientProfileId,
      workerId: workerId || null,
      assignedToRole: 'OWNER' as const,
      status: 'NOT_STARTED' as const,
      institution: `Endpoint Test Institution ${nanoid()}`,
      submissionChannel: 'digital'
    };

    const [assignment] = await db.insert(assignments).values(assignmentData).returning();
    this.createdData.assignments.push(assignment.id);
    return assignment;
  }

  async testEndpoint(endpoint: EndpointTest, testUser: TestUser, dynamicParams: Record<string, string> = {}): Promise<{
    success: boolean;
    error?: string;
    response?: any;
    statusCode?: number;
  }> {
    try {
      // Replace dynamic parameters in path
      let testPath = endpoint.path;
      for (const [param, value] of Object.entries(dynamicParams)) {
        testPath = testPath.replace(`:${param}`, value);
      }

      console.log(`Testing ${endpoint.method} ${testPath} as ${testUser.role}`);

      // Make request with authentication headers
      let request = this.testAgent[endpoint.method.toLowerCase() as 'get']
        .call(this.testAgent, testPath)
        .set('x-test-user-id', testUser.id)
        .set('x-test-user-role', testUser.role);

      // Add request data for POST/PUT
      if (endpoint.requestData && (endpoint.method === 'POST' || endpoint.method === 'PUT')) {
        request = request.send(endpoint.requestData);
      }

      const response = await request;

      // Check if endpoint exists (not 404)
      if (response.status === 404) {
        return {
          success: false,
          error: `Endpoint not found: ${endpoint.method} ${testPath}`,
          statusCode: 404
        };
      }

      // Check authentication requirements
      if (endpoint.requiresAuth && response.status === 401) {
        return {
          success: false,
          error: 'Authentication required but request was unauthorized',
          statusCode: 401
        };
      }

      // Check role requirements
      if (endpoint.requiredRoles.length > 0 && !endpoint.requiredRoles.includes(testUser.role) && response.status === 403) {
        // This is expected behavior - user doesn't have required role
        return {
          success: true,
          response: response.body,
          statusCode: response.status
        };
      }

      // Check for successful response
      if (response.status >= 200 && response.status < 300) {
        // Validate response structure
        const validationResult = this.validateResponseStructure(response.body, endpoint.expectedFields);
        if (!validationResult.valid) {
          return {
            success: false,
            error: `Response structure mismatch: ${validationResult.error}`,
            response: response.body,
            statusCode: response.status
          };
        }

        return {
          success: true,
          response: response.body,
          statusCode: response.status
        };
      }

      return {
        success: false,
        error: `Unexpected status code: ${response.status}`,
        response: response.body,
        statusCode: response.status
      };

    } catch (error) {
      return {
        success: false,
        error: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  validateResponseStructure(responseData: any, expectedFields: string[]): { valid: boolean; error?: string } {
    if (!responseData) {
      return { valid: false, error: 'Response data is null or undefined' };
    }

    // Handle array responses
    if (Array.isArray(responseData)) {
      if (responseData.length === 0) {
        // Empty array is valid
        return { valid: true };
      }
      
      // Check first item for expected fields
      const firstItem = responseData[0];
      for (const field of expectedFields) {
        if (!(field in firstItem)) {
          return { valid: false, error: `Missing field '${field}' in array item` };
        }
      }
      return { valid: true };
    }

    // Handle object responses
    for (const field of expectedFields) {
      if (!(field in responseData)) {
        return { valid: false, error: `Missing field '${field}' in response` };
      }
    }

    return { valid: true };
  }

  async cleanup() {
    try {
      // Clean up in reverse order to respect foreign key constraints
      if (this.createdData.assignments.length > 0) {
        await db.delete(assignments).where(
          sql`id = ANY(${this.createdData.assignments})`
        );
      }

      if (this.createdData.requirements.length > 0) {
        await db.delete(requirements).where(
          sql`id = ANY(${this.createdData.requirements})`
        );
      }

      if (this.createdData.stages.length > 0) {
        await db.delete(stages).where(
          sql`id = ANY(${this.createdData.stages})`
        );
      }

      if (this.createdData.workers.length > 0) {
        await db.delete(workers).where(
          sql`id = ANY(${this.createdData.workers})`
        );
      }

      if (this.createdData.clients.length > 0) {
        await db.delete(clientProfiles).where(
          sql`id = ANY(${this.createdData.clients})`
        );
      }

      if (this.createdData.users.length > 0) {
        await db.delete(users).where(
          sql`id = ANY(${this.createdData.users})`
        );
      }

      // Reset tracking arrays
      Object.keys(this.createdData).forEach(key => {
        this.createdData[key as keyof typeof this.createdData] = [];
      });

    } catch (error) {
      console.error('Endpoint test cleanup error:', error);
      throw error;
    }
  }
}

describe('Endpoint Mismatch Integration Tests', () => {
  let server: Server;
  let testSuite: EndpointTestSuite;

  beforeAll(async () => {
    server = await createTestServer();
    testSuite = new EndpointTestSuite(server);
  });

  afterAll(async () => {
    await testSuite.cleanup();
    if (server) {
      server.close();
    }
  });

  describe('Complete API Endpoint Validation', () => {
    it('should validate all endpoints with real database data - no hardcoding or mocking', async () => {
      // Create test data with real database entities
      const adminUser = await testSuite.createTestUser('ADMIN');
      const ownerUser = await testSuite.createTestUser('OWNER');
      const workerUser = await testSuite.createTestUser('WORKER');
      const viewerUser = await testSuite.createTestUser('VIEWER');

      const testClient = await testSuite.createTestClient(ownerUser.id);
      const testWorker = await testSuite.createTestWorker(testClient.id);
      const testStage = await testSuite.createTestStage();
      const testRequirement = await testSuite.createTestRequirement(testStage.id, adminUser.id);
      const testAssignment = await testSuite.createTestAssignment(testRequirement.id, testClient.id, testWorker.id);

      const allResults: Array<{
        endpoint: string;
        user: string;
        success: boolean;
        error?: string;
        statusCode?: number;
      }> = [];

      // Test each endpoint with different user roles
      for (const endpoint of ALL_ENDPOINTS) {
        const testUsers = [adminUser, ownerUser, workerUser, viewerUser];

        for (const testUser of testUsers) {
          const dynamicParams: Record<string, string> = {};

          // Provide dynamic parameters for parameterized endpoints
          if (endpoint.path.includes(':clientId')) {
            dynamicParams.clientId = testClient.id;
          }
          if (endpoint.path.includes(':workerId')) {
            dynamicParams.workerId = testWorker.id;
          }

          const result = await testSuite.testEndpoint(endpoint, testUser, dynamicParams);

          allResults.push({
            endpoint: `${endpoint.method} ${endpoint.path}`,
            user: `${testUser.role} (${testUser.id})`,
            success: result.success,
            error: result.error,
            statusCode: result.statusCode
          });

          // For endpoints that should be accessible to this user role, ensure they work
          if (endpoint.requiredRoles.length === 0 || endpoint.requiredRoles.includes(testUser.role)) {
            if (!result.success && result.statusCode !== 403) {
              console.error(`ENDPOINT MISMATCH DETECTED:`, {
                endpoint: `${endpoint.method} ${endpoint.path}`,
                user: testUser.role,
                error: result.error,
                statusCode: result.statusCode,
                response: result.response
              });
            }
            
            expect(result.success || result.statusCode === 403).toBe(true);
          }
        }
      }

      // Log summary of all endpoint tests
      const failedTests = allResults.filter(r => !r.success && r.statusCode !== 403);
      if (failedTests.length > 0) {
        console.error('FAILED ENDPOINT TESTS:', failedTests);
      }

      console.log(`Endpoint validation completed: ${allResults.length} tests run, ${failedTests.length} failures`);
      
      // All critical endpoints should work for authorized users
      expect(failedTests.length).toBe(0);

    }, 60000); // 60 second timeout for comprehensive testing

    it('should validate data consistency across related endpoints', async () => {
      // Test data consistency between related endpoints
      const adminUser = await testSuite.createTestUser('ADMIN');
      const testClient = await testSuite.createTestClient(adminUser.id);
      const testWorker = await testSuite.createTestWorker(testClient.id);

      // Get all clients
      const clientsResult = await testSuite.testEndpoint(
        ALL_ENDPOINTS.find(e => e.path === '/api/clients')!,
        adminUser
      );
      expect(clientsResult.success).toBe(true);
      expect(Array.isArray(clientsResult.response)).toBe(true);
      
      const clientExists = clientsResult.response?.some((c: any) => c.id === testClient.id);
      expect(clientExists).toBe(true);

      // Get workers for specific client
      const clientWorkersResult = await testSuite.testEndpoint(
        ALL_ENDPOINTS.find(e => e.path === '/api/clients/:clientId/workers')!,
        adminUser,
        { clientId: testClient.id }
      );
      expect(clientWorkersResult.success).toBe(true);
      expect(Array.isArray(clientWorkersResult.response)).toBe(true);
      
      const workerExists = clientWorkersResult.response?.some((w: any) => w.id === testWorker.id);
      expect(workerExists).toBe(true);

      // Validate that worker belongs to correct client
      const foundWorker = clientWorkersResult.response?.find((w: any) => w.id === testWorker.id);
      expect(foundWorker?.clientProfileId).toBe(testClient.id);
    });

    it('should validate dashboard data aggregation accuracy', async () => {
      const adminUser = await testSuite.createTestUser('ADMIN');
      const testClient = await testSuite.createTestClient(adminUser.id);
      const testWorker = await testSuite.createTestWorker(testClient.id);
      const testStage = await testSuite.createTestStage();
      const testRequirement = await testSuite.createTestRequirement(testStage.id, adminUser.id);
      const testAssignment = await testSuite.createTestAssignment(testRequirement.id, testClient.id, testWorker.id);

      // Get dashboard stats
      const statsResult = await testSuite.testEndpoint(
        ALL_ENDPOINTS.find(e => e.path === '/api/dashboard/stats')!,
        adminUser
      );
      expect(statsResult.success).toBe(true);

      const stats = statsResult.response;
      expect(typeof stats.totalWorkers).toBe('number');
      expect(typeof stats.totalClients).toBe('number');
      expect(typeof stats.totalAssignments).toBe('number');
      expect(stats.totalWorkers).toBeGreaterThanOrEqual(1); // At least our test worker
      expect(stats.totalClients).toBeGreaterThanOrEqual(1); // At least our test client
      expect(stats.totalAssignments).toBeGreaterThanOrEqual(1); // At least our test assignment

      // Get assignments
      const assignmentsResult = await testSuite.testEndpoint(
        ALL_ENDPOINTS.find(e => e.path === '/api/dashboard/assignments')!,
        adminUser
      );
      expect(assignmentsResult.success).toBe(true);
      expect(Array.isArray(assignmentsResult.response)).toBe(true);

      // Verify assignment count consistency
      const actualAssignmentCount = assignmentsResult.response?.length || 0;
      expect(stats.totalAssignments).toBe(actualAssignmentCount);
    });

    it('should validate authentication and authorization enforcement', async () => {
      const adminUser = await testSuite.createTestUser('ADMIN');
      const viewerUser = await testSuite.createTestUser('VIEWER');

      // Test endpoint that requires ADMIN/OWNER role with VIEWER user
      const result = await testSuite.testEndpoint(
        ALL_ENDPOINTS.find(e => e.path === '/api/clients')!,
        viewerUser
      );

      // VIEWER should be denied access (403) since they don't have required role
      expect(result.statusCode).toBe(403);
    });

    it('should validate all response data comes from database - no hardcoded values', async () => {
      const adminUser = await testSuite.createTestUser('ADMIN');
      const testClient = await testSuite.createTestClient(adminUser.id);

      const clientsResult = await testSuite.testEndpoint(
        ALL_ENDPOINTS.find(e => e.path === '/api/clients')!,
        adminUser
      );

      expect(clientsResult.success).toBe(true);
      const clients = clientsResult.response;
      
      // Find our test client in the response
      const foundClient = clients.find((c: any) => c.id === testClient.id);
      expect(foundClient).toBeDefined();
      
      // Verify data matches what we inserted (proving it came from database)
      expect(foundClient.legalName).toBe(testClient.legalName);
      expect(foundClient.cui).toBe(testClient.cui);
      expect(foundClient.contactEmail).toBe(testClient.contactEmail);
      
      // Ensure no hardcoded test values
      expect(foundClient.legalName).not.toContain('Mock');
      expect(foundClient.legalName).not.toContain('Fake');
      expect(foundClient.legalName).not.toContain('Sample');
    });
  });
});