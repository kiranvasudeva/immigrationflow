#!/usr/bin/env node

/**
 * Database seeding script for ImmigrationFlow
 * 
 * This script populates the database with sample data for development and testing.
 * It safely clears existing test data and creates new sample users, clients, workers,
 * and assignments while preserving any real production data.
 * 
 * Usage:
 *   npm run db:seed
 *   node scripts/seed.js
 */

const { execSync } = require('child_process');

async function runSeedScript() {
  console.log('🌱 Starting database seeding process...');
  
  try {
    // Check if database is accessible
    console.log('🔍 Checking database connectivity...');
    
    // Run the main seeding script
    console.log('📊 Running database seed script...');
    execSync('tsx server/seedDatabase.ts', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('✅ Database seeding completed successfully!');
    console.log('');
    console.log('📝 Sample data created:');
    console.log('   • Test admin users with different roles');
    console.log('   • Client companies with Romanian business details');
    console.log('   • Immigration workers for different specializations');
    console.log('   • Sample assignments in various workflow stages');
    console.log('   • Document templates and requirements');
    console.log('   • Multi-language translations (Romanian/English)');
    console.log('');
    console.log('🔗 You can now log in with test accounts:');
    console.log('   • test.admin1@replit.dev (Admin)');
    console.log('   • test.admin2@replit.dev (Admin)');
    console.log('   • Various client owners and workers (see console output)');
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
    console.error('');
    console.error('🔧 Troubleshooting tips:');
    console.error('   1. Ensure DATABASE_URL is set correctly');
    console.error('   2. Check database is running and accessible');
    console.error('   3. Verify schema is up to date (npm run db:push)');
    console.error('   4. Check for any foreign key constraint issues');
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  runSeedScript();
}

module.exports = { runSeedScript };