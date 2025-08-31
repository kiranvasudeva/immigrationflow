import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/contexts/I18nProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Workflow, 
  Plus, 
  Trash2, 
  Search,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Link,
  Unlink
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  nationality: string;
  assignedWorkflowIds: string[];
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  estimatedDays: number | null;
  isActive: boolean;
}

interface WorkerWorkflowProgress {
  id: string;
  workerId: string;
  templateId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'paused' | 'cancelled';
  startedAt: Date;
  completedAt: Date | null;
  notes: string | null;
}

export default function WorkerWorkflowAssignments() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('');
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);

  // Fetch workers
  const { data: workers = [], isLoading: workersLoading } = useQuery({
    queryKey: ['/api/workers'],
    staleTime: 5 * 60 * 1000,
  });

  // Fetch workflow templates
  const { data: workflowTemplates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/workflow-templates'],
    staleTime: 5 * 60 * 1000,
  });

  // Link worker to workflow mutation
  const linkMutation = useMutation({
    mutationFn: async ({ workerId, templateId }: { workerId: string; templateId: string }) => {
      return apiRequest(`/api/workers/${workerId}/workflows/${templateId}/link`, 'POST');
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Worker successfully linked to workflow",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workers'] });
      setSelectedWorkers([]);
      setSelectedWorkflow('');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to link worker to workflow",
        variant: "destructive",
      });
    },
  });

  // Unlink worker from workflow mutation
  const unlinkMutation = useMutation({
    mutationFn: async ({ workerId, templateId }: { workerId: string; templateId: string }) => {
      return apiRequest(`/api/workers/${workerId}/workflows/${templateId}/unlink`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Worker successfully unlinked from workflow",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unlink worker from workflow",
        variant: "destructive",
      });
    },
  });

  // Filter workers based on search term
  const filteredWorkers = (workers as Worker[]).filter((worker: Worker) =>
    `${worker.firstName} ${worker.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLinkWorkers = () => {
    if (!selectedWorkflow || selectedWorkers.length === 0) {
      toast({
        title: "Error",
        description: "Please select a workflow and at least one worker",
        variant: "destructive",
      });
      return;
    }

    selectedWorkers.forEach(workerId => {
      linkMutation.mutate({ workerId, templateId: selectedWorkflow });
    });
  };

  const handleUnlinkWorker = (workerId: string, templateId: string) => {
    unlinkMutation.mutate({ workerId, templateId });
  };

  const getWorkflowTemplate = (templateId: string) => {
    return (workflowTemplates as WorkflowTemplate[]).find((template: WorkflowTemplate) => template.id === templateId);
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      not_started: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    const statusIcons = {
      not_started: Clock,
      in_progress: AlertCircle,
      completed: CheckCircle2,
      paused: Clock,
      cancelled: AlertCircle,
    };

    const Icon = statusIcons[status as keyof typeof statusIcons] || Clock;
    const colorClass = statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';

    return (
      <Badge className={`${colorClass} gap-1`}>
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (workersLoading || templatesLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bulk Assignment Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Link className="h-5 w-5" />
            Link Workers to Workflows
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Select Workflow Template</Label>
              <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a workflow..." />
                </SelectTrigger>
                <SelectContent>
                  {(workflowTemplates as WorkflowTemplate[]).map((template: WorkflowTemplate) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <Workflow className="h-4 w-4" />
                        <span>{template.name}</span>
                        {template.estimatedDays && (
                          <Badge variant="outline" className="text-xs">
                            {template.estimatedDays} days
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Search Workers</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-workers"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Select Workers</Label>
            <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
              {filteredWorkers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No workers found</p>
              ) : (
                <div className="space-y-2">
                  {filteredWorkers.map((worker: Worker) => (
                    <label key={worker.id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={selectedWorkers.includes(worker.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedWorkers([...selectedWorkers, worker.id]);
                          } else {
                            setSelectedWorkers(selectedWorkers.filter(id => id !== worker.id));
                          }
                        }}
                        className="rounded"
                        data-testid={`checkbox-worker-${worker.id}`}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{`${worker.firstName} ${worker.lastName}`}</div>
                        <div className="text-sm text-gray-500">{worker.email || 'No email'}</div>
                      </div>
                      <Badge variant="outline">
                        {worker.assignedWorkflowIds?.length || 0} workflows
                      </Badge>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={handleLinkWorkers}
              disabled={!selectedWorkflow || selectedWorkers.length === 0 || linkMutation.isPending}
              data-testid="button-link-workers"
            >
              <Plus className="h-4 w-4 mr-2" />
              Link Selected Workers
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserCheck className="h-5 w-5" />
            Current Worker-Workflow Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(workers as Worker[]).length === 0 ? (
              <p className="text-center text-gray-500 py-8">No workers found</p>
            ) : (
              (workers as Worker[]).map((worker: Worker) => (
                <Card key={worker.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{`${worker.firstName} ${worker.lastName}`}</h4>
                        <p className="text-sm text-gray-600">{worker.email || 'No email'}</p>
                        {worker.position && (
                          <Badge variant="outline" className="mt-1">
                            {worker.position}
                          </Badge>
                        )}
                      </div>
                      <Badge variant="secondary">
                        {worker.assignedWorkflowIds?.length || 0} active workflows
                      </Badge>
                    </div>

                    {worker.assignedWorkflowIds && worker.assignedWorkflowIds.length > 0 ? (
                      <div className="space-y-2">
                        <Separator />
                        <Label className="text-sm font-medium">Assigned Workflows:</Label>
                        <div className="grid gap-2">
                          {worker.assignedWorkflowIds.map((templateId: string) => {
                            const template = getWorkflowTemplate(templateId);
                            if (!template) return null;

                            return (
                              <div key={templateId} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <Workflow className="h-4 w-4 text-blue-500" />
                                  <div>
                                    <span className="font-medium">{template.name}</span>
                                    {template.category && (
                                      <Badge variant="outline" className="ml-2 text-xs">
                                        {template.category}
                                      </Badge>
                                    )}
                                    {template.description && (
                                      <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getStatusBadge('in_progress')}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleUnlinkWorker(worker.id, templateId)}
                                    disabled={unlinkMutation.isPending}
                                    data-testid={`button-unlink-${worker.id}-${templateId}`}
                                  >
                                    <Unlink className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No workflows assigned</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Workflow Templates Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Workflow className="h-5 w-5" />
            Available Workflow Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(workflowTemplates as WorkflowTemplate[]).map((template: WorkflowTemplate) => (
              <Card key={template.id} className="border">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{template.name}</h4>
                      <Badge variant={template.isActive ? "default" : "secondary"}>
                        {template.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    
                    {template.description && (
                      <p className="text-sm text-gray-600">{template.description}</p>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{template.category}</Badge>
                      {template.estimatedDays && (
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {template.estimatedDays} days
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {(workers as Worker[]).filter((w: Worker) => w.assignedWorkflowIds?.includes(template.id)).length} workers assigned
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}