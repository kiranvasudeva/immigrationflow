import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/contexts/I18nProvider';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  CheckSquare
} from 'lucide-react';
import PatraIcon from '@/components/icons/PatraIcon';
import WorkerWorkflowAssignments from '@/components/WorkerWorkflowAssignments';

// Interfaces
interface DocumentCategory {
  id: string;
  name: string;
  description: string;
  types: DocumentType[];
}

interface DocumentType {
  id: string;
  name: string;
  description: string;
  requiredFields: string[];
  templateRequired: boolean;
}

interface DocumentRequirement {
  id: string;
  title: string;
  description: string;
  required: boolean;
  submittedBy: 'WORKER' | 'OWNER' | 'ADMIN';
  acceptedTypes: string[];
}

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  required: boolean;
  assignedRole: 'WORKER' | 'OWNER' | 'ADMIN' | 'VIEWER';
}

interface WorkflowStage {
  id: string;
  name: string;
  description: string;
  assignedRole: 'WORKER' | 'OWNER' | 'ADMIN' | 'VIEWER' | 'CLIENT' | 'INSTITUTION';
  estimatedDays: number;
  required: boolean;
  approvalRequired: boolean;
  approver?: string;
  statusLabel: string;
  responsible: 'WORKER' | 'OWNER' | 'ADMIN' | 'VIEWER' | 'CLIENT' | 'INSTITUTION';
  timeframeDays: number;
  documentRequirements?: DocumentRequirement[];
  checklistItems?: ChecklistItem[];
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  documentTypeId: string;
  stages: WorkflowStage[];
  isActive: boolean;
  executionType: 'sequential' | 'parallel';
  stageOrder: string[];
}

interface CompanyInfo {
  companyName: string;
  registrationNumber: string;
  vatNumber: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  phone: string;
  email: string;
  website: string;
  bankName: string;
  accountNumber: string;
  iban: string;
  swift: string;
}

interface PaymentProcessor {
  id: string;
  name: string;
  enabled: boolean;
  testMode: boolean;
  apiKey: string;
  secretKey: string;
  webhookUrl: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  clients: number;
  price: number | string;
  features: string[];
}

export default function SettingsPage() {
  const { t } = useTranslation();
  usePageTitle('nav.settings');
  const { setBreadcrumbs } = useBreadcrumb();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // Get the tab from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get('tab') || 'general';
  const [activeTab, setActiveTab] = useState(initialTab);

  // State for all settings sections
  const [documentCategories, setDocumentCategories] = useState<DocumentCategory[]>([]);
  const [showCreateWorkflow, setShowCreateWorkflow] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [showStageManager, setShowStageManager] = useState<string | null>(null);
  const [seedingRomanian, setSeedingRomanian] = useState(false);
  
  // Fetch workflow templates from the database
  const { data: workflowTemplates, isLoading: loadingWorkflows } = useQuery({
    queryKey: ['/api/workflow-templates'],
  });

  // Refresh function to invalidate cache and refetch data
  const refreshWorkflowData = async () => {
    await queryClient.invalidateQueries({ queryKey: ['/api/workflow-templates'] });
    toast({
      title: "Data refreshed",
      description: "Workflow templates have been updated from the database."
    });
  };

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    companyName: '',
    registrationNumber: '',
    vatNumber: '',
    address: '',
    city: '',
    country: 'Romania',
    postalCode: '',
    phone: '',
    email: '',
    website: '',
    bankName: '',
    accountNumber: '',
    iban: '',
    swift: ''
  });

  const [paymentProcessors, setPaymentProcessors] = useState<PaymentProcessor[]>([
    { id: 'stripe', name: 'Stripe', enabled: false, testMode: true, apiKey: '', secretKey: '', webhookUrl: '' },
    { id: 'paypal', name: 'PayPal', enabled: false, testMode: true, apiKey: '', secretKey: '', webhookUrl: '' },
    { id: 'netopia', name: 'Netopia Payments', enabled: false, testMode: true, apiKey: '', secretKey: '', webhookUrl: '' },
    { id: 'euplatesc', name: 'EuPlatesc', enabled: false, testMode: true, apiKey: '', secretKey: '', webhookUrl: '' },
    { id: 'payu', name: 'PayU Romania', enabled: false, testMode: true, apiKey: '', secretKey: '', webhookUrl: '' },
    { id: 'mobilpay', name: 'MobilPay', enabled: false, testMode: true, apiKey: '', secretKey: '', webhookUrl: '' }
  ]);

  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([
    { 
      id: 'basic', 
      name: 'Basic Plan', 
      clients: 20, 
      price: 299, 
      features: ['Basic workflow management', 'Document templates', 'Email support'] 
    },
    { 
      id: 'premium', 
      name: 'Premium Plan', 
      clients: 50, 
      price: 599, 
      features: ['Advanced workflows', 'Custom templates', 'Priority support', 'Analytics dashboard'] 
    },
    { 
      id: 'enterprise', 
      name: 'Enterprise Plan', 
      clients: 100, 
      price: 999, 
      features: ['All features', 'Custom integrations', 'Dedicated support', 'Advanced analytics'] 
    },
    { 
      id: 'custom', 
      name: 'Custom Plan', 
      clients: 100, 
      price: 'Contact us', 
      features: ['Enterprise features', 'Custom development', 'On-premise deployment'] 
    }
  ]);

  // Authentication and authorization check
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'ADMIN')) {
      toast({
        title: "Unauthorized",
        description: "Access denied. Admin privileges required.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Settings', href: '/settings' }
    ]);
  }, [setBreadcrumbs]);

  // Transform loaded workflow templates into local workflow format
  useEffect(() => {
    if (workflowTemplates && Array.isArray(workflowTemplates)) {
      const transformedWorkflows = workflowTemplates.map((template: any) => ({
        id: template.id,
        name: template.name,
        description: template.description || '',
        documentTypeId: template.id,
        isActive: template.isActive,
        executionType: 'sequential' as const,
        stageOrder: template.stages?.map((step: any) => step.id) || [],
        stages: template.stages?.map((step: any, index: number) => ({
          id: step.id,
          name: step.name,
          description: step.description || '',
          assignedRole: step.assignedRole || 'WORKER',
          estimatedDays: step.estimatedDuration || 7,
          required: true,
          approvalRequired: false,
          statusLabel: step.name,
          responsible: step.assignedRole || 'WORKER',
          timeframeDays: step.estimatedDuration || 7,
          documentRequirements: step.documentRequirements?.map((req: any, reqIndex: number) => ({
            id: req.id || `${step.id}-doc-${reqIndex}`,
            title: req.title,
            description: req.description || '',
            required: req.isRequired !== false,
            submittedBy: req.submittedBy || 'WORKER',
            acceptedTypes: req.acceptedFileTypes || ['pdf']
          })) || [],
          checklistItems: step.checklistItems?.map((item: any, itemIndex: number) => ({
            id: item.id || `${step.id}-checklist-${itemIndex}`,
            title: item.title,
            description: item.description || '',
            required: item.isRequired !== false,
            assignedRole: item.assignedRole || 'ADMIN'
          })) || []
        })) || []
      }));
      
      setWorkflows(transformedWorkflows);
    }
  }, [workflowTemplates]);

  // Function to seed Romanian work permit workflow with real documents and checklists
  const seedRomanianWorkflow = async () => {
    setSeedingRomanian(true);
    try {
      const response = await fetch('/api/seed-romanian-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to seed Romanian workflow');
      }
      
      const result = await response.json();
      
      toast({
        title: "Success",
        description: "Romanian work permit documents and verification checklists have been populated successfully.",
      });
      
      // Refresh the page to show the updated data
      window.location.reload();
    } catch (error) {
      console.error('Error seeding Romanian workflow:', error);
      toast({
        title: "Error",
        description: "Failed to populate Romanian workflow documents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSeedingRomanian(false);
    }
  };

  const handleCreateWorkflow = async (workflowData: any) => {
    try {
      const response = await fetch('/api/workflow-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: workflowData.name,
          description: workflowData.description,
          isActive: workflowData.isActive,
          executionType: workflowData.executionType,
          steps: [] // Start with empty steps, user can add later
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create workflow');
      }
      
      toast({
        title: "Workflow Created",
        description: "New workflow template has been created successfully.",
      });
      
      setShowCreateWorkflow(false);
      // Refresh workflow list
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create workflow. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveSettings = async (section: string) => {
    try {
      if (section === 'Workflows') {
        // Implement workflow save logic
        toast({
          title: "Settings Saved",
          description: "Workflow templates have been updated successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure your ImmigrationFlow system settings and preferences
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="workflows" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="workflow-management" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Workflow Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Workflow className="h-5 w-5" />
                  Workflow Templates
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={seedRomanianWorkflow} 
                    variant="outline" 
                    data-testid="button-seed-romanian-workflow"
                    disabled={seedingRomanian}
                  >
                    {seedingRomanian ? (
                      <>Loading...</>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Populate Romanian Documents
                      </>
                    )}
                  </Button>
                  <Button onClick={refreshWorkflowData} variant="outline" className="bg-green-50 hover:bg-green-100 border-green-200">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Refresh Data
                  </Button>
                  <Button onClick={() => setShowCreateWorkflow(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Workflow
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loadingWorkflows && (
                  <div className="text-center py-4">Loading workflow templates...</div>
                )}
                
                {(!workflowTemplates || (workflowTemplates as any[]).length === 0) && !loadingWorkflows && (
                  <div className="text-center py-8 text-gray-500">
                    No workflow templates found. Create your first workflow template to get started.
                  </div>
                )}

                {((workflowTemplates as any[]) || []).map((workflow: any) => (
                  <div key={workflow.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{workflow.name}</h3>
                        <p className="text-gray-600 text-sm">{workflow.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={workflow.isActive ? "default" : "secondary"}>
                          {workflow.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setShowStageManager(workflow.id)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Manage Stages
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setEditingWorkflow(workflow)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600">
                        <strong>Stages:</strong> {workflow.stages?.length || 0}
                      </div>
                      
                      {workflow.stages && workflow.stages.length > 0 ? (
                        workflow.stages.map((stage: any, index: number) => (
                          <div key={stage.id} className="ml-4 pl-4 border-l-2 border-gray-200">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{stage.name}</h4>
                              <span className="text-xs text-gray-500">{stage.estimatedDays} days</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{stage.description}</p>
                            
                            {stage.documentRequirements && stage.documentRequirements.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-gray-700">Document Requirements:</p>
                                <ul className="text-xs text-gray-600 ml-4">
                                  {stage.documentRequirements.map((req: any) => (
                                    <li key={req.id} className="flex items-center gap-1">
                                      <span>• {req.title}</span>
                                      {req.required && <span className="text-red-500">*</span>}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="ml-4 text-sm text-gray-500 italic">
                          This workflow template has been created but no stages have been defined yet.
                          <br />
                          Detailed stage configuration is needed to make this workflow operational.
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <div className="flex justify-end space-x-2">
                  <Button onClick={() => handleSaveSettings('Workflows')}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs content can be added here */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p>General settings content goes here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Document Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Document settings content goes here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Payment settings content goes here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Role Permissions Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Admin Role */}
                <div className="space-y-4 p-4 border rounded-lg bg-red-50">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">ADMIN</Badge>
                    <span className="text-sm font-medium">Full System Access</span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Create and manage all workflows</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Access all client and worker data</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Configure system settings and permissions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Manage document templates and requirements</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>View audit logs and system analytics</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Invite and manage all user roles</span>
                    </div>
                  </div>
                </div>

                {/* Client Owner Role */}
                <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">CLIENT OWNER</Badge>
                    <span className="text-sm font-medium">Client Management</span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Manage own client profiles and data</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Assign workers to client cases</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>View progress of assigned workflows</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Upload and manage client documents</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Communicate with assigned workers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span>Cannot access other clients' data</span>
                    </div>
                  </div>
                </div>

                {/* Worker Role */}
                <div className="space-y-4 p-4 border rounded-lg bg-green-50">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">WORKER</Badge>
                    <span className="text-sm font-medium">Case Processing</span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>View assigned client cases and workflows</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Update workflow stage progress</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Upload required documents and evidence</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Communicate with client owners</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Generate progress reports</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span>Cannot access unassigned cases</span>
                    </div>
                  </div>
                </div>

                {/* Viewer Role */}
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">VIEWER</Badge>
                    <span className="text-sm font-medium">Read-Only Access</span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>View assigned client cases (read-only)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Access workflow progress reports</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>View document status and deadlines</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span>Cannot modify any data or documents</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span>Cannot upload files or update progress</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span>Cannot access administrative functions</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Document Access Permissions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Document Upload Permissions</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">ADMIN</Badge>
                        <span>Upload any document type, modify templates</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-xs">OWNER</Badge>
                        <span>Upload client company documents, employment contracts</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">WORKER</Badge>
                        <span>Upload worker personal documents, progress evidence</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">VIEWER</Badge>
                        <span>No upload permissions</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Workflow Stage Permissions</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">ADMIN</Badge>
                        <span>Create, modify, and delete any workflow stage</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-xs">OWNER</Badge>
                        <span>Mark stages complete, provide approvals</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">WORKER</Badge>
                        <span>Update assigned stage progress and status</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">VIEWER</Badge>
                        <span>View stage status only</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Save className="h-4 w-4 mr-2" />
                  Save Permission Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Templates & Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Available Document Templates</h3>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Romanian Employment Contract</h4>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Standard Romanian employment contract template (Contract Individual de Muncă)
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit Template
                        </Button>
                        <Button size="sm" variant="outline">
                          <Upload className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Power of Attorney</h4>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Legal representation document for immigration procedures
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit Template
                        </Button>
                        <Button size="sm" variant="outline">
                          <Upload className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Job Description Document</h4>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Detailed job description for AJOFM labor market applications
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit Template
                        </Button>
                        <Button size="sm" variant="outline">
                          <Upload className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <Button className="w-full" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Template
                  </Button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Document Requirements by Stage</h3>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">AJOFM Labor Market Test</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckSquare className="h-4 w-4 text-green-600" />
                          <span>Job Description (Auto-generated)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckSquare className="h-4 w-4 text-green-600" />
                          <span>Company Registration Certificate</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckSquare className="h-4 w-4 text-green-600" />
                          <span>AJOFM Application Form</span>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">IGI Work Permit Application</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckSquare className="h-4 w-4 text-green-600" />
                          <span>Employment Contract (Auto-generated)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckSquare className="h-4 w-4 text-green-600" />
                          <span>Worker Passport Copy</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckSquare className="h-4 w-4 text-green-600" />
                          <span>Educational Certificates</span>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">Consulate Visa Application</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckSquare className="h-4 w-4 text-green-600" />
                          <span>Visa Application Form</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckSquare className="h-4 w-4 text-green-600" />
                          <span>Work Permit Approval</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckSquare className="h-4 w-4 text-green-600" />
                          <span>Financial Guarantee</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Template Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-fill">Auto-fill client data</Label>
                    <Switch id="auto-fill" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="watermark">Add security watermark</Label>
                    <Switch id="watermark" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="digital-signature">Require digital signature</Label>
                    <Switch id="digital-signature" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Save className="h-4 w-4 mr-2" />
                  Save Document Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Company information content goes here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflow Management Tab */}
        <TabsContent value="workflow-management" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Workflow Management</h3>
              <p className="text-sm text-muted-foreground">
                Manage workflow templates, stages, documents, and checklist items with task ownership assignments.
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="w-5 h-5" />
                  Workflow Templates
                </CardTitle>
                <CardDescription>
                  Configure immigration workflow processes with detailed stages and requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkflowManagement />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Workflow Dialog */}
      <Dialog open={showCreateWorkflow} onOpenChange={setShowCreateWorkflow}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Workflow Template</DialogTitle>
          </DialogHeader>
          <WorkflowForm 
            onSubmit={handleCreateWorkflow} 
            onCancel={() => setShowCreateWorkflow(false)} 
          />
        </DialogContent>
      </Dialog>

      {/* Edit Workflow Dialog */}
      <Dialog open={!!editingWorkflow} onOpenChange={() => setEditingWorkflow(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Workflow Template</DialogTitle>
          </DialogHeader>
          <WorkflowForm 
            workflow={editingWorkflow}
            onSubmit={async (data) => {
              try {
                const response = await fetch(`/api/workflow-templates/${editingWorkflow?.id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(data),
                });
                
                if (!response.ok) {
                  throw new Error('Failed to update workflow');
                }
                
                toast({
                  title: "Workflow Updated",
                  description: "Workflow template has been updated successfully.",
                });
                
                setEditingWorkflow(null);
                window.location.reload();
              } catch (error) {
                toast({
                  title: "Error",
                  description: "Failed to update workflow. Please try again.",
                  variant: "destructive",
                });
              }
            }} 
            onCancel={() => setEditingWorkflow(null)} 
          />
        </DialogContent>
      </Dialog>

      {/* Stage Manager Dialog */}
      <Dialog open={!!showStageManager} onOpenChange={() => setShowStageManager(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Workflow Stages</DialogTitle>
          </DialogHeader>
          <StageManager 
            workflowId={showStageManager}
            onClose={() => setShowStageManager(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Workflow Form Component
function WorkflowForm({ workflow, onSubmit, onCancel }: { 
  workflow?: Workflow | null, 
  onSubmit: (data: any) => void, 
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    name: workflow?.name || '',
    description: workflow?.description || '',
    isActive: workflow?.isActive ?? true,
    executionType: (workflow?.executionType || 'sequential') as 'sequential' | 'parallel'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Workflow Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter workflow name"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter workflow description"
          rows={3}
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.isActive}
          onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, isActive: checked }))}
        />
        <Label>Active</Label>
      </div>
      
      <div>
        <Label htmlFor="executionType">Execution Type</Label>
        <Select value={formData.executionType} onValueChange={(value: 'sequential' | 'parallel') => setFormData(prev => ({ ...prev, executionType: value }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sequential">Sequential</SelectItem>
            <SelectItem value="parallel">Parallel</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {workflow ? 'Update' : 'Create'} Workflow
        </Button>
      </div>
    </form>
  );
}

// Stage Manager Component
function StageManager({ workflowId, onClose }: { workflowId: string | null, onClose: () => void }) {
  const [stages, setStages] = useState<WorkflowStage[]>([]);
  const [showAddStage, setShowAddStage] = useState(false);
  const [editingStage, setEditingStage] = useState<WorkflowStage | null>(null);
  const [managingDocuments, setManagingDocuments] = useState<string | null>(null);
  const [managingChecklists, setManagingChecklists] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch stages for the workflow
  useEffect(() => {
    fetchStages();
  }, [workflowId]);

  const fetchStages = async () => {
    if (!workflowId) return;
    
    try {
      const response = await fetch(`/api/workflow-templates/${workflowId}`);
      if (response.ok) {
        const data = await response.json();
        setStages(data.steps || []);
      }
    } catch (error) {
      console.error('Error fetching stages:', error);
      toast({
        title: "Error",
        description: "Failed to load stages. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStage = async (stageData: any) => {
    try {
      const response = await fetch(`/api/workflow-templates/${workflowId}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...stageData,
          order: stages.length + 1,
          stepType: 'DOCUMENT_COLLECTION',
          isRequired: true,
          requiresApproval: false
        })
      });
      
      if (response.ok) {
        await fetchStages();
        setShowAddStage(false);
        toast({
          title: "Success",
          description: "Stage added successfully.",
        });
      } else {
        throw new Error('Failed to create stage');
      }
    } catch (error) {
      console.error('Error adding stage:', error);
      toast({
        title: "Error",
        description: "Failed to add stage. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStage = async (stageData: any) => {
    if (!editingStage) return;
    
    try {
      const response = await fetch(`/api/workflow-steps/${editingStage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stageData)
      });
      
      if (response.ok) {
        await fetchStages();
        setEditingStage(null);
        toast({
          title: "Success",
          description: "Stage updated successfully.",
        });
      } else {
        throw new Error('Failed to update stage');
      }
    } catch (error) {
      console.error('Error updating stage:', error);
      toast({
        title: "Error",
        description: "Failed to update stage. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    try {
      const response = await fetch(`/api/workflow-steps/${stageId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchStages();
        toast({
          title: "Success",
          description: "Stage deleted successfully.",
        });
      } else {
        throw new Error('Failed to delete stage');
      }
    } catch (error) {
      console.error('Error deleting stage:', error);
      toast({
        title: "Error", 
        description: "Failed to delete stage. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Workflow Stages</h3>
        <Button onClick={() => setShowAddStage(true)} data-testid="button-add-stage">
          <Plus className="h-4 w-4 mr-2" />
          Add Stage
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">
          Loading stages...
        </div>
      ) : stages.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No stages defined yet. Add your first stage to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {stages.map((stage, index) => (
            <div key={stage.id} className="border rounded-lg p-4" data-testid={`stage-card-${stage.id}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium" data-testid={`stage-name-${stage.id}`}>{stage.name}</h4>
                  <p className="text-sm text-gray-600" data-testid={`stage-description-${stage.id}`}>{stage.description}</p>
                  <div className="flex gap-4 text-xs text-gray-500 mt-2">
                    <span data-testid={`stage-role-${stage.id}`}>Role: {stage.assignedRole}</span>
                    <span data-testid={`stage-duration-${stage.id}`}>Duration: {stage.estimatedDays} days</span>
                    <span data-testid={`stage-docs-${stage.id}`}>Documents: {stage.documentRequirements?.length || 0}</span>
                    <span data-testid={`stage-checklist-${stage.id}`}>Checklist: {stage.checklistItems?.length || 0}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setManagingDocuments(stage.id)}
                    data-testid={`button-manage-docs-${stage.id}`}
                  >
                    <FileText className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setManagingChecklists(stage.id)}
                    data-testid={`button-manage-checklist-${stage.id}`}
                  >
                    <CheckSquare className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setEditingStage(stage)}
                    data-testid={`button-edit-stage-${stage.id}`}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleDeleteStage(stage.id)}
                    data-testid={`button-delete-stage-${stage.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Stage Form */}
      {showAddStage && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium mb-4">Add New Stage</h4>
          <StageForm onSubmit={handleAddStage} onCancel={() => setShowAddStage(false)} />
        </div>
      )}

      {/* Edit Stage Form */}
      {editingStage && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium mb-4">Edit Stage</h4>
          <StageForm 
            stage={editingStage} 
            onSubmit={handleUpdateStage} 
            onCancel={() => setEditingStage(null)} 
          />
        </div>
      )}

      {/* Document Management Modal */}
      {managingDocuments && (
        <Dialog open={!!managingDocuments} onOpenChange={() => setManagingDocuments(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Manage Document Requirements</DialogTitle>
            </DialogHeader>
            <DocumentRequirementsManager 
              stepId={managingDocuments} 
              onClose={() => setManagingDocuments(null)} 
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Checklist Management Modal */}
      {managingChecklists && (
        <Dialog open={!!managingChecklists} onOpenChange={() => setManagingChecklists(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Manage Checklist Items</DialogTitle>
            </DialogHeader>
            <ChecklistItemsManager 
              stepId={managingChecklists} 
              onClose={() => setManagingChecklists(null)} 
            />
          </DialogContent>
        </Dialog>
      )}

      <div className="flex justify-end">
        <Button onClick={onClose} data-testid="button-close-stage-manager">Close</Button>
      </div>
    </div>
  );
}

// Stage Form Component
function StageForm({ stage, onSubmit, onCancel }: { 
  stage?: WorkflowStage | null, 
  onSubmit: (data: any) => void, 
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    name: stage?.name || '',
    description: stage?.description || '',
    assignedRole: stage?.assignedRole || 'ADMIN',
    estimatedDays: stage?.estimatedDays || 7
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="stageName">Stage Name</Label>
        <Input
          id="stageName"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter stage name"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="stageDescription">Description</Label>
        <Textarea
          id="stageDescription"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter stage description"
          rows={2}
        />
      </div>
      
      <div>
        <Label htmlFor="assignedRole">Assigned Role</Label>
        <Select value={formData.assignedRole} onValueChange={(value: 'ADMIN' | 'OWNER' | 'WORKER' | 'VIEWER' | 'CLIENT' | 'INSTITUTION') => setFormData(prev => ({ ...prev, assignedRole: value }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="WORKER">Worker</SelectItem>
            <SelectItem value="OWNER">Client Owner</SelectItem>
            <SelectItem value="VIEWER">Viewer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="estimatedDays">Estimated Days</Label>
        <Input
          id="estimatedDays"
          type="number"
          min="1"
          value={formData.estimatedDays}
          onChange={(e) => setFormData(prev => ({ ...prev, estimatedDays: parseInt(e.target.value) || 1 }))}
          placeholder="Enter estimated days"
          required
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {stage ? 'Update' : 'Add'} Stage
        </Button>
      </div>
    </form>
  );
}

// Document Requirements Manager Component
function DocumentRequirementsManager({ stepId, onClose }: { stepId: string, onClose: () => void }) {
  const [requirements, setRequirements] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReq, setEditingReq] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRequirements();
  }, [stepId]);

  const fetchRequirements = async () => {
    try {
      const response = await fetch(`/api/workflow-steps/${stepId}/document-requirements`);
      if (response.ok) {
        const data = await response.json();
        setRequirements(data);
      }
    } catch (error) {
      console.error('Error fetching requirements:', error);
      toast({
        title: "Error",
        description: "Failed to load document requirements.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddRequirement = async (reqData: any) => {
    try {
      const response = await fetch(`/api/workflow-steps/${stepId}/document-requirements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqData)
      });
      
      if (response.ok) {
        await fetchRequirements();
        setShowAddForm(false);
        toast({
          title: "Success",
          description: "Document requirement added successfully.",
        });
      }
    } catch (error) {
      console.error('Error adding requirement:', error);
      toast({
        title: "Error",
        description: "Failed to add document requirement.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateRequirement = async (reqData: any) => {
    if (!editingReq) return;
    
    try {
      const response = await fetch(`/api/document-requirements/${editingReq.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqData)
      });
      
      if (response.ok) {
        await fetchRequirements();
        setEditingReq(null);
        toast({
          title: "Success",
          description: "Document requirement updated successfully.",
        });
      }
    } catch (error) {
      console.error('Error updating requirement:', error);
      toast({
        title: "Error",
        description: "Failed to update document requirement.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRequirement = async (reqId: string) => {
    try {
      const response = await fetch(`/api/document-requirements/${reqId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchRequirements();
        toast({
          title: "Success",
          description: "Document requirement deleted successfully.",
        });
      }
    } catch (error) {
      console.error('Error deleting requirement:', error);
      toast({
        title: "Error",
        description: "Failed to delete document requirement.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">Document Requirements</h4>
        <Button onClick={() => setShowAddForm(true)} size="sm" data-testid="button-add-document-req">
          <Plus className="h-4 w-4 mr-2" />
          Add Document
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-4 text-gray-500">Loading...</div>
      ) : requirements.length === 0 ? (
        <div className="text-center py-4 text-gray-500">No document requirements defined.</div>
      ) : (
        <div className="space-y-2">
          {requirements.map((req) => (
            <div key={req.id} className="border rounded p-3" data-testid={`doc-req-${req.id}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-medium" data-testid={`doc-req-title-${req.id}`}>{req.title}</h5>
                  <p className="text-sm text-gray-600" data-testid={`doc-req-desc-${req.id}`}>{req.description}</p>
                  <div className="flex gap-2 text-xs text-gray-500 mt-1">
                    <span data-testid={`doc-req-required-${req.id}`}>
                      {req.required ? 'Required' : 'Optional'}
                    </span>
                    <span data-testid={`doc-req-format-${req.id}`}>
                      Format: {req.acceptedFormats || 'Any'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => setEditingReq(req)} data-testid={`button-edit-doc-req-${req.id}`}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDeleteRequirement(req.id)} data-testid={`button-delete-doc-req-${req.id}`}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddForm && (
        <div className="border rounded p-4 bg-gray-50">
          <h5 className="font-medium mb-3">Add Document Requirement</h5>
          <DocumentRequirementForm onSubmit={handleAddRequirement} onCancel={() => setShowAddForm(false)} />
        </div>
      )}

      {editingReq && (
        <div className="border rounded p-4 bg-gray-50">
          <h5 className="font-medium mb-3">Edit Document Requirement</h5>
          <DocumentRequirementForm 
            requirement={editingReq}
            onSubmit={handleUpdateRequirement} 
            onCancel={() => setEditingReq(null)} 
          />
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={onClose} data-testid="button-close-doc-manager">Close</Button>
      </div>
    </div>
  );
}

// Document Requirement Form Component
function DocumentRequirementForm({ requirement, onSubmit, onCancel }: { 
  requirement?: any, 
  onSubmit: (data: any) => void, 
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    title: requirement?.title || '',
    description: requirement?.description || '',
    required: requirement?.required ?? true,
    acceptedFormats: requirement?.acceptedFormats || '',
    order: requirement?.order || 1
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="docTitle">Title</Label>
        <Input
          id="docTitle"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Document title"
          required
          data-testid="input-doc-title"
        />
      </div>
      
      <div>
        <Label htmlFor="docDescription">Description</Label>
        <Textarea
          id="docDescription"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Document description"
          rows={2}
          data-testid="input-doc-description"
        />
      </div>
      
      <div>
        <Label htmlFor="docFormats">Accepted Formats</Label>
        <Input
          id="docFormats"
          value={formData.acceptedFormats}
          onChange={(e) => setFormData(prev => ({ ...prev, acceptedFormats: e.target.value }))}
          placeholder="e.g., PDF, JPG, PNG"
          data-testid="input-doc-formats"
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.required}
          onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, required: checked }))}
          data-testid="switch-doc-required"
        />
        <Label>Required</Label>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-doc">
          Cancel
        </Button>
        <Button type="submit" data-testid="button-save-doc">
          {requirement ? 'Update' : 'Add'} Document
        </Button>
      </div>
    </form>
  );
}

// Checklist Items Manager Component
function ChecklistItemsManager({ stepId, onClose }: { stepId: string, onClose: () => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchItems();
  }, [stepId]);

  const fetchItems = async () => {
    try {
      const response = await fetch(`/api/workflow/steps/${stepId}/checklist-items`);
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Error fetching checklist items:', error);
      toast({
        title: "Error",
        description: "Failed to load checklist items.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (itemData: any) => {
    try {
      const response = await fetch(`/api/workflow-steps/${stepId}/checklist-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      });
      
      if (response.ok) {
        await fetchItems();
        setShowAddForm(false);
        toast({
          title: "Success",
          description: "Checklist item added successfully.",
        });
      }
    } catch (error) {
      console.error('Error adding checklist item:', error);
      toast({
        title: "Error",
        description: "Failed to add checklist item.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateItem = async (itemData: any) => {
    if (!editingItem) return;
    
    try {
      const response = await fetch(`/api/checklist-items/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      });
      
      if (response.ok) {
        await fetchItems();
        setEditingItem(null);
        toast({
          title: "Success",
          description: "Checklist item updated successfully.",
        });
      }
    } catch (error) {
      console.error('Error updating checklist item:', error);
      toast({
        title: "Error",
        description: "Failed to update checklist item.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/checklist-items/${itemId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchItems();
        toast({
          title: "Success",
          description: "Checklist item deleted successfully.",
        });
      }
    } catch (error) {
      console.error('Error deleting checklist item:', error);
      toast({
        title: "Error",
        description: "Failed to delete checklist item.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">Checklist Items</h4>
        <Button onClick={() => setShowAddForm(true)} size="sm" data-testid="button-add-checklist-item">
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-4 text-gray-500">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-4 text-gray-500">No checklist items defined.</div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="border rounded p-3" data-testid={`checklist-item-${item.id}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-medium" data-testid={`checklist-title-${item.id}`}>{item.title}</h5>
                  <p className="text-sm text-gray-600" data-testid={`checklist-desc-${item.id}`}>{item.description}</p>
                  <div className="flex gap-2 text-xs text-gray-500 mt-1">
                    <span data-testid={`checklist-required-${item.id}`}>
                      {item.required ? 'Required' : 'Optional'}
                    </span>
                    <span data-testid={`checklist-order-${item.id}`}>
                      Order: {item.order}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => setEditingItem(item)} data-testid={`button-edit-checklist-${item.id}`}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDeleteItem(item.id)} data-testid={`button-delete-checklist-${item.id}`}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddForm && (
        <div className="border rounded p-4 bg-gray-50">
          <h5 className="font-medium mb-3">Add Checklist Item</h5>
          <ChecklistItemForm onSubmit={handleAddItem} onCancel={() => setShowAddForm(false)} />
        </div>
      )}

      {editingItem && (
        <div className="border rounded p-4 bg-gray-50">
          <h5 className="font-medium mb-3">Edit Checklist Item</h5>
          <ChecklistItemForm 
            item={editingItem}
            onSubmit={handleUpdateItem} 
            onCancel={() => setEditingItem(null)} 
          />
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={onClose} data-testid="button-close-checklist-manager">Close</Button>
      </div>
    </div>
  );
}

// Checklist Item Form Component
function ChecklistItemForm({ item, onSubmit, onCancel }: { 
  item?: any, 
  onSubmit: (data: any) => void, 
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    title: item?.title || '',
    description: item?.description || '',
    required: item?.required ?? true,
    order: item?.order || 1
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="checklistTitle">Title</Label>
        <Input
          id="checklistTitle"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Checklist item title"
          required
          data-testid="input-checklist-title"
        />
      </div>
      
      <div>
        <Label htmlFor="checklistDescription">Description</Label>
        <Textarea
          id="checklistDescription"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Checklist item description"
          rows={2}
          data-testid="input-checklist-description"
        />
      </div>
      
      <div>
        <Label htmlFor="checklistOrder">Order</Label>
        <Input
          id="checklistOrder"
          type="number"
          min="1"
          value={formData.order}
          onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
          placeholder="Display order"
          data-testid="input-checklist-order"
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.required}
          onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, required: checked }))}
          data-testid="switch-checklist-required"
        />
        <Label>Required</Label>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-checklist">
          Cancel
        </Button>
        <Button type="submit" data-testid="button-save-checklist">
          {item ? 'Update' : 'Add'} Item
        </Button>
      </div>
    </form>
  );
}

// Workflow Management Component  
function WorkflowManagement() {
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [expandedStage, setExpandedStage] = useState(null);
  
  const { data: workflows, isLoading } = useQuery({
    queryKey: ['/api/workflow-templates'],
    enabled: true
  });

  const { data: completeWorkflow } = useQuery({
    queryKey: ['/api/workflow-templates', selectedWorkflow?.id, 'complete'],
    enabled: !!selectedWorkflow?.id
  });

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
      <div className="grid gap-4">
        <Label>Select Workflow Template</Label>
        <Select 
          value={selectedWorkflow?.id || ''} 
          onValueChange={(value) => {
            const workflow = workflows?.find(w => w.id === value);
            setSelectedWorkflow(workflow);
            setExpandedStage(null);
          }}
        >
          <SelectTrigger data-testid="select-workflow">
            <SelectValue placeholder="Choose a workflow to manage..." />
          </SelectTrigger>
          <SelectContent>
            {workflows?.map((workflow) => (
              <SelectItem key={workflow.id} value={workflow.id}>
                {workflow.name} ({workflow.estimatedDurationDays} days)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Selected Workflow Details */}
      {selectedWorkflow && completeWorkflow && (
        <div className="space-y-6">
          <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="font-medium">{completeWorkflow.name}</h4>
            <p className="text-sm text-muted-foreground mt-1">{completeWorkflow.description}</p>
            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
              <span>Duration: {completeWorkflow.estimatedDurationDays} days</span>
              <span>Stages: {completeWorkflow.steps?.length || 0}</span>
              <span>Type: {completeWorkflow.executionType}</span>
            </div>
          </div>

          {/* Workflow Stages */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <ListChecks className="w-4 h-4" />
              Workflow Stages
            </h4>
            
            {completeWorkflow.steps?.length > 0 ? (
              <div className="space-y-2">
                {completeWorkflow.steps
                  .sort((a, b) => a.order - b.order)
                  .map((stage, index) => (
                  <Card key={stage.id} className="border-l-4 border-l-blue-500">
                    <CardHeader 
                      className="pb-3 cursor-pointer"
                      onClick={() => setExpandedStage(expandedStage === stage.id ? null : stage.id)}
                      data-testid={`stage-header-${stage.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <CardTitle className="text-base">{stage.name}</CardTitle>
                            <CardDescription className="text-sm">
                              {stage.description} • {stage.estimatedDays} days • Assigned to: {stage.assignedRole}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {stage.requiresApproval && (
                            <Badge variant="secondary" className="text-xs">
                              <Shield className="w-3 h-3 mr-1" />
                              Requires Approval
                            </Badge>
                          )}
                          <ChevronDown className={`w-4 h-4 transition-transform ${expandedStage === stage.id ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </CardHeader>

                    {expandedStage === stage.id && (
                      <CardContent className="pt-0">
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Document Requirements */}
                          <div className="space-y-3">
                            <h5 className="font-medium flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Document Requirements ({stage.documentRequirements?.length || 0})
                            </h5>
                            {stage.documentRequirements?.length > 0 ? (
                              <div className="space-y-2">
                                {stage.documentRequirements
                                  .sort((a, b) => a.order - b.order)
                                  .map((doc) => (
                                  <div key={doc.id} className="border rounded p-3 space-y-2">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="font-medium text-sm">{doc.title}</div>
                                        <div className="text-xs text-muted-foreground">{doc.description}</div>
                                      </div>
                                      {doc.isRequired && (
                                        <Badge variant="destructive" className="text-xs ml-2">Required</Badge>
                                      )}
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                      <span>Submitted by: <strong>{doc.submittedBy}</strong></span>
                                      <span>Types: {JSON.parse(doc.acceptedFileTypes || '[]').join(', ')}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No document requirements defined</p>
                            )}
                          </div>

                          {/* Checklist Items */}
                          <div className="space-y-3">
                            <h5 className="font-medium flex items-center gap-2">
                              <CheckSquare className="w-4 h-4" />
                              Checklist Items ({stage.checklistItems?.length || 0})
                            </h5>
                            {stage.checklistItems?.length > 0 ? (
                              <div className="space-y-2">
                                {stage.checklistItems
                                  .sort((a, b) => a.order - b.order)
                                  .map((item) => (
                                  <div key={item.id} className="border rounded p-3 space-y-2">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="font-medium text-sm">{item.title}</div>
                                        <div className="text-xs text-muted-foreground">{item.description}</div>
                                      </div>
                                      {item.isRequired && (
                                        <Badge variant="destructive" className="text-xs ml-2">Required</Badge>
                                      )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Assigned to: <strong>{item.assignedRole}</strong>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No checklist items defined</p>
                            )}
                          </div>
                        </div>
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
