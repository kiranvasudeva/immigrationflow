import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/contexts/I18nProvider';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  FileText, 
  Workflow, 
  Calendar, 
  Building, 
  CreditCard, 
  Plus, 
  Trash2, 
  Edit,
  Save,
  Shield,
  Bell,
  Globe,
  Clock,
  Euro,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  XCircle,
  UserCheck,
  ArrowLeft,
  GitBranch,
  ChevronDown,
  ChevronUp,
  Code,
  Upload,
  CheckSquare,
  ListChecks,
  X
} from 'lucide-react';
import PatraIcon from '@/components/icons/PatraIcon';
import WorkerWorkflowAssignments from '@/components/WorkerWorkflowAssignments';

function SettingsPage() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();

  usePageTitle(t('nav.settings'));
  const { setBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    setBreadcrumbs([
      { label: t('nav.dashboard'), href: '/' },
      { label: t('nav.settings'), href: '/settings' }
    ]);
  }, [setBreadcrumbs, t]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === 'ADMIN';
  const isOwner = user.role === 'OWNER';

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6" />
        <h1 className="text-2xl font-bold">{t('nav.settings')}</h1>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-6">
          <TabsTrigger value="general" className="text-xs lg:text-sm">General</TabsTrigger>
          <TabsTrigger value="workflows" className="text-xs lg:text-sm">Workflows</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs lg:text-sm">Notifications</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs lg:text-sm">Documents</TabsTrigger>
          {isAdmin && <TabsTrigger value="system" className="text-xs lg:text-sm">System</TabsTrigger>}
          <TabsTrigger value="assignments" className="text-xs lg:text-sm">Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <GeneralSettings />
        </TabsContent>

        <TabsContent value="workflows" className="space-y-6">
          <WorkflowManagement />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <DocumentSettings />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="system" className="space-y-6">
            <SystemSettings />
          </TabsContent>
        )}

        <TabsContent value="assignments" className="space-y-6">
          <WorkerWorkflowAssignments />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Clean hierarchical workflow management without buttons
function WorkflowManagement() {
  const { toast } = useToast();
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [expandedDocument, setExpandedDocument] = useState<string | null>(null);
  const [expandedChecklist, setExpandedChecklist] = useState<string | null>(null);
  const [editingDocument, setEditingDocument] = useState<string | null>(null);
  const [editingChecklist, setEditingChecklist] = useState<string | null>(null);
  const [editingDocumentData, setEditingDocumentData] = useState<any>({});
  const [editingChecklistData, setEditingChecklistData] = useState<any>({});
  
  const { data: workflows, isLoading } = useQuery({
    queryKey: ['/api/workflow-templates'],
    enabled: true
  });
  
  const { data: completeWorkflow } = useQuery({
    queryKey: ['/api/workflow-templates', selectedWorkflow?.id, 'complete'],
    queryFn: async () => {
      if (!selectedWorkflow) return null;
      const response = await fetch(`/api/workflow-templates/${selectedWorkflow.id}/complete`);
      if (!response.ok) {
        throw new Error('Failed to fetch workflow details');
      }
      return response.json();
    },
    enabled: !!selectedWorkflow
  });

  // Mutation for updating document requirements
  const updateDocumentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest(`/api/document-requirements/${id}`, 'PUT', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflow-templates', selectedWorkflow?.id, 'complete'] });
      toast({
        title: "Document updated",
        description: "Document requirement has been updated successfully."
      });
      setEditingDocument(null);
      setEditingDocumentData({});
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update document requirement.",
        variant: "destructive"
      });
    }
  });

  // Mutation for updating checklist items
  const updateChecklistMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest(`/api/checklist-items/${id}`, 'PUT', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflow-templates', selectedWorkflow?.id, 'complete'] });
      toast({
        title: "Checklist updated",
        description: "Checklist item has been updated successfully."
      });
      setEditingChecklist(null);
      setEditingChecklistData({});
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update checklist item.",
        variant: "destructive"
      });
    }
  });

  const handleEditDocument = (doc: any) => {
    setEditingDocument(doc.id);
    setEditingDocumentData({
      title: doc.title,
      description: doc.description,
      submittedBy: doc.submittedBy,
      isRequired: doc.isRequired,
      requiredByDays: doc.requiredByDays || ''
    });
  };

  const handleEditChecklist = (item: any) => {
    setEditingChecklist(item.id);
    setEditingChecklistData({
      title: item.title,
      description: item.description,
      assignedRole: item.assignedRole,
      isRequired: item.isRequired,
      requiredByDays: item.requiredByDays || ''
    });
  };

  const handleSaveDocument = () => {
    if (!editingDocument) return;
    
    updateDocumentMutation.mutate({
      id: editingDocument,
      data: {
        ...editingDocumentData,
        requiredByDays: editingDocumentData.requiredByDays ? parseInt(editingDocumentData.requiredByDays) : null
      }
    });
  };

  const handleSaveChecklist = () => {
    if (!editingChecklist) return;
    
    updateChecklistMutation.mutate({
      id: editingChecklist,
      data: {
        ...editingChecklistData,
        requiredByDays: editingChecklistData.requiredByDays ? parseInt(editingChecklistData.requiredByDays) : null
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading workflows...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Workflow Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Templates</CardTitle>
          <CardDescription>Select a workflow template to view and manage its stages, documents, and checklists</CardDescription>
        </CardHeader>
        <CardContent>
          <Select 
            value={selectedWorkflow?.id || ''} 
            onValueChange={(value) => {
              const workflow = workflows?.find((w: any) => w.id === value);
              setSelectedWorkflow(workflow);
              setExpandedStage(null);
              setExpandedDocument(null);
              setExpandedChecklist(null);
            }}
          >
            <SelectTrigger data-testid="select-workflow">
              <SelectValue placeholder="Choose a workflow to manage..." />
            </SelectTrigger>
            <SelectContent>
              {workflows?.filter((workflow: any, index: number, self: any[]) => 
                index === self.findIndex((w: any) => w.name === workflow.name)
              ).map((workflow: any) => (
                <SelectItem key={workflow.id} value={workflow.id}>
                  {workflow.name} ({workflow.estimatedDurationDays} days)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Selected Workflow Details */}
      {selectedWorkflow && completeWorkflow && (
        <div className="space-y-4">
          {/* Workflow Overview */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">{completeWorkflow.name}</CardTitle>
              <CardDescription>{completeWorkflow.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6 text-sm text-muted-foreground">
                <span>Duration: {completeWorkflow.estimatedDurationDays} days</span>
                <span>Stages: {completeWorkflow.steps?.length || 0}</span>
                <span>Type: {completeWorkflow.executionType}</span>
              </div>
            </CardContent>
          </Card>

          {/* Hierarchical Workflow Stages */}
          {completeWorkflow.steps?.length > 0 ? (
            <div className="space-y-3">
              {completeWorkflow.steps
                .sort((a: any, b: any) => a.order - b.order)
                .map((stage: any, stageIndex: number) => (
                <Card key={stage.id} className="border-l-4 border-l-blue-500">
                  {/* Stage Header - Always Visible */}
                  <CardHeader 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedStage(expandedStage === stage.id ? null : stage.id)}
                    data-testid={`stage-header-${stage.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                          {stageIndex + 1}
                        </div>
                        <div>
                          <CardTitle className="text-base">{stage.name}</CardTitle>
                          <CardDescription>
                            {stage.description} • {stage.estimatedDays} days • Assigned to: {stage.assignedRole}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {stage.requiresApproval && (
                          <Badge variant="secondary" className="text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            Approval Required
                          </Badge>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <FileText className="w-3 h-3" />
                          {stage.documentRequirements?.length || 0}
                          <CheckSquare className="w-3 h-3 ml-2" />
                          {stage.checklistItems?.length || 0}
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform ${expandedStage === stage.id ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </CardHeader>

                  {/* Stage Content - Expandable */}
                  {expandedStage === stage.id && (
                    <CardContent className="space-y-4 pt-0">
                      {/* Document Requirements Card */}
                      <Card className="border-l-4 border-l-green-500">
                        <CardHeader 
                          className="cursor-pointer hover:bg-muted/30 transition-colors pb-3"
                          onClick={() => setExpandedDocument(expandedDocument === stage.id ? null : stage.id)}
                        >
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <FileText className="w-4 h-4 text-green-600" />
                              Document Requirements ({stage.documentRequirements?.length || 0})
                            </CardTitle>
                            <ChevronDown className={`w-4 h-4 transition-transform ${expandedDocument === stage.id ? 'rotate-180' : ''}`} />
                          </div>
                        </CardHeader>
                        
                        {expandedDocument === stage.id && (
                          <CardContent className="pt-0">
                            {stage.documentRequirements?.length > 0 ? (
                              <div className="space-y-3">
                                {stage.documentRequirements
                                  .sort((a: any, b: any) => a.order - b.order)
                                  .map((doc: any, docIndex: number) => (
                                  <div key={doc.id} className="border rounded-lg p-4 bg-background hover:bg-muted/30 transition-colors">
                                    <div className="flex items-start gap-3">
                                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-medium text-green-700">
                                        {docIndex + 1}
                                      </div>
                                      <div className="flex-1 space-y-2">
                                        {editingDocument === doc.id ? (
                                          <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                              <div>
                                                <Label htmlFor="doc-title" className="text-xs">Title</Label>
                                                <Input 
                                                  id="doc-title"
                                                  value={editingDocumentData.title || ''}
                                                  onChange={(e) => setEditingDocumentData({...editingDocumentData, title: e.target.value})}
                                                  className="h-8 text-xs"
                                                />
                                              </div>
                                              <div>
                                                <Label htmlFor="doc-owner" className="text-xs">Owner</Label>
                                                <Select 
                                                  value={editingDocumentData.submittedBy} 
                                                  onValueChange={(value) => setEditingDocumentData({...editingDocumentData, submittedBy: value})}
                                                >
                                                  <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="OWNER">Owner</SelectItem>
                                                    <SelectItem value="WORKER">Worker</SelectItem>
                                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                            </div>
                                            <div>
                                              <Label htmlFor="doc-description" className="text-xs">Description</Label>
                                              <Textarea 
                                                id="doc-description"
                                                value={editingDocumentData.description || ''}
                                                onChange={(e) => setEditingDocumentData({...editingDocumentData, description: e.target.value})}
                                                className="text-xs min-h-[60px]"
                                              />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                              <div>
                                                <Label htmlFor="doc-required-days" className="text-xs">Required by (days)</Label>
                                                <Input 
                                                  id="doc-required-days"
                                                  type="number"
                                                  value={editingDocumentData.requiredByDays}
                                                  onChange={(e) => setEditingDocumentData({...editingDocumentData, requiredByDays: e.target.value})}
                                                  className="h-8 text-xs"
                                                  placeholder="Optional"
                                                />
                                              </div>
                                              <div className="flex items-center space-x-2 pt-4">
                                                <Checkbox 
                                                  id="doc-required"
                                                  checked={editingDocumentData.isRequired}
                                                  onCheckedChange={(checked) => setEditingDocumentData({...editingDocumentData, isRequired: checked})}
                                                />
                                                <Label htmlFor="doc-required" className="text-xs">Required</Label>
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <Button 
                                                size="sm" 
                                                onClick={handleSaveDocument}
                                                disabled={updateDocumentMutation.isPending}
                                                className="h-7 px-3 text-xs"
                                              >
                                                <Save className="w-3 h-3 mr-1" />
                                                Save
                                              </Button>
                                              <Button 
                                                size="sm" 
                                                variant="outline" 
                                                onClick={() => {setEditingDocument(null); setEditingDocumentData({});}}
                                                className="h-7 px-3 text-xs"
                                              >
                                                <X className="w-3 h-3 mr-1" />
                                                Cancel
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <>
                                            <div className="flex items-start justify-between">
                                              <div>
                                                <h6 className="font-medium text-sm">{doc.title}</h6>
                                                <p className="text-xs text-muted-foreground">{doc.description}</p>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                {doc.isRequired && (
                                                  <Badge variant="destructive" className="text-xs">Required</Badge>
                                                )}
                                                {doc.requiredByDays && (
                                                  <Badge variant="outline" className="text-xs">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    {doc.requiredByDays}d
                                                  </Badge>
                                                )}
                                                <Button 
                                                  size="sm" 
                                                  variant="ghost" 
                                                  onClick={() => handleEditDocument(doc)}
                                                  className="h-6 w-6 p-0"
                                                >
                                                  <Edit className="w-3 h-3" />
                                                </Button>
                                              </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                                              <div>
                                                <span className="font-medium">Submitted by:</span> {doc.submittedBy}
                                              </div>
                                              <div>
                                                <span className="font-medium">File types:</span> {
                                                  (() => {
                                                    try {
                                                      return JSON.parse(doc.acceptedFileTypes || '["PDF"]').join(', ');
                                                    } catch {
                                                      return doc.acceptedFileTypes || 'PDF';
                                                    }
                                                  })()
                                                }
                                              </div>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-6 text-muted-foreground">
                                <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                                <p className="text-sm">No document requirements defined for this stage</p>
                              </div>
                            )}
                          </CardContent>
                        )}
                      </Card>

                      {/* Checklist Items Card */}
                      <Card className="border-l-4 border-l-orange-500">
                        <CardHeader 
                          className="cursor-pointer hover:bg-muted/30 transition-colors pb-3"
                          onClick={() => setExpandedChecklist(expandedChecklist === stage.id ? null : stage.id)}
                        >
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <CheckSquare className="w-4 h-4 text-orange-600" />
                              Checklist Items ({stage.checklistItems?.length || 0})
                            </CardTitle>
                            <ChevronDown className={`w-4 h-4 transition-transform ${expandedChecklist === stage.id ? 'rotate-180' : ''}`} />
                          </div>
                        </CardHeader>
                        
                        {expandedChecklist === stage.id && (
                          <CardContent className="pt-0">
                            {stage.checklistItems?.length > 0 ? (
                              <div className="space-y-3">
                                {stage.checklistItems
                                  .sort((a: any, b: any) => a.order - b.order)
                                  .map((item: any, itemIndex: number) => (
                                  <div key={item.id} className="border rounded-lg p-4 bg-background hover:bg-muted/30 transition-colors">
                                    <div className="flex items-start gap-3">
                                      <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-xs font-medium text-orange-700">
                                        {itemIndex + 1}
                                      </div>
                                      <div className="flex-1 space-y-2">
                                        {editingChecklist === item.id ? (
                                          <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                              <div>
                                                <Label htmlFor="checklist-title" className="text-xs">Title</Label>
                                                <Input 
                                                  id="checklist-title"
                                                  value={editingChecklistData.title || ''}
                                                  onChange={(e) => setEditingChecklistData({...editingChecklistData, title: e.target.value})}
                                                  className="h-8 text-xs"
                                                />
                                              </div>
                                              <div>
                                                <Label htmlFor="checklist-role" className="text-xs">Assigned Role</Label>
                                                <Select 
                                                  value={editingChecklistData.assignedRole} 
                                                  onValueChange={(value) => setEditingChecklistData({...editingChecklistData, assignedRole: value})}
                                                >
                                                  <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="WORKER">Worker</SelectItem>
                                                    <SelectItem value="OWNER">Owner</SelectItem>
                                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                            </div>
                                            <div>
                                              <Label htmlFor="checklist-description" className="text-xs">Description</Label>
                                              <Textarea 
                                                id="checklist-description"
                                                value={editingChecklistData.description || ''}
                                                onChange={(e) => setEditingChecklistData({...editingChecklistData, description: e.target.value})}
                                                className="text-xs min-h-[60px]"
                                              />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                              <div>
                                                <Label htmlFor="checklist-required-days" className="text-xs">Required by (days)</Label>
                                                <Input 
                                                  id="checklist-required-days"
                                                  type="number"
                                                  value={editingChecklistData.requiredByDays}
                                                  onChange={(e) => setEditingChecklistData({...editingChecklistData, requiredByDays: e.target.value})}
                                                  className="h-8 text-xs"
                                                  placeholder="Optional"
                                                />
                                              </div>
                                              <div className="flex items-center space-x-2 pt-4">
                                                <Checkbox 
                                                  id="checklist-required"
                                                  checked={editingChecklistData.isRequired}
                                                  onCheckedChange={(checked) => setEditingChecklistData({...editingChecklistData, isRequired: checked})}
                                                />
                                                <Label htmlFor="checklist-required" className="text-xs">Required</Label>
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <Button 
                                                size="sm" 
                                                onClick={handleSaveChecklist}
                                                disabled={updateChecklistMutation.isPending}
                                                className="h-7 px-3 text-xs"
                                              >
                                                <Save className="w-3 h-3 mr-1" />
                                                Save
                                              </Button>
                                              <Button 
                                                size="sm" 
                                                variant="outline" 
                                                onClick={() => {setEditingChecklist(null); setEditingChecklistData({});}}
                                                className="h-7 px-3 text-xs"
                                              >
                                                <X className="w-3 h-3 mr-1" />
                                                Cancel
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <>
                                            <div className="flex items-start justify-between">
                                              <div>
                                                <h6 className="font-medium text-sm">{item.title}</h6>
                                                <p className="text-xs text-muted-foreground">{item.description}</p>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                {item.isRequired && (
                                                  <Badge variant="destructive" className="text-xs">Required</Badge>
                                                )}
                                                {item.requiredByDays && (
                                                  <Badge variant="outline" className="text-xs">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    {item.requiredByDays}d
                                                  </Badge>
                                                )}
                                                <Button 
                                                  size="sm" 
                                                  variant="ghost" 
                                                  onClick={() => handleEditChecklist(item)}
                                                  className="h-6 w-6 p-0"
                                                >
                                                  <Edit className="w-3 h-3" />
                                                </Button>
                                              </div>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                              <span className="font-medium">Assigned to:</span> {item.assignedRole}
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-6 text-muted-foreground">
                                <CheckSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                                <p className="text-sm">No checklist items defined for this stage</p>
                              </div>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 border border-dashed rounded-lg">
              <ListChecks className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No stages defined for this workflow</p>
            </div>
          )}
        </div>
      )}

      {!selectedWorkflow && (
        <div className="text-center p-8 border border-dashed rounded-lg">
          <Workflow className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Select a workflow template to view and manage its stages</p>
        </div>
      )}
    </div>
  );
}

// Placeholder components
function GeneralSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>Manage your general application preferences</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">General settings will be implemented here</p>
      </CardContent>
    </Card>
  );
}

function NotificationSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>Configure your notification preferences</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Notification settings will be implemented here</p>
      </CardContent>
    </Card>
  );
}

function DocumentSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Settings</CardTitle>
        <CardDescription>Manage document templates and requirements</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Document settings will be implemented here</p>
      </CardContent>
    </Card>
  );
}

function SystemSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Settings</CardTitle>
        <CardDescription>Configure system-wide settings</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">System settings will be implemented here</p>
      </CardContent>
    </Card>
  );
}

export default SettingsPage;