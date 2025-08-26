import { describe, it, expect } from 'vitest';
import { pdfService } from '../server/services/pdfService';
import type { TemplateData } from '../server/services/pdfService';

describe('PDF Generation Tests', () => {
  const mockTemplateData: TemplateData = {
    client: {
      companyName: 'Test Company SRL',
      cui: 'RO12345678',
      address: 'Test Address 123, Bucharest',
      caen: '6201',
      contactEmail: 'contact@testcompany.ro',
      onrc: 'J40/1234/2023',
    },
    worker: {
      firstName: 'John',
      lastName: 'Doe',
      nationality: 'USA',
      passportNumber: 'US123456789',
      email: 'john.doe@email.com',
      phone: '+1234567890',
    },
    metadata: {
      generatedAt: new Date(),
      generatedBy: 'test-user-id',
      watermark: 'TEST',
    },
  };

  it('should generate work contract PDF', async () => {
    const pdfBuffer = await pdfService.generatePDF(
      'work_contract_template',
      mockTemplateData
    );

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
    
    // Check PDF header
    const pdfHeader = pdfBuffer.subarray(0, 4).toString();
    expect(pdfHeader).toBe('%PDF');
  });

  it('should generate power of attorney PDF', async () => {
    const pdfBuffer = await pdfService.generatePDF(
      'power_of_attorney_template',
      mockTemplateData
    );

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
    
    // Check PDF header
    const pdfHeader = pdfBuffer.subarray(0, 4).toString();
    expect(pdfHeader).toBe('%PDF');
  });

  it('should generate job description PDF', async () => {
    const pdfBuffer = await pdfService.generatePDF(
      'job_description_template',
      mockTemplateData
    );

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('should generate visa application PDF', async () => {
    const pdfBuffer = await pdfService.generatePDF(
      'visa_application_form',
      mockTemplateData
    );

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('should generate residence application PDF', async () => {
    const pdfBuffer = await pdfService.generatePDF(
      'residence_application_template',
      mockTemplateData
    );

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('should throw error for unknown template', async () => {
    await expect(
      pdfService.generatePDF('unknown_template', mockTemplateData)
    ).rejects.toThrow('Unknown template: unknown_template');
  });

  it('should handle missing client data gracefully', async () => {
    const incompleteData: TemplateData = {
      worker: mockTemplateData.worker,
      metadata: mockTemplateData.metadata,
    };

    const pdfBuffer = await pdfService.generatePDF(
      'work_contract_template',
      incompleteData
    );

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });
});
