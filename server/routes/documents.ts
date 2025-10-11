import { Router } from 'express';
import { isAuthenticated, auditMiddleware } from '../middleware/auth';
import { s3Service } from '../services/s3Service';
import { storage } from '../storage';
import { z } from 'zod';

const router = Router();

// Generate signed upload URL
router.post('/upload-url', isAuthenticated, auditMiddleware, async (req: any, res) => {
  try {
    const schema = z.object({
      fileName: z.string().min(1),
      contentType: z.string().min(1),
      assignmentId: z.string().uuid(),
    });

    const { fileName, contentType, assignmentId } = schema.parse(req.body);
    
    // Verify user has access to this assignment
    const assignment = await storage.getAssignment(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    
    // Check authorization
    if (user?.role !== 'ADMIN') {
      const client = await storage.getClientProfile(assignment.clientProfileId);
      const isOwner = client?.ownerUserId === userId;
      const isWorker = assignment.workerId === userId;
      
      if (!isOwner && !isWorker) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    }

    // Generate S3 key and signed URL
    const key = s3Service.generateFileKey('documents', fileName);
    const uploadUrl = await s3Service.generateUploadUrl(key, contentType, 3600);

    res.json({
      uploadUrl,
      key,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ message: 'Failed to generate upload URL' });
  }
});

// Confirm document upload
router.post('/confirm-upload', isAuthenticated, auditMiddleware, async (req: any, res) => {
  try {
    const schema = z.object({
      assignmentId: z.string().uuid(),
      s3Key: z.string().min(1),
      fileName: z.string().min(1),
      contentType: z.string().min(1),
    });

    const { assignmentId, s3Key, fileName, contentType } = schema.parse(req.body);
    
    const userId = req.user.claims.sub;
    
    // Create document file record
    const documentFile = await storage.createDocumentFile({
      assignmentId,
      kind: 'USER_UPLOAD',
      s3Key,
      fileName,
      fileSize: 0, // Will be updated after upload
      fileHash: '', // Will be calculated after upload
      mimeType: contentType,
      scanResult: 'PENDING',
      uploadedByUserId: userId,
    });

    // Update assignment status
    await storage.updateAssignment(assignmentId, {
      status: 'SUBMITTED_BY_USER',
    });

    res.json(documentFile);
  } catch (error) {
    console.error('Error confirming upload:', error);
    res.status(500).json({ message: 'Failed to confirm upload' });
  }
});

// Generate download URL
router.get('/:fileId/download', isAuthenticated, auditMiddleware, async (req: any, res) => {
  try {
    const { fileId } = req.params;
    
    const documentFile = await storage.getDocumentFile(fileId);
    if (!documentFile) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check authorization
    const assignment = await storage.getAssignment(documentFile.assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

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

    const downloadUrl = await s3Service.generateDownloadUrl(documentFile.s3Key, 3600);
    
    res.json({
      downloadUrl,
      fileName: documentFile.fileName,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error('Error generating download URL:', error);
    res.status(500).json({ message: 'Failed to generate download URL' });
  }
});

// View document in browser
router.get('/:fileId/view', isAuthenticated, auditMiddleware, async (req: any, res) => {
  try {
    const { fileId } = req.params;
    
    const documentFile = await storage.getDocumentFile(fileId);
    if (!documentFile) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check authorization
    const assignment = await storage.getAssignment(documentFile.assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

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

    // Get the file from S3 and stream it directly
    const fileStream = await s3Service.getFileStream(documentFile.s3Key);
    
    // Set appropriate headers for viewing in browser
    res.setHeader('Content-Type', documentFile.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${documentFile.fileName}"`);
    
    // Stream the file
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error viewing document:', error);
    res.status(500).json({ message: 'Failed to view document' });
  }
});

// Get documents for assignment
router.get('/assignment/:assignmentId', isAuthenticated, auditMiddleware, async (req: any, res) => {
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

// Update document status
router.put('/:documentId/status', isAuthenticated, auditMiddleware, async (req: any, res) => {
  try {
    const { documentId } = req.params;
    const schema = z.object({
      status: z.string().min(1),
      notes: z.string().optional(),
    });

    const { status, notes } = schema.parse(req.body);
    
    const documentFile = await storage.getDocumentFile(documentId);
    if (!documentFile) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check authorization
    const assignment = await storage.getAssignment(documentFile.assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    
    if (user?.role !== 'ADMIN') {
      const client = await storage.getClientProfile(assignment.clientProfileId);
      const isOwner = client?.ownerUserId === userId;
      
      if (!isOwner) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    }

    // Update document status (this would need to be implemented in storage)
    const updatedDocument = await storage.updateDocumentFileStatus(documentId, status, notes);
    
    res.json(updatedDocument);
  } catch (error) {
    console.error('Error updating document status:', error);
    res.status(500).json({ message: 'Failed to update document status' });
  }
});

// Delete document
router.delete('/:documentId', isAuthenticated, auditMiddleware, async (req: any, res) => {
  try {
    const { documentId } = req.params;
    
    const documentFile = await storage.getDocumentFile(documentId);
    if (!documentFile) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check authorization
    const assignment = await storage.getAssignment(documentFile.assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    
    if (user?.role !== 'ADMIN') {
      const client = await storage.getClientProfile(assignment.clientProfileId);
      const isOwner = client?.ownerUserId === userId;
      const isUploader = documentFile.uploadedByUserId === userId;
      
      if (!isOwner && !isUploader) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    }

    // Delete from S3 and database
    await s3Service.deleteFile(documentFile.s3Key);
    await storage.deleteDocumentFile(documentId);
    
    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Failed to delete document' });
  }
});

export { router as documentsRouter };
