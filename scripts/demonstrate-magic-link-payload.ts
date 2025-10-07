import { createClient } from '@supabase/supabase-js';

/**
 * Demonstrates the difference between OTP and Magic Link request payloads
 * This script shows what payload is sent to Supabase for each auth method
 */

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const PUBLIC_SITE_URL = 'https://immigration-workflow-app-1yneaxuy.devinapps.com';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function demonstrateOtpPayload() {
  console.log('\n📤 OTP Request (Email Code):');
  console.log('===============================');
  
  const otpOptions = {
    shouldCreateUser: true,
  };
  
  console.log('Email:', 'demo.otp@example.com');
  console.log('Options:', JSON.stringify(otpOptions, null, 2));
  console.log('\n✅ Key observation: NO emailRedirectTo parameter');
  console.log('This means the user must enter a 6-digit code to verify');
}

async function demonstrateMagicLinkPayload() {
  console.log('\n\n📤 Magic Link Request:');
  console.log('===============================');
  
  const magicLinkOptions = {
    shouldCreateUser: true,
    emailRedirectTo: `${PUBLIC_SITE_URL}/auth/callback`,
  };
  
  console.log('Email:', 'demo.magiclink@example.com');
  console.log('Options:', JSON.stringify(magicLinkOptions, null, 2));
  console.log('\n✅ Key observation: HAS emailRedirectTo parameter');
  console.log(`Redirect URL: ${PUBLIC_SITE_URL}/auth/callback`);
  console.log('This means the user receives a clickable link in their email');
}

async function savePayloadComparison() {
  const comparison = {
    otp: {
      description: 'Email Code (OTP) - User enters 6-digit code',
      endpoint: '/auth/v1/otp',
      method: 'POST',
      payload: {
        email: 'user@example.com',
        options: {
          shouldCreateUser: true,
        },
      },
      verification: {
        type: 'email',
        email: 'user@example.com',
        token: '123456',
      },
    },
    magicLink: {
      description: 'Magic Link - User clicks link in email',
      endpoint: '/auth/v1/otp',
      method: 'POST',
      payload: {
        email: 'user@example.com',
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${PUBLIC_SITE_URL}/auth/callback`,
        },
      },
      verification: 'Automatic upon clicking link',
    },
  };
  
  const fs = await import('fs');
  const path = await import('path');
  
  const artifactsDir = path.join(process.cwd(), 'artifacts', 'network');
  fs.mkdirSync(artifactsDir, { recursive: true });
  
  const comparisonPath = path.join(artifactsDir, 'payload-comparison.json');
  fs.writeFileSync(comparisonPath, JSON.stringify(comparison, null, 2));
  
  console.log('\n\n💾 Saved payload comparison to:', comparisonPath);
}

async function main() {
  console.log('🔍 Demonstrating OTP vs Magic Link Payloads');
  console.log('==========================================\n');
  
  await demonstrateOtpPayload();
  await demonstrateMagicLinkPayload();
  await savePayloadComparison();
  
  console.log('\n\n📊 Summary:');
  console.log('============');
  console.log('OTP:         NO emailRedirectTo → User enters code');
  console.log('Magic Link:  HAS emailRedirectTo → User clicks link');
}

main().catch(console.error);
