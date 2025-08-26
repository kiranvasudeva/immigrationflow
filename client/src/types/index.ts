export interface DashboardStats {
  totalClients: number;
  activeWorkers: number;
  pendingActions: number;
  completedThisMonth: number;
}

export interface KanbanColumn {
  title: string;
  count: number;
  color: string;
  items: KanbanItem[];
}

export interface KanbanItem {
  client: string;
  worker: string;
  dueInfo: string;
  type: 'warning' | 'error' | 'info' | 'success';
}

export interface WorkerProgress {
  workerId: string;
  currentStage: string;
  progress: number;
  nextDeadline: string;
  nextTask: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  stage: string;
  status: 'SUBMITTED' | 'AWAITING_UPLOAD' | 'OVERDUE' | 'NOT_STARTED';
  dueDate: string;
}

export interface UrgentAction {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'urgent' | 'overdue';
}

export interface NextStep {
  id: string;
  title: string;
  description: string;
  dueDate: string;
}
