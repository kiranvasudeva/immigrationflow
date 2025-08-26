import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon for serverless environment
neonConfig.webSocketConstructor = ws;

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is missing");
  console.error("Please ensure the DATABASE_URL is set in your environment variables");
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log("✅ DATABASE_URL found, initializing database connection...");

// Create connection pool with error handling
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Add connection pool configuration for better reliability
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

const db = drizzle({ client: pool, schema });

console.log("✅ Database connection pool created successfully");

// Test the connection on startup
pool.on('error', (err) => {
  console.error('❌ Database pool error:', err);
});

pool.on('connect', () => {
  console.log('✅ Database connection established');
});

export { pool, db };