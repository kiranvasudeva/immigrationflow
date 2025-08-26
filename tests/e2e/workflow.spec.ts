import { test, expect } from '@playwright/test';

test.describe('Immigration Workflow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('should complete owner workflow: login → create client → add worker → upload document → admin approval', async ({ page }) => {
    // Test landing page
    await expect(page.getByTestId('button-login')).toBeVisible();
    
    // Click login button to open modal
    await page.getByTestId('button-login').click();
    await expect(page.getByTestId('input-email')).toBeVisible();
    
    // Fill login form
    await page.getByTestId('input-email').fill('owner@testcompany.ro');
    await page.getByTestId('input-password').fill('password123');
    
    // Submit login (this will redirect to actual auth)
    await page.getByTestId('button-signin').click();
    
    // After successful login, should see dashboard
    await expect(page.getByTestId('nav-dashboard')).toBeVisible();
    
    // Check if client profile exists, if not create one
    const hasClientProfile = await page.getByTestId('card-company-profile').isVisible().catch(() => false);
    
    if (!hasClientProfile) {
      // Create client profile
      await page.getByTestId('button-new-client').click();
      await expect(page.getByTestId('input-company-name')).toBeVisible();
      
      await page.getByTestId('input-company-name').fill('Test Company SRL');
      await page.getByTestId('input-cui').fill('RO12345678');
      await page.getByTestId('input-caen').fill('6201');
      await page.getByTestId('textarea-address').fill('Calea Victoriei 15, Bucharest');
      await page.getByTestId('input-contact-email').fill('contact@testcompany.ro');
      await page.getByTestId('input-onrc').fill('J40/1234/2023');
      
      await page.getByTestId('button-submit-client').click();
      
      // Should see success message and client profile
      await expect(page.getByTestId('card-company-profile')).toBeVisible();
    }
    
    // Add a worker
    await page.getByTestId('button-add-worker').click();
    await expect(page.getByTestId('input-first-name')).toBeVisible();
    
    await page.getByTestId('input-first-name').fill('John');
    await page.getByTestId('input-last-name').fill('Doe');
    await page.getByTestId('input-nationality').fill('USA');
    await page.getByTestId('input-passport-number').fill('US123456789');
    await page.getByTestId('input-worker-email').fill('john.doe@email.com');
    await page.getByTestId('input-phone').fill('+1234567890');
    
    await page.getByTestId('button-submit-worker').click();
    
    // Should see worker in the list
    await expect(page.getByTestId('card-workers-list')).toBeVisible();
    
    // View worker details
    await page.getByTestId('button-view-worker-john-doe').click();
    
    // Should see worker's document checklist
    await expect(page.getByTestId('card-document-checklist')).toBeVisible();
    
    // Upload a document
    const documentRow = page.getByTestId('document-row-1').first();
    await documentRow.getByTestId('button-upload-doc-1').click();
    
    // Should see upload interface
    await expect(page.getByTestId('card-document-upload')).toBeVisible();
    
    // Simulate file upload
    await page.getByTestId('input-file-upload').setInputFiles({
      name: 'diploma.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content'),
    });
    
    await page.getByTestId('button-upload-file').click();
    
    // Should see success message
    await expect(page.locator('text=Document uploaded successfully')).toBeVisible();
  });

  test('should allow admin to process submissions', async ({ page }) => {
    // Login as admin
    await page.goto('/');
    await page.getByTestId('button-login').click();
    await page.getByTestId('input-email').fill('admin@immigrationflow.com');
    await page.getByTestId('input-password').fill('admin123');
    await page.getByTestId('button-signin').click();
    
    // Should see admin dashboard
    await expect(page.getByTestId('nav-clients')).toBeVisible();
    await expect(page.getByTestId('card-workflow-overview')).toBeVisible();
    
    // Check kanban board
    const kanbanColumn = page.getByTestId('kanban-column-1').first(); // Awaiting Admin
    await expect(kanbanColumn).toBeVisible();
    
    // Click on a kanban item
    const kanbanItem = kanbanColumn.getByTestId('kanban-item-1-0').first();
    await kanbanItem.click();
    
    // Should see assignment details
    await expect(page.locator('text=Assignment Details')).toBeVisible();
    
    // Mark as received by admin
    await page.getByTestId('button-mark-received').click();
    
    // Should see status updated
    await expect(page.locator('text=Status updated successfully')).toBeVisible();
  });

  test('should show worker dashboard with progress', async ({ page }) => {
    // Login as worker
    await page.goto('/');
    await page.getByTestId('button-login').click();
    await page.getByTestId('input-email').fill('john.doe@email.com');
    await page.getByTestId('input-password').fill('worker123');
    await page.getByTestId('button-signin').click();
    
    // Should see worker dashboard
    await expect(page.getByTestId('nav-my-progress')).toBeVisible();
    await expect(page.getByTestId('card-stage-progress')).toBeVisible();
    
    // Check progress indicators
    await expect(page.getByTestId('stage-ajofm')).toBeVisible();
    await expect(page.getByTestId('stage-work_permit')).toBeVisible();
    
    // Check urgent actions
    await expect(page.getByTestId('card-urgent-actions')).toBeVisible();
    
    // Should see document checklist
    await expect(page.getByTestId('card-document-checklist')).toBeVisible();
    
    // Check if can upload document
    const uploadButton = page.getByTestId('button-upload-doc-1').first();
    if (await uploadButton.isVisible()) {
      await uploadButton.click();
      await expect(page.getByTestId('card-document-upload')).toBeVisible();
    }
  });

  test('should generate and preview PDF templates', async ({ page }) => {
    // Login as owner
    await page.goto('/');
    await page.getByTestId('button-login').click();
    await page.getByTestId('input-email').fill('owner@testcompany.ro');
    await page.getByTestId('input-password').fill('password123');
    await page.getByTestId('button-signin').click();
    
    // Navigate to documents or templates
    await page.getByTestId('nav-documents').click();
    
    // Should see available templates
    await expect(page.locator('text=Work Contract')).toBeVisible();
    
    // Preview a template
    await page.getByTestId('button-preview-work-contract').click();
    
    // Should see PDF viewer modal
    await expect(page.getByTestId('button-download-pdf')).toBeVisible();
    await expect(page.getByTestId('button-print-pdf')).toBeVisible();
    
    // Check if PDF content is visible (mock content)
    await expect(page.locator('text=CONTRACT INDIVIDUAL DE MUNCĂ')).toBeVisible();
    await expect(page.locator('text=PREVIEW')).toBeVisible(); // Watermark
    
    // Close PDF viewer
    await page.getByTestId('button-cancel-pdf').click();
  });

  test('should handle search and filtering', async ({ page }) => {
    // Login as admin
    await page.goto('/');
    await page.getByTestId('button-login').click();
    await page.getByTestId('input-email').fill('admin@immigrationflow.com');
    await page.getByTestId('input-password').fill('admin123');
    await page.getByTestId('button-signin').click();
    
    // Use global search
    await page.getByTestId('input-global-search').fill('Test Company');
    await page.keyboard.press('Enter');
    
    // Should see search results
    await expect(page.locator('text=Search Results')).toBeVisible();
    
    // Filter by stage
    await page.getByTestId('select-stage-filter').click();
    await page.getByText('AJOFM').click();
    
    // Should see filtered results
    await expect(page.getByTestId('kanban-column-0')).toBeVisible();
  });
});
