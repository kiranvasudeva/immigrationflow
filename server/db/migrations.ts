// Database Migration Automation with Rollback Capabilities
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { productionConfig } from '../config/production';

interface MigrationStep {
  id: string;
  description: string;
  up: string;
  down: string;
  applied: boolean;
  appliedAt?: Date;
}

class DatabaseMigrationManager {
  private db: any;
  private client: any;
  
  constructor() {
    this.client = postgres(productionConfig.DATABASE_URL, { max: 1 });
    this.db = drizzle(this.client);
  }

  async createMigrationTable() {
    await this.client`
      CREATE TABLE IF NOT EXISTS migration_history (
        id VARCHAR(255) PRIMARY KEY,
        description TEXT NOT NULL,
        up_script TEXT NOT NULL,
        down_script TEXT NOT NULL,
        applied_at TIMESTAMP DEFAULT NOW(),
        rolled_back_at TIMESTAMP,
        checksum VARCHAR(64) NOT NULL
      )
    `;
  }

  async validateCurrentState(): Promise<boolean> {
    try {
      // Check if all tables exist and match schema
      const tables = await this.client`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      
      const requiredTables = [
        'users', 'client_profiles', 'workers', 'workflow_templates',
        'workflow_steps', 'workflow_step_document_requirements',
        'document_files', 'checklist_items'
      ];
      
      const existingTables = tables.map((t: any) => t.table_name);
      const missingTables = requiredTables.filter(table => !existingTables.includes(table));
      
      if (missingTables.length > 0) {
        console.warn(`Missing tables: ${missingTables.join(', ')}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Database validation failed:', error);
      return false;
    }
  }

  async executeAtomicMigration(migrations: MigrationStep[]): Promise<boolean> {
    const transaction = this.client.begin();
    
    try {
      await transaction`BEGIN`;
      
      for (const migration of migrations) {
        console.log(`Applying migration: ${migration.description}`);
        await transaction.unsafe(migration.up);
        
        await transaction`
          INSERT INTO migration_history (id, description, up_script, down_script, checksum)
          VALUES (${migration.id}, ${migration.description}, ${migration.up}, ${migration.down}, ${this.generateChecksum(migration)})
        `;
      }
      
      await transaction`COMMIT`;
      console.log('✅ All migrations applied successfully');
      return true;
    } catch (error) {
      await transaction`ROLLBACK`;
      console.error('❌ Migration failed, rolled back:', error);
      return false;
    }
  }

  async rollbackToCheckpoint(checkpointId: string): Promise<boolean> {
    try {
      const migrationsToRollback = await this.client`
        SELECT * FROM migration_history 
        WHERE applied_at > (
          SELECT applied_at FROM migration_history WHERE id = ${checkpointId}
        )
        ORDER BY applied_at DESC
      `;
      
      await this.client`BEGIN`;
      
      for (const migration of migrationsToRollback) {
        console.log(`Rolling back: ${migration.description}`);
        await this.client.unsafe(migration.down_script);
        
        await this.client`
          UPDATE migration_history 
          SET rolled_back_at = NOW() 
          WHERE id = ${migration.id}
        `;
      }
      
      await this.client`COMMIT`;
      console.log('✅ Rollback completed successfully');
      return true;
    } catch (error) {
      await this.client`ROLLBACK`;
      console.error('❌ Rollback failed:', error);
      return false;
    }
  }

  private generateChecksum(migration: MigrationStep): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(migration.up + migration.down).digest('hex');
  }

  async close() {
    await this.client.end();
  }
}

// Automated Schema Sync Function
export async function syncDatabaseSchema(): Promise<boolean> {
  const migrationManager = new DatabaseMigrationManager();
  
  try {
    await migrationManager.createMigrationTable();
    
    const isValid = await migrationManager.validateCurrentState();
    if (!isValid) {
      console.log('🔄 Database schema needs updating...');
      
      // This would be replaced with actual Drizzle schema push
      const { execSync } = require('child_process');
      execSync('npm run db:push --force', { stdio: 'inherit' });
    }
    
    return true;
  } catch (error) {
    console.error('Database sync failed:', error);
    return false;
  } finally {
    await migrationManager.close();
  }
}

export { DatabaseMigrationManager };