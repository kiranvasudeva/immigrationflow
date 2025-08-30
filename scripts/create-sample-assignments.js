#!/usr/bin/env node

/**
 * Create additional sample assignments for testing workflow functionality
 * 
 * This script creates realistic immigration assignments across different stages
 * to test the complete workflow from AJOFM application to residence permit.
 * 
 * Usage:
 *   node scripts/create-sample-assignments.js
 */

const { execSync } = require('child_process');

async function createSampleAssignments() {
  console.log('📋 Creating additional sample assignments...');
  
  try {
    // Run the sample data creation script
    console.log('🏗️  Generating sample assignments across all workflow stages...');
    execSync('tsx server/create-sample-data.ts', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('✅ Sample assignments created successfully!');
    console.log('');
    console.log('📊 Assignment distribution:');
    console.log('   • AJOFM applications (labor market test)');
    console.log('   • IGI work permit applications');
    console.log('   • Consulate visa applications');
    console.log('   • Residence permit applications');
    console.log('   • Completed cases for reference');
    console.log('');
    console.log('🎯 These assignments include:');
    console.log('   • Realistic Romanian company data');
    console.log('   • Workers from various countries');
    console.log('   • Different job categories and CAEN codes');
    console.log('   • Appropriate document requirements');
    console.log('   • Deadlines and reminder schedules');
    
  } catch (error) {
    console.error('❌ Sample assignment creation failed:', error.message);
    console.error('');
    console.error('💡 This script requires the base seed data to exist first.');
    console.error('   Run: npm run db:seed');
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  createSampleAssignments();
}

module.exports = { createSampleAssignments };