import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { auditMiddleware } from '../middleware/auth';
import { storage } from '../storage';
import { emailService } from '../services/emailService';
import { z } from 'zod';

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

export { router as assignmentsRouter };
