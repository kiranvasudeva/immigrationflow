import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { auditMiddleware } from '../middleware/auth';
import { pdfService } from '../services/pdfService';
import { s3Service } from '../services/s3Service';
import { storage } from '../storage';
import { z } from 'zod';

const router = Router();

// Get available templates
router.get('/', isAuthenticated, async (req: any, res) => {
  try {
    const templates = [
      {
        key: 'work_contract_template',
        name: 'Work Contract',
        description: 'Individual employment contract template',
        autoPopulate: true,
        fields: ['companyName', 'cui', 'address', 'workerName', 'nationality', 'passportNumber']
      },
      {
        key: 'power_of_attorney_template',
        name: 'Power of Attorney',
        description: 'Power of attorney for legal representation',
        autoPopulate: true,
        fields: ['workerName', 'nationality', 'passportNumber']
      },
      {
        key: 'job_description_template',
        name: 'Job Description',
        description: 'Detailed job description for AJOFM',
        autoPopulate: true,
        fields: ['companyName', 'cui', 'caen', 'address']
      },
      {
        key: 'visa_application_form',
        name: 'Visa Application Form',
        description: 'Long-stay visa application form',
        autoPopulate: true,
        fields: ['workerName', 'nationality', 'passportNumber', 'companyName']
      },
      {
        key: 'residence_application_template',
        name: 'Residence Application',
        description: 'Residence permit application form',
        autoPopulate: true,
        fields: ['workerName', 'nationality', 'passportNumber', 'companyName']
      }
    ];

    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ message: 'Failed to fetch templates' });
  }
});

// Generate PDF from template
router.post('/generate', isAuthenticated, auditMiddleware, async (req: any, res) => {
  try {
    const schema = z.object({
      templateKey: z.string().min(1),
      clientProfileId: z.string().uuid(),
      workerId: z.string().uuid().optional(),
    });

    const { templateKey, clientProfileId, workerId } = schema.parse(req.body);
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);

    // Get client profile
    const client = await storage.getClientProfile(clientProfileId);
    if (!client) {
      return res.status(404).json({ message: 'Client profile not found' });
    }

    // Check authorization
    if (user?.role !== 'ADMIN' && client.ownerUserId !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Get worker if specified
    let worker = null;
    if (workerId) {
      worker = await storage.getWorker(workerId);
      if (!worker || worker.clientProfileId !== clientProfileId) {
        return res.status(404).json({ message: 'Worker not found or not associated with client' });
      }
    }

    // Prepare template data
    const templateData = {
      client: {
        companyName: client.companyName,
        cui: client.cui,
        address: client.address,
        caen: client.caen,
        contactEmail: client.contactEmail,
        onrc: client.onrc || undefined,
      },
      worker: worker ? {
        firstName: worker.firstName,
        lastName: worker.lastName,
        nationality: worker.nationality,
        passportNumber: worker.passportNumber,
        email: worker.email || undefined,
        phone: worker.phone || undefined,
      } : undefined,
      metadata: {
        generatedAt: new Date(),
        generatedBy: userId,
        watermark: worker?.email || client.contactEmail || 'PREVIEW',
      }
    };

    // Generate PDF
    const pdfBuffer = await pdfService.generatePDF(templateKey, templateData);
    
    // Save to S3
    const s3Key = s3Service.generateFileKey('generated', `${templateKey}.pdf`);
    await pdfService.savePDFToS3(pdfBuffer, s3Key);
    
    // Generate download URL
    const downloadUrl = await s3Service.generateDownloadUrl(s3Key, 3600);

    res.json({
      downloadUrl,
      fileName: `${templateKey}.pdf`,
      s3Key,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Failed to generate PDF' });
  }
});

// Preview template (returns PDF buffer directly)
router.post('/preview', isAuthenticated, auditMiddleware, async (req: any, res) => {
  try {
    const schema = z.object({
      templateKey: z.string().min(1),
      clientProfileId: z.string().uuid(),
      workerId: z.string().uuid().optional(),
    });

    const { templateKey, clientProfileId, workerId } = schema.parse(req.body);
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);

    // Get client profile
    const client = await storage.getClientProfile(clientProfileId);
    if (!client) {
      return res.status(404).json({ message: 'Client profile not found' });
    }

    // Check authorization
    if (user?.role !== 'ADMIN' && client.ownerUserId !== userId) {
      // Workers can preview their own documents
      if (user?.role === 'WORKER' && workerId === userId) {
        // Allow worker to preview
      } else {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    }

    // Get worker if specified
    let worker = null;
    if (workerId) {
      worker = await storage.getWorker(workerId);
      if (!worker || worker.clientProfileId !== clientProfileId) {
        return res.status(404).json({ message: 'Worker not found or not associated with client' });
      }
    }

    // Prepare template data
    const templateData = {
      client: {
        companyName: client.companyName,
        cui: client.cui,
        address: client.address,
        caen: client.caen,
        contactEmail: client.contactEmail,
        onrc: client.onrc || undefined,
      },
      worker: worker ? {
        firstName: worker.firstName,
        lastName: worker.lastName,
        nationality: worker.nationality,
        passportNumber: worker.passportNumber,
        email: worker.email || undefined,
        phone: worker.phone || undefined,
      } : undefined,
      metadata: {
        generatedAt: new Date(),
        generatedBy: userId,
        watermark: 'PREVIEW',
      }
    };

    // Generate PDF
    const pdfBuffer = await pdfService.generatePDF(templateKey, templateData);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${templateKey}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error previewing template:', error);
    res.status(500).json({ message: 'Failed to preview template' });
  }
});

export { router as templatesRouter };
