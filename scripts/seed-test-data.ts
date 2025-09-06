#!/usr/bin/env tsx

/**
 * Test Data Seeding Script for ImmigrationFlow Demo Environment
 * 
 * SECURITY WARNING: This script is only for development and demo environments.
 * It creates test accounts with KNOWN PASSWORDS for demonstration purposes.
 * 
 * Usage:
 * - Development: tsx scripts/seed-test-data.ts
 * - With custom password: tsx scripts/seed-test-data.ts --password "MySecurePass123!"
 */

import { db } from '../server/db';
import { users, clientProfiles, workers } from '../shared/schema';
import { authService } from '../server/services/authService';
import { eq } from 'drizzle-orm';

// Test account configurations
const TEST_ACCOUNTS = [
  {
    email: 'admin@demo.law',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'ADMIN' as const,
    note: 'Full system access for demo purposes'
  },
  {
    email: 'client@demo.law', 
    firstName: 'Maria',
    lastName: 'Popescu',
    role: 'OWNER' as const,
    note: 'Client owner - can manage workers and assignments'
  },
  {
    email: 'worker@demo.law',
    firstName: 'Ion',
    lastName: 'Ionescu', 
    role: 'WORKER' as const,
    note: 'Worker - can view assignments and upload documents'
  },
  {
    email: 'viewer@demo.law',
    firstName: 'Ana',
    lastName: 'Georgescu',
    role: 'VIEWER' as const,
    note: 'Read-only access to assignments'
  }
];

const DEFAULT_PASSWORD = 'Demo!2345';

async function seedTestData() {
  try {
    // Get password from command line args or use default
    const args = process.argv.slice(2);
    const passwordArg = args.find(arg => arg.startsWith('--password='));
    const customPassword = passwordArg ? passwordArg.split('=')[1] : null;
    const password = customPassword || DEFAULT_PASSWORD;

    console.log('🌱 Starting test data seeding...');
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔑 Password mode: ${customPassword ? 'CUSTOM' : 'DEFAULT'}`);
    
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ SECURITY ERROR: Test data seeding is DISABLED in production!');
      console.error('   This script creates accounts with known passwords.');
      process.exit(1);
    }

    // Validate password strength (basic check)
    if (password.length < 8) {
      console.error('❌ Password must be at least 8 characters long');
      process.exit(1);
    }

    const createdUsers = [];
    const skippedUsers = [];

    // Create test users
    for (const account of TEST_ACCOUNTS) {
      console.log(`\n🔍 Processing ${account.email} (${account.role})...`);
      
      // Check if user already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, account.email));

      if (existingUser) {
        console.log(`⚠️  User ${account.email} already exists, skipping creation`);
        skippedUsers.push({ ...account, userId: existingUser.id });
        
        // Update password for existing user (demo only)
        const { hash, salt } = await authService.hashPassword(password);
        await db
          .update(users)
          .set({
            passwordHash: hash,
            passwordSalt: salt,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUser.id));
        
        console.log(`🔄 Updated password for existing user ${account.email}`);
        continue;
      }

      // Hash password using AuthService
      console.log('🔐 Hashing password...');
      const { hash, salt } = await authService.hashPassword(password);

      // Create new user
      const [newUser] = await db
        .insert(users)
        .values({
          email: account.email,
          firstName: account.firstName,
          lastName: account.lastName,
          role: account.role,
          passwordHash: hash,
          passwordSalt: salt,
          failedLoginAttempts: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      console.log(`✅ Created user: ${newUser.email} (ID: ${newUser.id})`);
      createdUsers.push({ ...account, userId: newUser.id });
    }

    // Create sample client profile for OWNER role
    const ownerUser = [...createdUsers, ...skippedUsers].find(u => u.role === 'OWNER');
    if (ownerUser) {
      console.log(`\n🏢 Creating sample client profile for ${ownerUser.email}...`);
      
      // Check if client profile exists
      const [existingClient] = await db
        .select()
        .from(clientProfiles)
        .where(eq(clientProfiles.ownerUserId, ownerUser.userId));

      if (!existingClient) {
        const [clientProfile] = await db
          .insert(clientProfiles)
          .values({
            legalName: 'Demo Legal Services SRL',
            registrationNumber: 'J40/12345/2024',
            cui: 'RO12345678',
            legalAddress: 'Str. Victoriei Nr. 10, București, România',
            adminName: ownerUser.firstName + ' ' + ownerUser.lastName,
            contactEmail: ownerUser.email,
            phoneNumber: '+40721234567',
            bankIban: 'RO49AAAA1B310075938402',
            caen: '6910',
            ownerUserId: ownerUser.userId,
            createdAt: new Date(),
          })
          .returning();
          
        console.log(`✅ Created client profile: ${clientProfile.legalName}`);

        // Create sample worker for this client
        const workerUser = [...createdUsers, ...skippedUsers].find(u => u.role === 'WORKER');
        if (workerUser) {
          console.log(`\n👥 Creating sample worker for client...`);
          
          const [worker] = await db
            .insert(workers)
            .values({
              clientProfileId: clientProfile.id,
              firstName: workerUser.firstName || 'Ion',
              lastName: workerUser.lastName || 'Ionescu',
              nationality: 'Romanian',
              passportNumber: 'AB1234567',
              email: workerUser.email,
              phone: '+40731234567',
              dob: new Date('1990-01-15'),
              maritalStatus: 'Single',
              passportIssueDate: new Date('2020-01-01'),
              passportExpiry: new Date('2030-12-31'),
              educationLevel: 'Bachelor',
              universityName: 'University of Bucharest',
              degreeField: 'Computer Science',
              graduationYear: 2015,
              jobTitle: 'Software Developer',
              workExperience: '5+ years software development experience',
              languageSkills: [
                { language: 'Romanian', level: 'Native' },
                { language: 'English', level: 'Advanced' }
              ],
              createdAt: new Date(),
            })
            .returning();
            
          console.log(`✅ Created worker: ${worker.personalInfo.firstName} ${worker.personalInfo.lastName}`);
        }
      } else {
        console.log('⚠️  Client profile already exists, skipping creation');
      }
    }

    // Summary report
    console.log('\n🎉 Test data seeding completed!');
    console.log('\n📋 SUMMARY:');
    console.log(`✅ Created users: ${createdUsers.length}`);
    console.log(`⚠️  Existing users: ${skippedUsers.length}`);
    
    console.log('\n🔐 TEST CREDENTIALS:');
    console.log('=====================================');
    TEST_ACCOUNTS.forEach(account => {
      console.log(`${account.role.padEnd(8)} | ${account.email.padEnd(20)} | ${password}`);
    });
    console.log('=====================================');

    console.log('\n📖 USAGE INSTRUCTIONS:');
    console.log('1. Start the application: npm run dev');
    console.log('2. Set AUTH_MODE=password in environment');
    console.log('3. Access /dev/test-credentials with X-Dev-Secret header');
    console.log('4. Use any of the above credentials to test login');
    
    console.log('\n⚠️  SECURITY REMINDER:');
    console.log('These are DEMO credentials with KNOWN passwords.');
    console.log('NEVER use this script or these credentials in production!');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
    
    process.exit(1);
  }
}

// Validate environment
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

// Run seeding
seedTestData()
  .then(() => {
    console.log('\n✨ Seeding process completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Seeding process failed:', error);
    process.exit(1);
  });