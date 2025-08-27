import { useState, useEffect } from 'react';
import { useTranslation } from '@/contexts/I18nProvider';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  CheckCircle2
} from 'lucide-react';
import PatraIcon from '@/components/icons/PatraIcon';

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

interface WorkflowStage {
  id: string;
  name: string;
  responsible: 'admin' | 'client' | 'worker' | 'thirdParty' | 'institution';
  approvalRequired: boolean;
  timeframeDays: number;
  statusLabel: string;
  description: string;
}

interface Workflow {
  id: string;
  name: string;
  documentTypeId: string;
  stages: WorkflowStage[];
  isActive: boolean;
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

export default function SettingsPage() {
  const { t } = useTranslation();
  const { setBreadcrumb } = useBreadcrumb();
  const { toast } = useToast();
  
  // Get the tab from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get('tab') || 'general';
  const [activeTab, setActiveTab] = useState(initialTab);

  // State for all settings sections
  const [documentCategories, setDocumentCategories] = useState<DocumentCategory[]>([]);
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

  const subscriptionPlans = [
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
      clients: '100+', 
      price: 'Contact us', 
      features: ['Enterprise features', 'Custom development', 'On-premise deployment'] 
    }
  ];

  useEffect(() => {
    setBreadcrumb([
      { label: 'Settings', href: '/settings' }
    ]);
  }, [setBreadcrumb]);

  const handleSaveSettings = async (section: string) => {
    try {
      toast({
        title: 'Settings Saved',
        description: `${section} settings have been saved successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const addDocumentCategory = () => {
    const newCategory: DocumentCategory = {
      id: `cat_${Date.now()}`,
      name: 'New Category',
      description: '',
      types: []
    };
    setDocumentCategories([...documentCategories, newCategory]);
  };

  const addWorkflow = () => {
    const newWorkflow: Workflow = {
      id: `wf_${Date.now()}`,
      name: 'New Workflow',
      documentTypeId: '',
      stages: [],
      isActive: true
    };
    setWorkflows([...workflows, newWorkflow]);
  };

  const addWorkflowStage = (workflowId: string) => {
    const newStage: WorkflowStage = {
      id: `stage_${Date.now()}`,
      name: 'New Stage',
      responsible: 'admin',
      approvalRequired: false,
      timeframeDays: 7,
      statusLabel: 'Pending',
      description: ''
    };
    
    setWorkflows(workflows => 
      workflows.map(wf => 
        wf.id === workflowId 
          ? { ...wf, stages: [...wf.stages, newStage] }
          : wf
      )
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="flex items-center gap-3 mb-8">
          <PatraIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Patra Settings</h1>
            <p className="text-muted-foreground">Configure your application settings and preferences</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Documents</span>
            </TabsTrigger>
            <TabsTrigger value="workflows" className="flex items-center gap-2">
              <Workflow className="h-4 w-4" />
              <span className="hidden sm:inline">Workflows</span>
            </TabsTrigger>
            <TabsTrigger value="expiry" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Expiry</span>
            </TabsTrigger>
            <TabsTrigger value="company" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span className="hidden sm:inline">Company</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Plans</span>
            </TabsTrigger>
          </TabsList>

          {/* Add navigation for additional tabs */}
          <div className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">System</span>
              </TabsTrigger>
              <TabsTrigger value="backup" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Backup</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  General Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>System Name</Label>
                    <Input defaultValue="Patra System" />
                  </div>
                  <div className="space-y-2">
                    <Label>Default Language</Label>
                    <Select defaultValue="en">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ro">Romana</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select defaultValue="Europe/Bucharest">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/Bucharest">Europe/Bucharest</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Default Currency</Label>
                    <Select defaultValue="RON">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RON">RON (Romanian Leu)</SelectItem>
                        <SelectItem value="EUR">EUR (Euro)</SelectItem>
                        <SelectItem value="USD">USD (US Dollar)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => handleSaveSettings('General')}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Document Categories & Types */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Document Categories & Types
                  </CardTitle>
                  <Button onClick={addDocumentCategory} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {documentCategories.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No document categories configured yet.</p>
                    <p>Click "Add Category" to create your first category.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {documentCategories.map((category) => (
                      <Card key={category.id} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <Input 
                            value={category.name}
                            onChange={(e) => {
                              setDocumentCategories(cats => 
                                cats.map(cat => 
                                  cat.id === category.id 
                                    ? { ...cat, name: e.target.value }
                                    : cat
                                )
                              );
                            }}
                            className="font-medium text-lg border-none px-0 h-auto mb-4"
                          />
                          <Textarea
                            value={category.description}
                            onChange={(e) => {
                              setDocumentCategories(cats => 
                                cats.map(cat => 
                                  cat.id === category.id 
                                    ? { ...cat, description: e.target.value }
                                    : cat
                                )
                              );
                            }}
                            placeholder="Category description..."
                            className="resize-none"
                            rows={2}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                <div className="flex justify-end pt-4">
                  <Button onClick={() => handleSaveSettings('Document Categories')}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Categories
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workflow Management */}
          <TabsContent value="workflows" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Workflow className="h-5 w-5" />
                    Workflow Management
                  </CardTitle>
                  <Button onClick={addWorkflow} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Workflow
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {workflows.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No workflows configured yet.</p>
                    <p>Click "Add Workflow" to create your first workflow.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {workflows.map((workflow) => (
                      <Card key={workflow.id} className="border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <Input 
                                  value={workflow.name}
                                  onChange={(e) => {
                                    setWorkflows(wfs => 
                                      wfs.map(wf => 
                                        wf.id === workflow.id 
                                          ? { ...wf, name: e.target.value }
                                          : wf
                                      )
                                    );
                                  }}
                                  className="font-medium text-lg border-none px-0 h-auto"
                                />
                                <Switch 
                                  checked={workflow.isActive}
                                  onCheckedChange={(checked) => {
                                    setWorkflows(wfs => 
                                      wfs.map(wf => 
                                        wf.id === workflow.id 
                                          ? { ...wf, isActive: checked }
                                          : wf
                                      )
                                    );
                                  }}
                                />
                                <Label className="text-sm">{workflow.isActive ? 'Active' : 'Inactive'}</Label>
                              </div>
                              <Button variant="outline" size="sm" onClick={() => addWorkflowStage(workflow.id)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Stage
                              </Button>
                            </div>
                            
                            {workflow.stages.length > 0 && (
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Workflow Stages</Label>
                                <div className="grid gap-3">
                                  {workflow.stages.map((stage, index) => (
                                    <div key={stage.id} className="p-4 bg-muted/50 rounded-lg space-y-3">
                                      <div className="flex items-center gap-3">
                                        <Badge variant="outline">{index + 1}</Badge>
                                        <Input
                                          value={stage.name}
                                          onChange={(e) => {
                                            setWorkflows(wfs => 
                                              wfs.map(wf => 
                                                wf.id === workflow.id 
                                                  ? {
                                                      ...wf, 
                                                      stages: wf.stages.map(s => 
                                                        s.id === stage.id 
                                                          ? { ...s, name: e.target.value }
                                                          : s
                                                      )
                                                    }
                                                  : wf
                                              )
                                            );
                                          }}
                                          className="flex-1 font-medium"
                                        />
                                      </div>
                                      
                                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                        <div className="space-y-2">
                                          <Label className="text-xs">Responsible</Label>
                                          <Select 
                                            value={stage.responsible}
                                            onValueChange={(value: any) => {
                                              setWorkflows(wfs => 
                                                wfs.map(wf => 
                                                  wf.id === workflow.id 
                                                    ? {
                                                        ...wf, 
                                                        stages: wf.stages.map(s => 
                                                          s.id === stage.id 
                                                            ? { ...s, responsible: value }
                                                            : s
                                                        )
                                                      }
                                                    : wf
                                                )
                                              );
                                            }}
                                          >
                                            <SelectTrigger className="h-8">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="admin">Admin</SelectItem>
                                              <SelectItem value="client">Client</SelectItem>
                                              <SelectItem value="worker">Worker</SelectItem>
                                              <SelectItem value="thirdParty">Third Party</SelectItem>
                                              <SelectItem value="institution">Institution</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        
                                        <div className="space-y-2">
                                          <Label className="text-xs">Timeframe (Days)</Label>
                                          <Input
                                            type="number"
                                            value={stage.timeframeDays}
                                            onChange={(e) => {
                                              setWorkflows(wfs => 
                                                wfs.map(wf => 
                                                  wf.id === workflow.id 
                                                    ? {
                                                        ...wf, 
                                                        stages: wf.stages.map(s => 
                                                          s.id === stage.id 
                                                            ? { ...s, timeframeDays: parseInt(e.target.value) || 0 }
                                                            : s
                                                        )
                                                      }
                                                    : wf
                                                )
                                              );
                                            }}
                                            className="h-8"
                                          />
                                        </div>
                                        
                                        <div className="space-y-2">
                                          <Label className="text-xs">Status Label</Label>
                                          <Input
                                            value={stage.statusLabel}
                                            onChange={(e) => {
                                              setWorkflows(wfs => 
                                                wfs.map(wf => 
                                                  wf.id === workflow.id 
                                                    ? {
                                                        ...wf, 
                                                        stages: wf.stages.map(s => 
                                                          s.id === stage.id 
                                                            ? { ...s, statusLabel: e.target.value }
                                                            : s
                                                        )
                                                      }
                                                    : wf
                                                )
                                              );
                                            }}
                                            className="h-8"
                                          />
                                        </div>
                                        
                                        <div className="flex items-center gap-2 pt-6">
                                          <Switch 
                                            checked={stage.approvalRequired}
                                            onCheckedChange={(checked) => {
                                              setWorkflows(wfs => 
                                                wfs.map(wf => 
                                                  wf.id === workflow.id 
                                                    ? {
                                                        ...wf, 
                                                        stages: wf.stages.map(s => 
                                                          s.id === stage.id 
                                                            ? { ...s, approvalRequired: checked }
                                                            : s
                                                        )
                                                      }
                                                    : wf
                                                )
                                              );
                                            }}
                                          />
                                          <Label className="text-xs">Approval Required</Label>
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-2">
                                        <Label className="text-xs">Stage Description</Label>
                                        <Textarea
                                          value={stage.description}
                                          onChange={(e) => {
                                            setWorkflows(wfs => 
                                              wfs.map(wf => 
                                                wf.id === workflow.id 
                                                  ? {
                                                      ...wf, 
                                                      stages: wf.stages.map(s => 
                                                        s.id === stage.id 
                                                          ? { ...s, description: e.target.value }
                                                          : s
                                                      )
                                                    }
                                                  : wf
                                              )
                                            );
                                          }}
                                          placeholder="Describe what happens in this stage..."
                                          className="resize-none text-xs"
                                          rows={2}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                <div className="flex justify-end pt-4">
                  <Button onClick={() => handleSaveSettings('Workflows')}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Workflows
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Document Expiry Alerts */}
          <TabsContent value="expiry" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Document Expiry Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-yellow-800">Document Expiry Tracking</h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        Configure automatic alerts for document expiration dates. Recipients will receive notifications 
                        at specified intervals before documents expire.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid gap-4">
                  <Card className="border-l-4 border-l-orange-500">
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Work Permit Expiry Alerts</h4>
                          <Switch defaultChecked />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm">Alert Days Before Expiry</Label>
                            <div className="flex gap-2">
                              <Input placeholder="30" className="w-20" />
                              <Input placeholder="15" className="w-20" />
                              <Input placeholder="7" className="w-20" />
                              <Input placeholder="3" className="w-20" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Alert Recipients</Label>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Switch defaultChecked />
                                <Label className="text-sm">Admin</Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch defaultChecked />
                                <Label className="text-sm">Client</Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch />
                                <Label className="text-sm">Worker</Label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={() => handleSaveSettings('Expiry Alerts')}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Alert Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Information */}
          <TabsContent value="company" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input 
                      value={companyInfo.companyName}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, companyName: e.target.value })}
                      placeholder="Your Company Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Registration Number (CUI)</Label>
                    <Input 
                      value={companyInfo.registrationNumber}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, registrationNumber: e.target.value })}
                      placeholder="RO12345678"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input 
                      value={companyInfo.phone}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                      placeholder="+40 21 XXX XXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Email</Label>
                    <Input 
                      type="email"
                      value={companyInfo.email}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                      placeholder="contact@company.ro"
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h4 className="font-medium">Bank Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Bank Name</Label>
                      <Input 
                        value={companyInfo.bankName}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, bankName: e.target.value })}
                        placeholder="Banca Transilvania"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>IBAN</Label>
                      <Input 
                        value={companyInfo.iban}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, iban: e.target.value })}
                        placeholder="RO49 AAAA 1B31 0075 9384 0000"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={() => handleSaveSettings('Company Information')}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Company Info
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription & Payment Processors */}
          <TabsContent value="subscription" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Subscription Plans
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {subscriptionPlans.map((plan) => (
                    <Card key={plan.id} className={`relative ${plan.id === 'premium' ? 'border-primary shadow-md' : ''}`}>
                      {plan.id === 'premium' && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                        </div>
                      )}
                      <CardContent className="p-6">
                        <div className="text-center space-y-4">
                          <h3 className="font-bold text-lg">{plan.name}</h3>
                          <div className="space-y-1">
                            <p className="text-3xl font-bold">
                              {typeof plan.price === 'number' ? (
                                <>
                                  <span className="text-lg">RON</span> {plan.price}
                                  <span className="text-sm font-normal">/month</span>
                                </>
                              ) : (
                                plan.price
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">Up to {plan.clients} clients</p>
                          </div>
                          <ul className="space-y-2 text-sm">
                            {plan.features.map((feature, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Processors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6">
                  {paymentProcessors.map((processor) => (
                    <Card key={processor.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium">{processor.name}</h4>
                            <Badge variant={processor.enabled ? 'default' : 'secondary'}>
                              {processor.enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                          <Switch 
                            checked={processor.enabled}
                            onCheckedChange={(checked) => {
                              setPaymentProcessors(processors => 
                                processors.map(p => 
                                  p.id === processor.id 
                                    ? { ...p, enabled: checked }
                                    : p
                                )
                              );
                            }}
                          />
                        </div>
                        
                        {processor.enabled && (
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm">API Key</Label>
                              <Input 
                                type="password"
                                value={processor.apiKey}
                                placeholder="Enter API key"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm">Test Mode</Label>
                              <div className="flex items-center gap-2">
                                <Switch checked={processor.testMode} />
                                <Label className="text-sm">{processor.testMode ? 'Test' : 'Production'}</Label>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={() => handleSaveSettings('Payment Processors')}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Payment Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Document Deadlines</Label>
                      <p className="text-sm text-muted-foreground">Alerts for approaching document deadlines</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Status Updates</Label>
                      <p className="text-sm text-muted-foreground">Workflow status change notifications</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">System Announcements</Label>
                      <p className="text-sm text-muted-foreground">Important system updates and announcements</p>
                    </div>
                    <Switch />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={() => handleSaveSettings('Notifications')}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Notification Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Access Control</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Two-Factor Authentication</Label>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Session Timeout (minutes)</Label>
                        <Input className="w-20" defaultValue="60" type="number" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Password Complexity</Label>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">Data Protection</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Data Encryption</Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Audit Logging</Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">GDPR Compliance</Label>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={() => handleSaveSettings('Security')}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Security Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>System Environment</Label>
                    <Select defaultValue="production">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="development">Development</SelectItem>
                        <SelectItem value="staging">Staging</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Log Level</Label>
                    <Select defaultValue="info">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="debug">Debug</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cache Duration (hours)</Label>
                    <Input type="number" defaultValue="24" />
                  </div>
                  <div className="space-y-2">
                    <Label>API Rate Limit (requests/minute)</Label>
                    <Input type="number" defaultValue="1000" />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={() => handleSaveSettings('System')}>
                    <Save className="h-4 w-4 mr-2" />
                    Save System Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backup Settings */}
          <TabsContent value="backup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Backup & Restore
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Automatic Backups</Label>
                      <p className="text-sm text-muted-foreground">Automatically backup data daily</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Backup Frequency</Label>
                    <Select defaultValue="daily">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Retention Period (days)</Label>
                    <Input type="number" defaultValue="30" />
                  </div>
                  
                  <div className="flex gap-4 pt-4">
                    <Button variant="outline">
                      Create Backup Now
                    </Button>
                    <Button variant="outline">
                      Restore from Backup
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={() => handleSaveSettings('Backup')}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Backup Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}