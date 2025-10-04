import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRole) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const adminClient = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

let adminApiSuccess = false;
let createDeleteUserSuccess = false;
let anonClientSuccess = false;

async function runSmokeTests() {
  console.log('🔍 Supabase Smoke Test\n');

  console.log('1️⃣  Testing Admin API (listUsers)...');
  try {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1
    });
    
    if (error) {
      console.log(`   ❌ Admin API failed: ${error.message}`);
    } else {
      console.log(`   ✅ Admin API working (found ${data.users.length} user(s))`);
      adminApiSuccess = true;
    }
  } catch (err: any) {
    console.log(`   ❌ Admin API failed: ${err.message}`);
  }

  console.log('\n2️⃣  Testing Create/Delete User...');
  const timestamp = Date.now();
  const testEmail = `devin-secrets-check+${timestamp}@example.com`;
  let testUserId: string | null = null;

  try {
    const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: 'test-password-' + timestamp,
      email_confirm: true
    });

    if (createError) {
      console.log(`   ❌ Create user failed: ${createError.message}`);
    } else if (createData.user) {
      testUserId = createData.user.id;
      console.log(`   ✅ User created: ${testEmail}`);

      const { error: deleteError } = await adminClient.auth.admin.deleteUser(testUserId);
      
      if (deleteError) {
        console.log(`   ❌ Delete user failed: ${deleteError.message}`);
      } else {
        console.log(`   ✅ User deleted successfully`);
        createDeleteUserSuccess = true;
      }
    }
  } catch (err: any) {
    console.log(`   ❌ Create/Delete failed: ${err.message}`);
    
    if (testUserId) {
      try {
        await adminClient.auth.admin.deleteUser(testUserId);
      } catch {}
    }
  }

  console.log('\n3️⃣  Testing Anon Client (getSession)...');
  try {
    const { data, error } = await anonClient.auth.getSession();
    
    if (error) {
      console.log(`   ❌ Anon client failed: ${error.message}`);
    } else {
      console.log(`   ✅ Anon client working (session: ${data.session ? 'active' : 'none'})`);
      anonClientSuccess = true;
    }
  } catch (err: any) {
    console.log(`   ❌ Anon client failed: ${err.message}`);
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 SUMMARY');
  console.log('='.repeat(50));
  console.log(`Admin API:           ${adminApiSuccess ? '✅' : '❌'}`);
  console.log(`Create/Delete user:  ${createDeleteUserSuccess ? '✅' : '❌'}`);
  console.log(`Anon client:         ${anonClientSuccess ? '✅' : '❌'}`);
  console.log('='.repeat(50));

  const allPassed = adminApiSuccess && createDeleteUserSuccess && anonClientSuccess;
  process.exit(allPassed ? 0 : 1);
}

runSmokeTests().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
