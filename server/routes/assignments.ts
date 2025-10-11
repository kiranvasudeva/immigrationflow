import { Router } from 'express';
import { isAuthenticated, auditMiddleware } from '../middleware/auth';
import { storage } from '../storage';
import { emailService } from '../services/emailService';
import { z } from 'zod';
import multer from 'multer';
import { s3Service } from '../services/s3Service';
import { v4 as uuidv4 } from 'uuid';
import Tesseract from 'tesseract.js';
import fs from 'fs';
import path from 'path';

const router = Router();

// Update assignment status
router.patch('/:id/status', isAuthenticated, auditMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const schema = z.object({
      status: z.enum([
        'NOT_STARTED',
        'AWAITING_UPLOAD', 
        'SUBMITTED_BY_USER',
        'RECEIVED_BY_ADMIN',
        'SUBMITTED_TO_INSTITUTION_DIGITAL',
        'SUBMITTED_TO_INSTITUTION_COURIER',
        'ACCEPTED',
        'REJECTED'
      ]),
      institution: z.string().optional(),
      submissionChannel: z.string().optional(),
      receiptNumber: z.string().optional(),
      courierAwb: z.string().optional(),
      courierName: z.string().optional(),
      rejectedReason: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);

    const assignment = await storage.getAssignment(id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Only admin can update most statuses
    if (user?.role !== 'ADMIN') {
      // Non-admin users can only mark as submitted by user
      if (data.status !== 'SUBMITTED_BY_USER') {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      // Check if user has access to this assignment
      const client = await storage.getClientProfile(assignment.clientProfileId);
      const isOwner = client?.ownerUserId === userId;
      const isWorker = assignment.workerId === userId;
      
      if (!isOwner && !isWorker) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    }

    // Validate that SUBMITTED_BY_USER status has documents
    if (data.status === 'SUBMITTED_BY_USER') {
      const existingDocuments = await storage.getDocumentFilesByAssignment(id);
      if (existingDocuments.length === 0) {
        return res.status(400).json({ 
          message: 'Cannot mark as submitted without uploading documents first' 
        });
      }
    }

    // Update assignment with appropriate timestamps
    const updateData: any = { ...data };
    
    if (data.status === 'SUBMITTED_BY_USER' || 
        data.status === 'SUBMITTED_TO_INSTITUTION_DIGITAL' || 
        data.status === 'SUBMITTED_TO_INSTITUTION_COURIER') {
      updateData.submittedAt = new Date();
    }
    
    if (data.status === 'ACCEPTED') {
      updateData.approvedAt = new Date();
    }

    const updatedAssignment = await storage.updateAssignment(id, updateData);

    // Send notification email for status changes
    if (user?.role === 'ADMIN' && (data.status === 'ACCEPTED' || data.status === 'REJECTED')) {
      try {
        // Get worker details for email
        if (assignment.workerId) {
          const worker = await storage.getWorker(assignment.workerId);
          const requirement = await storage.getRequirement(assignment.requirementId);
          
          if (worker?.email && requirement) {
            const template = emailService.getStatusUpdateTemplate();
            await emailService.sendEmail(worker.email, template, {
              workerName: `${worker.firstName} ${worker.lastName}`,
              documentName: requirement.title,
              loginUrl: `${process.env.APP_URL}/login`
            });
          }
        }
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.json(updatedAssignment);
  } catch (error) {
    console.error('Error updating assignment status:', error);
    res.status(500).json({ message: 'Failed to update assignment status' });
  }
});

// Get assignment details with related data
router.get('/:id', isAuthenticated, auditMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);

    const assignment = await storage.getAssignment(id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check authorization
    if (user?.role !== 'ADMIN') {
      const client = await storage.getClientProfile(assignment.clientProfileId);
      const isOwner = client?.ownerUserId === userId;
      const isWorker = assignment.workerId === userId;
      
      if (!isOwner && !isWorker) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    }

    // Get related data
    const [requirement, client, worker, documents] = await Promise.all([
      storage.getRequirement(assignment.requirementId),
      storage.getClientProfile(assignment.clientProfileId),
      assignment.workerId ? storage.getWorker(assignment.workerId) : null,
      storage.getDocumentFilesByAssignment(id)
    ]);

    const enrichedAssignment = {
      ...assignment,
      requirement,
      client,
      worker,
      documents
    };

    res.json(enrichedAssignment);
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ message: 'Failed to fetch assignment' });
  }
});

// Get assignments by status for kanban view
router.get('/status/:status', isAuthenticated, auditMiddleware, async (req: any, res) => {
  try {
    const { status } = req.params;
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);

    if (user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const assignments = await storage.getAssignmentsByStatus(status);

    // Enrich assignments with related data
    const enrichedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        const [requirement, client, worker] = await Promise.all([
          storage.getRequirement(assignment.requirementId),
          storage.getClientProfile(assignment.clientProfileId),
          assignment.workerId ? storage.getWorker(assignment.workerId) : null,
        ]);

        return {
          ...assignment,
          requirement,
          client,
          worker
        };
      })
    );

    res.json(enrichedAssignments);
  } catch (error) {
    console.error('Error fetching assignments by status:', error);
    res.status(500).json({ message: 'Failed to fetch assignments' });
  }
});

// Document upload endpoint using multipart form data

// Configure multer for file uploads
const upload = multer({
  dest: 'temp/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  }
});

router.post('/:id/documents', isAuthenticated, auditMiddleware, upload.array('files', 10), async (req: any, res) => {
  try {
    const { id: assignmentId } = req.params;
    const { documentKind, documentType, scannedText, notes } = req.body;
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);

    // Verify assignment exists and user has access
    const assignment = await storage.getAssignment(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check authorization
    if (user?.role !== 'ADMIN') {
      const client = await storage.getClientProfile(assignment.clientProfileId);
      const isOwner = client?.ownerUserId === userId;
      const isWorker = assignment.workerId === userId;
      
      if (!isOwner && !isWorker) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    }

    const uploadedFiles = [];

    for (const file of files) {
      try {
        // Generate S3 key
        const fileExtension = path.extname(file.originalname);
        const s3Key = s3Service.generateFileKey('documents', `${uuidv4()}${fileExtension}`);
        
        // Upload to S3
        const fileBuffer = fs.readFileSync(file.path);
        await s3Service.uploadFile(s3Key, fileBuffer, file.mimetype);

        // Create document file record
        const documentFile = await storage.createDocumentFile({
          assignmentId,
          kind: documentKind || 'USER_UPLOAD',
          s3Key,
          fileName: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
          fileHash: '', // Could add file hash here
          uploadedByUserId: userId
        });

        // If we have scanned text and document type, save extracted data
        if (scannedText && documentType) {
          const extractedData = await storage.createExtractedDocumentData({
            documentFileId: documentFile.id,
            documentType: documentType as any,
            extractedText: scannedText,
            structuredData: null, // Could parse structured data here
            confidence: 85, // Default confidence for manual input
          });

          // Create basic field mappings if we can parse structured data
          // This could be enhanced with more sophisticated parsing
          if (documentType === 'BIRTH_CERTIFICATE' || documentType === 'PASSPORT' || documentType === 'ID_CARD') {
            // Could add field extraction logic here
            console.log('Structured data extraction could be added for:', documentType);
          }
        }

        uploadedFiles.push({
          id: documentFile.id,
          fileName: file.originalname,
          s3Key,
          mimeType: file.mimetype,
          fileSize: file.size
        });

        // Clean up temp file
        fs.unlinkSync(file.path);
      } catch (fileError) {
        console.error('Error uploading file:', fileError);
        // Clean up temp file on error
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    res.json({
      message: 'Documents uploaded successfully',
      files: uploadedFiles
    });

  } catch (error) {
    console.error('Error uploading documents:', error);
    
    // Clean up any temp files on error
    if (req.files) {
      const files = req.files as Express.Multer.File[];
      files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({ message: 'Failed to upload documents' });
  }
});

// Get documents for assignment - this route handles the URL format expected by DocumentViewer
router.get('/:assignmentId/documents', isAuthenticated, auditMiddleware, async (req: any, res) => {
  try {
    const { assignmentId } = req.params;
    
    const assignment = await storage.getAssignment(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check authorization
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    
    if (user?.role !== 'ADMIN') {
      const client = await storage.getClientProfile(assignment.clientProfileId);
      const isOwner = client?.ownerUserId === userId;
      const isWorker = assignment.workerId === userId;
      
      if (!isOwner && !isWorker) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    }

    const documents = await storage.getDocumentFilesByAssignment(assignmentId);
    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ message: 'Failed to fetch documents' });
  }
});

// Admin-only route to fix data inconsistencies: Reset assignments with "SUBMITTED_BY_USER" status but no documents
router.post('/fix-inconsistent-statuses', isAuthenticated, auditMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);

    // Only admin can run this fix
    if (user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized - Admin access required' });
    }

    // Find assignments with SUBMITTED_BY_USER status but no documents
    const inconsistentAssignments = await storage.getInconsistentAssignments();
    
    // Reset their status to AWAITING_UPLOAD
    const fixedCount = await storage.fixInconsistentAssignmentStatuses();

    res.json({
      message: `Fixed ${fixedCount} assignments with inconsistent status`,
      fixedAssignments: inconsistentAssignments.map(a => ({
        id: a.id,
        workerId: a.workerId,
        status: a.status
      }))
    });

  } catch (error) {
    console.error('Error fixing inconsistent assignment statuses:', error);
    res.status(500).json({ message: 'Failed to fix assignment statuses' });
  }
});

export { router as assignmentsRouter };
