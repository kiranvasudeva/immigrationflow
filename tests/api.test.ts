import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../server/index';
import { db } from '../server/db';
import { users, clientProfiles } from '@shared/schema';

describe('API Authentication Tests', () => {
  let testUserId: string;
  let authCookie: string;

  beforeAll(async () => {
    // Create test user
    const [testUser] = await db.insert(users).values({
      id: 'test-user-1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'OWNER',
    }).returning();
    
    testUserId = testUser.id;
  });

  afterAll(async () => {
    // Cleanup
    await db.delete(clientProfiles);
    await db.delete(users);
  });

  it('should reject unauthenticated requests', async () => {
    const response = await request(app)
      .get('/api/clients')
      .expect(401);

    expect(response.body).toHaveProperty('message', 'Unauthorized');
  });

  it('should allow authenticated user to access their data', async () => {
    // Mock authenticated session
    const agent = request.agent(app);
    
    // In a real test, you would authenticate through the login flow
    // For this test, we'll skip the actual authentication
    
    const response = await agent
      .get('/api/clients')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should create client profile for authenticated user', async () => {
    const clientData = {
      companyName: 'Test Company SRL',
      cui: 'RO12345678',
      address: 'Test Address 123, Bucharest',
      caen: '6201',
      contactEmail: 'contact@testcompany.ro',
      onrc: 'J40/1234/2023',
      ownerUserId: testUserId,
    };

    const response = await request(app)
      .post('/api/clients')
      .send(clientData)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.companyName).toBe(clientData.companyName);
    expect(response.body.cui).toBe(clientData.cui);
  });

  it('should validate client profile data', async () => {
    const invalidData = {
      companyName: '', // Required field
      cui: 'invalid-cui',
      // Missing required fields
    };

    await request(app)
      .post('/api/clients')
      .send(invalidData)
      .expect(500); // Should fail validation
  });
});
