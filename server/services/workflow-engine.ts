import { storage } from '../storage';
import { WorkflowRule, Assignment } from '@shared/schema';

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains' | 'is_empty' | 'is_not_empty';
  value: any;
}

export interface WorkflowAction {
  type: 'update_status' | 'assign_to_user' | 'send_notification' | 'create_task' | 'update_field' | 'trigger_api_call';
  parameters: Record<string, any>;
}

export interface ProcessedWorkflowRule extends WorkflowRule {
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
}

export class WorkflowEngine {
  async processAssignmentWorkflow(assignmentId: string, triggerEvent: string) {
    try {
      const assignment = await storage.getAssignment(assignmentId);
      if (!assignment) {
        console.error(`Assignment not found: ${assignmentId}`);
        return;
      }

      // Get all active workflow rules for this trigger
      const rules = await storage.getAllWorkflowRules();
      const applicableRules = rules.filter(rule => 
        rule.isActive && 
        rule.triggerEvent === triggerEvent
      );

      for (const rule of applicableRules) {
        await this.evaluateAndExecuteRule(rule, assignment, triggerEvent);
      }
    } catch (error) {
      console.error('Error processing workflow:', error);
    }
  }

  private async evaluateAndExecuteRule(rule: WorkflowRule, assignment: Assignment, triggerEvent: string) {
    try {
      // Parse rule conditions and actions
      const conditions = this.parseConditions(rule.conditions);
      const actions = this.parseActions(rule.actions);

      // Evaluate conditions
      const conditionsMatch = await this.evaluateConditions(conditions, assignment);
      
      if (conditionsMatch) {
        console.log(`Executing workflow rule: ${rule.name} for assignment ${assignment.id}`);
        
        // Execute actions
        await this.executeActions(actions, assignment, rule);
        
        // Log workflow execution
        await storage.createAnalyticsEvent({
          eventType: 'WORKFLOW_EXECUTED',
          userId: rule.createdByUserId,
          clientProfileId: assignment.clientProfileId,
          workerId: assignment.workerId,
          metadata: {
            ruleName: rule.name,
            ruleId: rule.id,
            triggerEvent,
            assignmentId: assignment.id
          }
        });
      }
    } catch (error) {
      console.error(`Error executing workflow rule ${rule.name}:`, error);
    }
  }

  private parseConditions(conditionsJson: any): WorkflowCondition[] {
    try {
      if (typeof conditionsJson === 'string') {
        return JSON.parse(conditionsJson);
      }
      return conditionsJson || [];
    } catch (error) {
      console.error('Error parsing workflow conditions:', error);
      return [];
    }
  }

  private parseActions(actionsJson: any): WorkflowAction[] {
    try {
      if (typeof actionsJson === 'string') {
        return JSON.parse(actionsJson);
      }
      return actionsJson || [];
    } catch (error) {
      console.error('Error parsing workflow actions:', error);
      return [];
    }
  }

  private async evaluateConditions(conditions: WorkflowCondition[], assignment: Assignment): Promise<boolean> {
    if (conditions.length === 0) return true;

    for (const condition of conditions) {
      const fieldValue = this.getAssignmentFieldValue(assignment, condition.field);
      const conditionMet = this.evaluateCondition(condition, fieldValue);
      
      if (!conditionMet) {
        return false; // All conditions must be met (AND logic)
      }
    }
    
    return true;
  }

  private getAssignmentFieldValue(assignment: Assignment, fieldPath: string): any {
    const paths = fieldPath.split('.');
    let value: any = assignment;
    
    for (const path of paths) {
      if (value && typeof value === 'object' && path in value) {
        value = (value as any)[path];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  private evaluateCondition(condition: WorkflowCondition, fieldValue: any): boolean {
    switch (condition.operator) {
      case 'equals':
        return fieldValue == condition.value;
      
      case 'not_equals':
        return fieldValue != condition.value;
      
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
      
      case 'not_contains':
        return !String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
      
      case 'is_empty':
        return !fieldValue || fieldValue === '' || (Array.isArray(fieldValue) && fieldValue.length === 0);
      
      case 'is_not_empty':
        return fieldValue && fieldValue !== '' && (!Array.isArray(fieldValue) || fieldValue.length > 0);
      
      default:
        console.warn(`Unknown condition operator: ${condition.operator}`);
        return false;
    }
  }

  private async executeActions(actions: WorkflowAction[], assignment: Assignment, rule: WorkflowRule) {
    for (const action of actions) {
      try {
        await this.executeAction(action, assignment, rule);
      } catch (error) {
        console.error(`Error executing action ${action.type}:`, error);
      }
    }
  }

  private async executeAction(action: WorkflowAction, assignment: Assignment, rule: WorkflowRule) {
    switch (action.type) {
      case 'update_status':
        await this.updateAssignmentStatus(assignment, action.parameters.status);
        break;
      
      case 'assign_to_user':
        await this.reassignToUser(assignment, action.parameters.userId);
        break;
      
      case 'send_notification':
        await this.sendNotification(assignment, action.parameters);
        break;
      
      case 'create_task':
        await this.createTask(assignment, action.parameters);
        break;
      
      case 'update_field':
        await this.updateAssignmentField(assignment, action.parameters);
        break;
      
      case 'trigger_api_call':
        await this.triggerApiCall(assignment, action.parameters);
        break;
      
      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  }

  private async updateAssignmentStatus(assignment: Assignment, newStatus: string) {
    await storage.updateAssignment(assignment.id, { status: newStatus as any });
    console.log(`Updated assignment ${assignment.id} status to ${newStatus}`);
  }

  private async reassignToUser(assignment: Assignment, userId: string) {
    await storage.updateAssignment(assignment.id, { assignedToUserId: userId });
    console.log(`Reassigned assignment ${assignment.id} to user ${userId}`);
  }

  private async sendNotification(assignment: Assignment, parameters: Record<string, any>) {
    // Integrate with notification system (email, SMS, in-app)
    console.log(`Sending notification for assignment ${assignment.id}:`, parameters);
    
    // Create analytics event for notification
    await storage.createAnalyticsEvent({
      eventType: 'NOTIFICATION_SENT',
      userId: assignment.assignedToUserId || '',
      clientProfileId: assignment.clientProfileId,
      workerId: assignment.workerId,
      metadata: {
        notificationType: parameters.type,
        message: parameters.message,
        assignmentId: assignment.id
      }
    });
  }

  private async createTask(assignment: Assignment, parameters: Record<string, any>) {
    console.log(`Creating task for assignment ${assignment.id}:`, parameters);
    
    // Create analytics event for task creation
    await storage.createAnalyticsEvent({
      eventType: 'TASK_CREATED',
      userId: assignment.assignedToUserId || '',
      clientProfileId: assignment.clientProfileId,
      workerId: assignment.workerId,
      metadata: {
        taskTitle: parameters.title,
        taskDescription: parameters.description,
        assignmentId: assignment.id
      }
    });
  }

  private async updateAssignmentField(assignment: Assignment, parameters: Record<string, any>) {
    const { field, value } = parameters;
    const updateData: any = {};
    updateData[field] = value;
    
    await storage.updateAssignment(assignment.id, updateData);
    console.log(`Updated assignment ${assignment.id} field ${field} to ${value}`);
  }

  private async triggerApiCall(assignment: Assignment, parameters: Record<string, any>) {
    try {
      const { url, method, headers, body } = parameters;
      
      const response = await fetch(url, {
        method: method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: body ? JSON.stringify(body) : undefined
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      console.log(`API call successful for assignment ${assignment.id}: ${method} ${url}`);
      
      // Log API call
      await storage.createAnalyticsEvent({
        eventType: 'API_CALL_TRIGGERED',
        userId: assignment.assignedToUserId || '',
        clientProfileId: assignment.clientProfileId,
        workerId: assignment.workerId,
        metadata: {
          url,
          method,
          status: response.status,
          assignmentId: assignment.id
        }
      });
    } catch (error) {
      console.error(`API call failed for assignment ${assignment.id}:`, error);
    }
  }

  // Predefined workflow templates for common scenarios
  static getWorkflowTemplates() {
    return [
      {
        name: 'Auto-approve simple cases',
        description: 'Automatically approve assignments for experienced workers with complete documentation',
        triggerEvent: 'ASSIGNMENT_CREATED',
        conditions: [
          { field: 'worker.experienceLevel', operator: 'equals', value: 'EXPERIENCED' },
          { field: 'documentCompleteness', operator: 'greater_than', value: 90 }
        ],
        actions: [
          { type: 'update_status', parameters: { status: 'ACCEPTED' } },
          { type: 'send_notification', parameters: { type: 'email', message: 'Your application has been auto-approved!' } }
        ]
      },
      {
        name: 'Flag urgent cases',
        description: 'Flag assignments with urgent deadlines for immediate attention',
        triggerEvent: 'ASSIGNMENT_CREATED',
        conditions: [
          { field: 'urgencyLevel', operator: 'equals', value: 'HIGH' },
          { field: 'daysUntilDeadline', operator: 'less_than', value: 7 }
        ],
        actions: [
          { type: 'update_field', parameters: { field: 'priority', value: 'URGENT' } },
          { type: 'assign_to_user', parameters: { userId: 'senior-specialist-id' } },
          { type: 'send_notification', parameters: { type: 'slack', message: 'Urgent case assigned!' } }
        ]
      },
      {
        name: 'Document expiry reminder',
        description: 'Send reminders when documents are about to expire',
        triggerEvent: 'DOCUMENT_CHECK',
        conditions: [
          { field: 'daysUntilExpiry', operator: 'less_than', value: 30 },
          { field: 'daysUntilExpiry', operator: 'greater_than', value: 0 }
        ],
        actions: [
          { type: 'send_notification', parameters: { type: 'email', message: 'Your documents will expire soon!' } },
          { type: 'create_task', parameters: { title: 'Renew documents', description: 'Documents expiring soon' } }
        ]
      }
    ];
  }
}

export const workflowEngine = new WorkflowEngine();