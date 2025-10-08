import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Captures actual network requests from the public URL to prove OTP vs Magic Link differences
 */

const PUBLIC_URL = 'https://immigration-workflow-app-1yneaxuy.devinapps.com';

test.describe('Public URL Network Capture', () => {
  test('capture OTP request without redirect_to', async ({ page }) => {
    const otpRequests: any[] = [];
    
    await page.route('**/auth/v1/otp', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON?.() ?? {};
      
      otpRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString(),
        payload: postData,
      });
      
      await route.continue();
    });
    
    await page.goto(PUBLIC_URL);
    
    await page.waitForLoadState('networkidle');
    
    const loginButton = page.getByTestId('button-login');
    await loginButton.click();
    
    await page.waitForSelector('[data-testid="tab-otp"]', { timeout: 10000 });
    
    const otpTab = page.getByTestId('tab-otp');
    await otpTab.click();
    
    const emailInput = page.getByTestId('input-otp-email');
    await emailInput.fill('test.otp@example.com');
    
    const sendButton = page.getByTestId('button-send-otp');
    await sendButton.click();
    
    await page.waitForTimeout(2000);
    
    expect(otpRequests.length).toBeGreaterThan(0);
    
    const lastRequest = otpRequests[otpRequests.length - 1];
    
    expect(lastRequest.payload.options?.emailRedirectTo).toBeUndefined();
    expect(JSON.stringify(lastRequest.payload)).not.toContain('redirect');
    
    const artifactsDir = path.join(process.cwd(), 'artifacts', 'network');
    fs.mkdirSync(artifactsDir, { recursive: true });
    
    fs.writeFileSync(
      path.join(artifactsDir, 'otp-request-captured-public.json'),
      JSON.stringify(lastRequest, null, 2)
    );
    
    console.log('✅ OTP request captured - NO redirect_to parameter');
  });
  
  test('capture Magic Link request with redirect_to', async ({ page }) => {
    const magicLinkRequests: any[] = [];
    
    await page.route('**/auth/v1/otp', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON?.() ?? {};
      
      magicLinkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString(),
        payload: postData,
      });
      
      await route.continue();
    });
    
    await page.goto(PUBLIC_URL);
    
    await page.waitForLoadState('networkidle');
    
    const loginButton = page.getByTestId('button-login');
    await loginButton.click();
    
    await page.waitForSelector('[data-testid="tab-magic-link"]', { timeout: 10000 });
    
    const magicLinkTab = page.getByTestId('tab-magic-link');
    await magicLinkTab.click();
    
    const emailInput = page.getByTestId('input-magic-link-email');
    await emailInput.fill('test.magiclink@example.com');
    
    const sendButton = page.getByTestId('button-send-magic-link');
    await sendButton.click();
    
    await page.waitForTimeout(2000);
    
    expect(magicLinkRequests.length).toBeGreaterThan(0);
    
    const lastRequest = magicLinkRequests[magicLinkRequests.length - 1];
    
    expect(lastRequest.payload.options?.emailRedirectTo).toBeDefined();
    expect(lastRequest.payload.options?.emailRedirectTo).toContain('/auth/callback');
    
    const artifactsDir = path.join(process.cwd(), 'artifacts', 'network');
    fs.mkdirSync(artifactsDir, { recursive: true });
    
    fs.writeFileSync(
      path.join(artifactsDir, 'magic-link-request-captured-public.json'),
      JSON.stringify(lastRequest, null, 2)
    );
    
    console.log('✅ Magic Link request captured - HAS redirect_to parameter');
  });
});
