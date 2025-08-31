import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/contexts/I18nProvider';
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
  Upload
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
  
  // Fetch workflow templates from the database
  const { data: workflowTemplates, isLoading: loadingWorkflows } = useQuery({
    queryKey: ['/api/workflow-templates'],
  });

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
        stageOrder: template.steps?.map((step: any) => step.id) || [],
        stages: template.steps?.map((step: any, index: number) => ({
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
        <TabsList className="grid w-full grid-cols-5">
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
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Company
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                Workflow Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loadingWorkflows && (
                  <div className="text-center py-4">Loading workflow templates...</div>
                )}
                
                {workflows.length === 0 && !loadingWorkflows && (
                  <div className="text-center py-8 text-gray-500">
                    No workflow templates found. Create your first workflow template to get started.
                  </div>
                )}

                {workflows.map((workflow) => (
                  <div key={workflow.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{workflow.name}</h3>
                        <p className="text-gray-600 text-sm">{workflow.description}</p>
                      </div>
                      <Badge variant={workflow.isActive ? "default" : "secondary"}>
                        {workflow.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600">
                        <strong>Stages:</strong> {workflow.stages?.length || 0}
                      </div>
                      
                      {workflow.stages && workflow.stages.length > 0 ? (
                        workflow.stages.map((stage, index) => (
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
                                  {stage.documentRequirements.map((req) => (
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
      </Tabs>
    </div>
  );
}