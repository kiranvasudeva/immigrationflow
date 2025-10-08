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

    await page.goto('http://localhost:5173/');
    
    await page.getByTestId('button-login').click();
    
    await page.waitForSelector('[data-testid="tab-otp"]');
    await page.getByTestId('tab-otp').click();
    
    await page.getByTestId('input-otp-email').fill('test-otp@example.com');
    await page.getByTestId('button-send-otp').click();
    
    await page.waitForTimeout(2000);
    
    const otpRequest = requests.find(r => 
      r.method === 'POST' && 
      r.url.includes('/auth/v1/otp')
    );
    
    expect(otpRequest).toBeDefined();
    expect(otpRequest?.postData).toBeDefined();
    expect(otpRequest?.postData).not.toContain('redirect_to');
    expect(otpRequest?.postData).not.toContain('emailRedirectTo');
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

    await page.goto('http://localhost:5173/');
    
    await page.getByTestId('button-login').click();
    
    await page.waitForSelector('[data-testid="tab-magic-link"]');
    await page.getByTestId('tab-magic-link').click();
    
    await page.getByTestId('input-magic-link-email').fill('test-magic@example.com');
    await page.getByTestId('button-send-magic-link').click();
    
    await page.waitForTimeout(2000);
    
    const magicLinkRequest = requests.find(r => 
      r.method === 'POST' && 
      r.url.includes('/auth/v1/otp')
    );
    
    expect(magicLinkRequest).toBeDefined();
    expect(magicLinkRequest?.postData).toBeDefined();
    const postData = magicLinkRequest?.postData || '';
    expect(postData).toContain('redirect');
  });

  test('should display OTP tab as default', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    
    await page.getByTestId('button-login').click();
    
    await page.waitForSelector('[role="tab"][data-state="active"]');
    
    const activeTab = await page.locator('[role="tab"][data-state="active"]').textContent();
    expect(activeTab).toContain('Email Code');
  });

  test('should show OTP input after sending code', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    
    await page.getByTestId('button-login').click();
    
    await page.waitForSelector('[data-testid="tab-otp"]');
    
    await page.getByTestId('input-otp-email').fill('test@example.com');
    await page.getByTestId('button-send-otp').click();
    
    await page.waitForSelector('text=Enter 6-digit code', { timeout: 5000 });
    
    const otpInputs = await page.locator('input[inputmode="numeric"]').count();
    expect(otpInputs).toBeGreaterThan(0);
  });
});
