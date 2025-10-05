import { test, expect } from '@playwright/test';

test.describe('OTP Email Normalization on Network Layer', () => {
  test('OTP request body contains normalized email and no redirect_to', async ({ page }) => {
    const otpRequests: any[] = [];
    
    await page.route('**/auth/v1/otp', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON?.() ?? JSON.parse(request.postData() || '{}');
      otpRequests.push({ url: request.url(), postData });
      await route.continue();
    });

    await page.goto('http://localhost:5173/');
    
    await page.getByTestId('button-login').click();
    
    await page.waitForSelector('[data-testid="tab-otp"]');
    await page.getByTestId('tab-otp').click();
    
    await page.getByTestId('input-otp-email').fill('"KiRan.Vasudeva@GMAIL.com"');
    await page.getByTestId('button-send-otp').click();
    
    await expect.poll(() => otpRequests.length, { timeout: 5000 }).toBe(1);
    const body = otpRequests[0].postData;
    
    expect(body.email).toBe('kiran.vasudeva@gmail.com');
    expect(JSON.stringify(body)).not.toMatch(/redirect_to/i);
    expect(JSON.stringify(body)).not.toMatch(/emailRedirectTo/i);
  });

  test('Magic Link request includes redirect_to with normalized email', async ({ page }) => {
    const magicLinkRequests: any[] = [];
    
    await page.route('**/auth/v1/otp', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON?.() ?? JSON.parse(request.postData() || '{}');
      magicLinkRequests.push({ url: request.url(), postData });
      await route.continue();
    });

    await page.goto('http://localhost:5173/');
    
    await page.getByTestId('button-login').click();
    
    await page.waitForSelector('[data-testid="tab-magic-link"]');
    await page.getByTestId('tab-magic-link').click();
    
    await page.getByTestId('input-magic-link-email').fill('  "Test@Example.COM"  ');
    await page.getByTestId('button-send-magic-link').click();
    
    await expect.poll(() => magicLinkRequests.length, { timeout: 5000 }).toBe(1);
    const body = magicLinkRequests[0].postData;
    
    expect(body.email).toBe('test@example.com');
    expect(body.options?.emailRedirectTo || body.email_redirect_to).toBeDefined();
  });
});
