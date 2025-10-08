import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseServiceRole) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function configureSupabase() {
  console.log('🔧 Configuring Supabase Authentication\n');

  try {
    console.log('Fetching current settings...');
    
    const settingsResponse = await fetch(`${supabaseUrl}auth/v1/admin/settings`, {
      method: 'GET',
      headers: {
        'apikey': supabaseServiceRole,
        'Authorization': `Bearer ${supabaseServiceRole}`
      }
    } as RequestInit);

    if (!settingsResponse.ok) {
      const errorText = await settingsResponse.text();
      console.log(`⚠️  Could not fetch settings via API (${settingsResponse.status})`);
      console.log('Response:', errorText.substring(0, 200));
      console.log('\nNote: GoTrue Admin API may not expose settings endpoint.');
      console.log('Email provider and OTP settings are typically configured via Supabase Dashboard.');
      console.log('Please ensure the following are enabled in your Supabase Dashboard:');
      console.log('  1. Authentication → Providers → Email (enabled)');
      console.log('  2. Authentication → Email Auth → Enable Email OTP');
      console.log('  3. Authentication → Email Auth → Enable Email Confirmations');
      console.log('  4. Authentication → Email Templates → Configure dual-mode template\n');
      process.exit(0);
    }

    const currentSettings = await settingsResponse.json();
    console.log('Current settings fetched successfully');
    console.log('Settings:', JSON.stringify(currentSettings, null, 2));

  } catch (err: any) {
    console.error('Error:', err.message);
    console.log('\n⚠️  Configuration via API not available.');
    console.log('Please configure Supabase manually via Dashboard:');
    console.log('  1. Go to Authentication → Providers → Email (enable it)');
    console.log('  2. Go to Authentication → Email Auth → Enable Email OTP');
    console.log('  3. Go to Authentication → Email Auth → Enable Email Confirmations');
    console.log('  4. Update Email Templates to support dual-mode (OTP code + Magic Link)\n');
    process.exit(0);
  }
}

configureSupabase().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
