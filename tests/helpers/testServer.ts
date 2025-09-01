import express from 'express';
import { createServer } from 'http';
import { registerRoutes } from '../../server/routes';
import type { Server } from 'http';

/**
 * Creates a test server instance for integration testing
 * This ensures we test against the actual server implementation
 * without any mocking or stubbing.
 */
export async function createTestServer(): Promise<Server> {
  const app = express();
  
  // Set up the server with all the real routes and middleware
  const server = await registerRoutes(app);
  
  return server;
}