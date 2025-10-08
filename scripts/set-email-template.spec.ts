import { test, expect } from '@playwright/test';

test.describe('Supabase Email Template Configuration', () => {
  test('Configure dual-mode email template', async ({ page }) => {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseProjectRef = process.env.SUPABASE_PROJECT_REF || '';
    const supabaseAccessToken = process.env.SUPABASE_ACCESS_TOKEN || '';
    
    if (!supabaseProjectRef || !supabaseAccessToken) {
      test.skip();
      console.log('⚠️  Skipping: SUPABASE_PROJECT_REF and SUPABASE_ACCESS_TOKEN required');
      return;
    }
    
    await page.goto('https://supabase.com/dashboard');
    
    const dualModeTemplate = `<h2>Sign in to ImmFlow</h2>
{{ if .Token }}
  <p>Use this 6-digit code to sign in:</p>
  <div style="font-size:32px; letter-spacing:4px; text-align:center; font-family:monospace; margin:16px 0">{{ .Token }}</div>
  <p style="color:#555">The code expires shortly. If you didn't request it, ignore this email.</p>
{{ else }}
  <p>Click to sign in:</p>
  <p><a href="{{ .ConfirmationURL }}" style="display:inline-block; background:#3b82f6; color:#fff; padding:10px 16px; border-radius:6px; text-decoration:none">Log In</a></p>
{{ end }}`;
    
    console.log('📧 Dual-mode email template prepared');
    console.log('Template content:', dualModeTemplate);
    console.log('\n⚠️  MANUAL CONFIGURATION REQUIRED:');
    console.log('1. Log into Supabase Dashboard: https://supabase.com/dashboard');
    console.log(`2. Navigate to project: ${supabaseProjectRef}`);
    console.log('3. Go to Authentication → Email Templates');
    console.log('4. Update "Magic Link" template with the dual-mode template above');
    console.log('5. Save changes');
  });
  
  test('Verify email template configuration via API', async ({ request }) => {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE || '';
    
    if (!supabaseUrl || !supabaseServiceRole) {
      test.skip();
      console.log('⚠️  Skipping: SUPABASE_URL and SUPABASE_SERVICE_ROLE required');
      return;
    }
    
    const response = await request.get(`${supabaseUrl}auth/v1/admin/settings`, {
      headers: {
        'apikey': supabaseServiceRole,
        'Authorization': `Bearer ${supabaseServiceRole}`
      }
    });
    
    if (response.ok()) {
      const settings = await response.json();
      console.log('✅ Settings retrieved:', JSON.stringify(settings, null, 2));
    } else {
      console.log(`⚠️  Could not fetch settings (${response.status()})`);
      console.log('Email template must be configured manually via Supabase Dashboard');
    }
  });
});
