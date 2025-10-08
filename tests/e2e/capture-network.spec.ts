import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const PUBLIC_URL = 'https://immigration-workflow-app-1yneaxuy.devinapps.com/login';

test.describe('Network Request Capture on Public URL', () => {
  test('Capture OTP request payload (should NOT have redirect_to)', async ({ page }) => {
    const capturedPayloads: any[] = [];
    
    await page.route('**/auth/v1/otp', async (route) => {
      const request = route.request();
      const method = request.method();
      
      if (method === 'POST') {
        const postData = request.postData();
        const payload = postData ? JSON.parse(postData) : {};
        
        capturedPayloads.push({
          url: request.url(),
          method,
          payload,
          timestamp: new Date().toISOString(),
        });
        
        console.log('\n📤 OTP REQUEST CAPTURED:');
        console.log('URL:', request.url());
        console.log('Payload:', JSON.stringify(payload, null, 2));
        console.log('Has redirect_to?', 'redirect_to' in payload);
        console.log('Has emailRedirectTo?', payload.options?.emailRedirectTo !== undefined);
      }
      
      await route.continue();
    });
    
    await page.goto(PUBLIC_URL);
    await page.waitForLoadState('networkidle');
    
    const otpTab = page.locator('button:has-text("Email Code")');
    await otpTab.waitFor({ state: 'visible' });
    await otpTab.click();
    
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill('test.capture@example.com');
    
    const sendCodeButton = page.locator('button:has-text("Send Code")');
    await sendCodeButton.click();
    
    await page.waitForTimeout(3000);
    
    expect(capturedPayloads.length).toBeGreaterThan(0);
    
    const otpPayload = capturedPayloads[0].payload;
    expect(otpPayload.email).toBe('test.capture@example.com');
    expect(otpPayload).not.toHaveProperty('redirect_to');
    expect(otpPayload).not.toHaveProperty('emailRedirectTo');
    expect(otpPayload.options?.emailRedirectTo).toBeUndefined();
    
    const artifactsDir = path.join(process.cwd(), 'artifacts', 'network');
    fs.mkdirSync(artifactsDir, { recursive: true });
    
    const reportPath = path.join(artifactsDir, 'otp-request-payload.json');
    fs.writeFileSync(reportPath, JSON.stringify(capturedPayloads[0], null, 2));
    
    console.log('\n✅ OTP request verified: NO redirect_to parameter');
    console.log('Report saved to:', reportPath);
  });
  
  test('Capture Magic Link request payload (should HAVE redirect_to)', async ({ page }) => {
    const capturedPayloads: any[] = [];
    
    await page.route('**/auth/v1/otp', async (route) => {
      const request = route.request();
      const method = request.method();
      
      if (method === 'POST') {
        const postData = request.postData();
        const payload = postData ? JSON.parse(postData) : {};
        
        capturedPayloads.push({
          url: request.url(),
          method,
          payload,
          timestamp: new Date().toISOString(),
        });
        
        console.log('\n📤 MAGIC LINK REQUEST CAPTURED:');
        console.log('URL:', request.url());
        console.log('Payload:', JSON.stringify(payload, null, 2));
        console.log('Has redirect_to?', 'redirect_to' in payload);
        console.log('Has emailRedirectTo?', payload.options?.emailRedirectTo !== undefined);
      }
      
      await route.continue();
    });
    
    await page.goto(PUBLIC_URL);
    await page.waitForLoadState('networkidle');
    
    const magicLinkTab = page.locator('button:has-text("Magic Link")');
    await magicLinkTab.waitFor({ state: 'visible', timeout: 10000 });
    await magicLinkTab.click();
    
    await page.waitForTimeout(2000);
    
    await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 10000 });
    
    const emailInput = page.locator('input[type="email"]').last();
    await emailInput.waitFor({ state: 'visible', timeout: 5000 });
    await emailInput.fill('test.magiclink@example.com');
    
    await page.waitForTimeout(1000);
    
    const sendLinkButton = page.locator('button:has-text("Send Login Link")');
    await sendLinkButton.waitFor({ state: 'visible', timeout: 5000 });
    
    await sendLinkButton.click();
    
    await page.waitForTimeout(5000);
    
    expect(capturedPayloads.length).toBeGreaterThan(0);
    
    const magicLinkPayload = capturedPayloads[0].payload;
    expect(magicLinkPayload.email).toBe('test.magiclink@example.com');
    expect(magicLinkPayload.options?.emailRedirectTo).toBeDefined();
    expect(magicLinkPayload.options.emailRedirectTo).toContain('/auth/callback');
    
    const artifactsDir = path.join(process.cwd(), 'artifacts', 'network');
    fs.mkdirSync(artifactsDir, { recursive: true });
    
    const reportPath = path.join(artifactsDir, 'magic-link-request-payload.json');
    fs.writeFileSync(reportPath, JSON.stringify(capturedPayloads[0], null, 2));
    
    console.log('\n✅ Magic Link request verified: HAS redirect_to parameter');
    console.log('Report saved to:', reportPath);
  });
});
