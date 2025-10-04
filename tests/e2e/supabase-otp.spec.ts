import { test, expect } from '@playwright/test';

test.describe('Supabase OTP Authentication', () => {
  test('OTP request should not include redirect_to parameter', async ({ page }) => {
    const requests: any[] = [];
    
    page.on('request', request => {
      if (request.url().includes('supabase') || request.url().includes('otp')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData(),
        });
      }
    });

    await page.goto('https://immigration-workflow-app-1yneaxuy.devinapps.com/');
    
    await page.getByText('Login').click();
    
    await page.waitForSelector('text=Email Code');
    await page.getByRole('tab', { name: /email code/i }).click();
    
    await page.fill('input[type="email"]#otp-email', 'test-otp@example.com');
    await page.click('button:has-text("Send Code")');
    
    await page.waitForTimeout(2000);
    
    const otpRequest = requests.find(r => 
      r.method === 'POST' && 
      r.url.includes('/auth/v1/otp')
    );
    
    if (otpRequest) {
      expect(otpRequest.postData).toBeDefined();
      expect(otpRequest.postData).not.toContain('redirect_to');
      expect(otpRequest.postData).not.toContain('emailRedirectTo');
    }
  });

  test('Magic Link request should include redirect_to parameter', async ({ page }) => {
    const requests: any[] = [];
    
    page.on('request', request => {
      if (request.url().includes('supabase') || request.url().includes('otp')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData(),
        });
      }
    });

    await page.goto('https://immigration-workflow-app-1yneaxuy.devinapps.com/');
    
    await page.getByText('Login').click();
    
    await page.waitForSelector('text=Magic Link');
    await page.getByRole('tab', { name: /magic link/i }).click();
    
    await page.fill('input[type="email"]#magic-link-email', 'test-magic@example.com');
    await page.click('button:has-text("Send Magic Link")');
    
    await page.waitForTimeout(2000);
    
    const magicLinkRequest = requests.find(r => 
      r.method === 'POST' && 
      r.url.includes('/auth/v1/otp')
    );
    
    if (magicLinkRequest) {
      expect(magicLinkRequest.postData).toBeDefined();
      const postData = magicLinkRequest.postData || '';
      expect(postData).toContain('redirect');
    }
  });

  test('should display OTP tab as default', async ({ page }) => {
    await page.goto('https://immigration-workflow-app-1yneaxuy.devinapps.com/');
    
    await page.getByText('Login').click();
    
    await page.waitForSelector('[role="tab"][data-state="active"]');
    
    const activeTab = await page.locator('[role="tab"][data-state="active"]').textContent();
    expect(activeTab).toContain('Email Code');
  });

  test('should show OTP input after sending code', async ({ page }) => {
    await page.goto('https://immigration-workflow-app-1yneaxuy.devinapps.com/');
    
    await page.getByText('Login').click();
    await page.fill('input[type="email"]#otp-email', 'test@example.com');
    await page.click('button:has-text("Send Code")');
    
    await page.waitForSelector('text=Enter 6-digit code', { timeout: 5000 });
    
    const otpInputs = await page.locator('input[inputmode="numeric"]').count();
    expect(otpInputs).toBeGreaterThan(0);
  });
});
