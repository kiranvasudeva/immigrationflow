import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
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
  description: string;
  assignedRole: string;
  estimatedDays: number;
  required: boolean;
  approvalRequired: boolean;
  approver?: string;
  statusLabel: string;
  responsible: string;
  timeframeDays: number;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
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
  
  // Get the tab from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get('tab') || 'general';
  const [activeTab, setActiveTab] = useState(initialTab);

  // State for all settings sections
  const [documentCategories, setDocumentCategories] = useState<DocumentCategory[]>([
    {
      id: 'work-permits',
      name: 'Work Permits',
      description: 'Documents required for Romanian work permit applications',
      types: [
        {
          id: 'initial-application',
          name: 'Initial Work Permit Application',
          description: 'First-time work permit application documents',
          requiredFields: ['passport', 'employment_contract', 'medical_certificate'],
          templateRequired: true
        },
        {
          id: 'renewal',
          name: 'Work Permit Renewal',
          description: 'Renewal of existing work permit',
          requiredFields: ['current_permit', 'employment_contract'],
          templateRequired: true
        }
      ]
    },
    {
      id: 'residence-permits',
      name: 'Residence Permits',
      description: 'Documents for Romanian residence permit applications',
      types: [
        {
          id: 'temp-residence',
          name: 'Temporary Residence Permit',
          description: 'Documents for temporary residence permit',
          requiredFields: ['passport', 'proof_of_accommodation'],
          templateRequired: false
        }
      ]
    }
  ]);
  
  const [workflows, setWorkflows] = useState<Workflow[]>([
    {
      id: 'work-permit-initial',
      name: 'Initial Work Permit Application',
      description: 'Complete Romanian work permit application process from AJOFM labor market test through IGI permit issuance',
      documentTypeId: 'work-permit-initial',
      isActive: true,
      stages: [
        {
          id: 'doc-collection',
          name: 'Initial Document Collection',
          description: 'Collect passport, diplomas, employment contract, and personal documents from worker',
          assignedRole: 'WORKER',
          estimatedDays: 3,
          required: true,
          approvalRequired: false,
          statusLabel: 'Collecting Documents',
          responsible: 'WORKER',
          timeframeDays: 3
        },
        {
          id: 'doc-review',
          name: 'Document Review & Translation',
          description: 'Review document completeness, prepare certified translations, and notarizations',
          assignedRole: 'ADMIN',
          estimatedDays: 2,
          required: true,
          approvalRequired: true,
          approver: 'Legal Team',
          statusLabel: 'Under Review',
          responsible: 'ADMIN',
          timeframeDays: 2
        },
        {
          id: 'employer-declaration',
          name: 'Employer Declaration Preparation',
          description: 'Prepare detailed employer declaration with job description, salary, and company information',
          assignedRole: 'CLIENT',
          estimatedDays: 2,
          required: true,
          approvalRequired: true,
          approver: 'Client Owner',
          statusLabel: 'Awaiting Employer Declaration',
          responsible: 'CLIENT',
          timeframeDays: 2
        },
        {
          id: 'ajofm-submission',
          name: 'AJOFM Labor Market Test Submission',
          description: 'Submit application to AJOFM/ANOFM for labor market test and job advertisement',
          assignedRole: 'ADMIN',
          estimatedDays: 1,
          required: true,
          approvalRequired: false,
          statusLabel: 'Submitted to AJOFM',
          responsible: 'ADMIN',
          timeframeDays: 1
        },
        {
          id: 'ajofm-processing',
          name: 'AJOFM Labor Market Test Processing',
          description: 'AJOFM evaluates job position availability and publishes job advertisement for 30 days',
          assignedRole: 'INSTITUTION',
          estimatedDays: 30,
          required: true,
          approvalRequired: true,
          approver: 'AJOFM Officer',
          statusLabel: 'AJOFM Processing',
          responsible: 'INSTITUTION',
          timeframeDays: 30
        },
        {
          id: 'ajofm-approval',
          name: 'AJOFM Approval Certificate',
          description: 'Receive AJOFM approval certificate confirming no Romanian/EU candidates available',
          assignedRole: 'ADMIN',
          estimatedDays: 1,
          required: true,
          approvalRequired: false,
          statusLabel: 'AJOFM Approved',
          responsible: 'ADMIN',
          timeframeDays: 1
        },
        {
          id: 'igi-prep',
          name: 'IGI Application Package Preparation',
          description: 'Prepare complete IGI work permit application with all supporting documents and AJOFM approval',
          assignedRole: 'ADMIN',
          estimatedDays: 3,
          required: true,
          approvalRequired: true,
          approver: 'Immigration Specialist',
          statusLabel: 'Preparing IGI Application',
          responsible: 'ADMIN',
          timeframeDays: 3
        },
        {
          id: 'igi-submission',
          name: 'IGI Work Permit Submission',
          description: 'Submit work permit application to Romanian Immigration Office (IGI) with all required documents',
          assignedRole: 'ADMIN',
          estimatedDays: 1,
          required: true,
          approvalRequired: false,
          statusLabel: 'Submitted to IGI',
          responsible: 'ADMIN',
          timeframeDays: 1
        },
        {
          id: 'igi-processing',
          name: 'IGI Work Permit Processing',
          description: 'IGI reviews and processes work permit application, may request additional documents',
          assignedRole: 'INSTITUTION',
          estimatedDays: 30,
          required: true,
          approvalRequired: true,
          approver: 'IGI Immigration Officer',
          statusLabel: 'IGI Processing',
          responsible: 'INSTITUTION',
          timeframeDays: 30
        },
        {
          id: 'permit-issued',
          name: 'Work Permit Issuance',
          description: 'Work permit successfully issued by IGI - worker can now apply for visa at Romanian consulate',
          assignedRole: 'ADMIN',
          estimatedDays: 1,
          required: true,
          approvalRequired: false,
          statusLabel: 'Work Permit Issued',
          responsible: 'ADMIN',
          timeframeDays: 1
        },
        {
          id: 'visa-prep',
          name: 'Consulate Visa Application Preparation',
          description: 'Prepare visa application documents for Romanian consulate appointment',
          assignedRole: 'WORKER',
          estimatedDays: 5,
          required: true,
          approvalRequired: false,
          statusLabel: 'Preparing Visa Application',
          responsible: 'WORKER',
          timeframeDays: 5
        },
        {
          id: 'visa-appointment',
          name: 'Consulate Visa Application',
          description: 'Submit visa application at Romanian consulate with work permit and supporting documents',
          assignedRole: 'WORKER',
          estimatedDays: 15,
          required: true,
          approvalRequired: true,
          approver: 'Consulate Officer',
          statusLabel: 'Visa Processing',
          responsible: 'WORKER',
          timeframeDays: 15
        },
        {
          id: 'visa-issued',
          name: 'Visa Issuance & Travel',
          description: 'Visa issued - worker can travel to Romania and begin employment',
          assignedRole: 'WORKER',
          estimatedDays: 1,
          required: true,
          approvalRequired: false,
          statusLabel: 'Process Complete',
          responsible: 'WORKER',
          timeframeDays: 1
        }
      ]
    },
    {
      id: 'residence-permit-temp',
      name: 'Temporary Residence Permit Application',
      description: 'Romanian temporary residence permit application for workers already in Romania with valid work permits',
      documentTypeId: 'residence-permit-temp',
      isActive: true,
      stages: [
        {
          id: 'residence-docs',
          name: 'Residence Document Collection',
          description: 'Collect documents for residence permit: work permit, employment contract, housing proof, insurance',
          assignedRole: 'WORKER',
          estimatedDays: 5,
          required: true,
          approvalRequired: false,
          statusLabel: 'Collecting Documents',
          responsible: 'WORKER',
          timeframeDays: 5
        },
        {
          id: 'medical-exam',
          name: 'Medical Examination',
          description: 'Complete required medical examination at authorized Romanian medical center',
          assignedRole: 'WORKER',
          estimatedDays: 3,
          required: true,
          approvalRequired: true,
          approver: 'Authorized Doctor',
          statusLabel: 'Medical Examination',
          responsible: 'WORKER',
          timeframeDays: 3
        },
        {
          id: 'residence-submission',
          name: 'IGI Residence Permit Submission',
          description: 'Submit residence permit application to IGI within 30 days of arrival in Romania',
          assignedRole: 'ADMIN',
          estimatedDays: 1,
          required: true,
          approvalRequired: true,
          approver: 'Immigration Specialist',
          statusLabel: 'Submitted to IGI',
          responsible: 'ADMIN',
          timeframeDays: 1
        },
        {
          id: 'residence-processing',
          name: 'IGI Processing & Interview',
          description: 'IGI processes residence permit application and may schedule interview with worker',
          assignedRole: 'INSTITUTION',
          estimatedDays: 30,
          required: true,
          approvalRequired: true,
          approver: 'IGI Immigration Officer',
          statusLabel: 'IGI Processing',
          responsible: 'INSTITUTION',
          timeframeDays: 30
        },
        {
          id: 'residence-issued',
          name: 'Residence Permit Issuance',
          description: 'Temporary residence permit issued - valid for work permit duration',
          assignedRole: 'ADMIN',
          estimatedDays: 1,
          required: true,
          approvalRequired: false,
          statusLabel: 'Residence Permit Issued',
          responsible: 'ADMIN',
          timeframeDays: 1
        }
      ]
    },
    {
      id: 'work-permit-renewal',
      name: 'Work Permit Renewal Process',
      description: 'Renewal process for existing work permits before expiration (must be initiated 60 days before expiry)',
      documentTypeId: 'work-permit-renewal',
      isActive: true,
      stages: [
        {
          id: 'renewal-assessment',
          name: 'Renewal Assessment',
          description: 'Assess renewal eligibility and gather updated employer and worker information',
          assignedRole: 'ADMIN',
          estimatedDays: 2,
          required: true,
          approvalRequired: true,
          approver: 'Immigration Specialist',
          statusLabel: 'Assessing Renewal',
          responsible: 'ADMIN',
          timeframeDays: 2
        },
        {
          id: 'updated-docs',
          name: 'Updated Documentation',
          description: 'Prepare updated employment contract, salary confirmation, and company documents',
          assignedRole: 'CLIENT',
          estimatedDays: 3,
          required: true,
          approvalRequired: true,
          approver: 'Client Owner',
          statusLabel: 'Updating Documents',
          responsible: 'CLIENT',
          timeframeDays: 3
        },
        {
          id: 'renewal-submission',
          name: 'IGI Renewal Submission',
          description: 'Submit work permit renewal application to IGI with updated documentation',
          assignedRole: 'ADMIN',
          estimatedDays: 1,
          required: true,
          approvalRequired: false,
          statusLabel: 'Submitted for Renewal',
          responsible: 'ADMIN',
          timeframeDays: 1
        },
        {
          id: 'renewal-processing',
          name: 'IGI Renewal Processing',
          description: 'IGI processes work permit renewal application (faster than initial application)',
          assignedRole: 'INSTITUTION',
          estimatedDays: 20,
          required: true,
          approvalRequired: true,
          approver: 'IGI Immigration Officer',
          statusLabel: 'Renewal Processing',
          responsible: 'INSTITUTION',
          timeframeDays: 20
        },
        {
          id: 'renewal-issued',
          name: 'Renewed Work Permit Issuance',
          description: 'Renewed work permit issued with extended validity period',
          assignedRole: 'ADMIN',
          estimatedDays: 1,
          required: true,
          approvalRequired: false,
          statusLabel: 'Renewal Complete',
          responsible: 'ADMIN',
          timeframeDays: 1
        }
      ]
    }
  ]);
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

  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [showWorkflowDetails, setShowWorkflowDetails] = useState(false);
  const [expandedDocuments, setExpandedDocuments] = useState<Set<string>>(new Set());
  const [expandedWorkflows, setExpandedWorkflows] = useState<Set<string>>(new Set());
  const [showTemplateForm, setShowTemplateForm] = useState<string | null>(null);
  const [selectedExpiryDocType, setSelectedExpiryDocType] = useState<string>('');
  const [templateContent, setTemplateContent] = useState<string>('');
  const [selectedMergeFields, setSelectedMergeFields] = useState<string[]>([]);

  const toggleDocumentExpansion = (id: string) => {
    const newExpanded = new Set(expandedDocuments);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedDocuments(newExpanded);
  };

  const toggleWorkflowExpansion = (id: string) => {
    const newExpanded = new Set(expandedWorkflows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedWorkflows(newExpanded);
  };

  // Real-world template generator for Romanian immigration documents
  const generateRealWorldTemplate = (docTypeName: string): string => {
    const templates: { [key: string]: string } = {
      'Work Permit': `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Permis de Muncă - Work Permit</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 3px solid #003366; padding-bottom: 20px; }
        .logo { font-size: 18px; font-weight: bold; color: #003366; }
        .document-title { font-size: 24px; font-weight: bold; margin: 20px 0; }
        .section { margin: 20px 0; }
        .field { margin: 10px 0; }
        .signature-area { margin-top: 50px; }
        .footer { border-top: 2px solid #003366; padding-top: 20px; margin-top: 40px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">INSPECTORATUL GENERAL PENTRU IMIGRĂRI</div>
        <div class="logo">GENERAL INSPECTORATE FOR IMMIGRATION</div>
        <div class="document-title">PERMIS DE MUNCĂ / WORK PERMIT</div>
        <p>Nr. {{permit_number}} / {{issue_date}}</p>
    </div>

    <div class="section">
        <h3>I. DATE PERSONALE / PERSONAL DATA</h3>
        <div class="field"><strong>Nume / Surname:</strong> {{worker_surname}}</div>
        <div class="field"><strong>Prenume / Given name:</strong> {{worker_given_name}}</div>
        <div class="field"><strong>Numărul pașaportului / Passport number:</strong> {{passport_number}}</div>
        <div class="field"><strong>Cetățenia / Nationality:</strong> {{nationality}}</div>
        <div class="field"><strong>Data nașterii / Date of birth:</strong> {{date_of_birth}}</div>
        <div class="field"><strong>Locul nașterii / Place of birth:</strong> {{place_of_birth}}</div>
        <div class="field"><strong>Sexul / Sex:</strong> {{gender}}</div>
    </div>

    <div class="section">
        <h3>II. DATE DESPRE ANGAJATOR / EMPLOYER DATA</h3>
        <div class="field"><strong>Denumirea angajatorului / Employer name:</strong> {{employer_name}}</div>
        <div class="field"><strong>CUI / Tax ID:</strong> {{employer_tax_id}}</div>
        <div class="field"><strong>Adresa / Address:</strong> {{employer_address}}</div>
        <div class="field"><strong>Reprezentant legal / Legal representative:</strong> {{legal_representative}}</div>
    </div>

    <div class="section">
        <h3>III. INFORMAȚII DESPRE LOCUL DE MUNCĂ / WORKPLACE INFORMATION</h3>
        <div class="field"><strong>Meseria / Occupation:</strong> {{occupation}}</div>
        <div class="field"><strong>Codul COR / COR code:</strong> {{cor_code}}</div>
        <div class="field"><strong>Locul de muncă / Workplace:</strong> {{workplace_address}}</div>
        <div class="field"><strong>Durata contractului / Contract duration:</strong> {{contract_duration}}</div>
        <div class="field"><strong>Salariul brut lunar / Gross monthly salary:</strong> {{monthly_salary}} RON</div>
    </div>

    <div class="signature-area">
        <div style="float: left; width: 45%;">
            <p><strong>Director General IGI</strong></p>
            <p>{{director_name}}</p>
            <p>_____________________</p>
            <p>Semnătura / Signature</p>
        </div>
        <div style="float: right; width: 45%; text-align: center;">
            <p><strong>Ștampila oficială</strong></p>
            <p><strong>Official Stamp</strong></p>
            <p>Data eliberării / Issue date: {{current_date}}</p>
        </div>
        <div style="clear: both;"></div>
    </div>

    <div class="footer">
        <p><em>Acest document este emis în conformitate cu Legea nr. 53/2003 privind Codul Muncii și OUG nr. 25/2014.</em></p>
        <p>Document generat de Patra Immigration System la {{generation_date}}</p>
    </div>
</body>
</html>`,

      'Visa Application': `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Cerere de Viză - Visa Application</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 3px solid #1f4e79; padding-bottom: 20px; }
        .logo { font-size: 16px; font-weight: bold; color: #1f4e79; }
        .document-title { font-size: 22px; font-weight: bold; margin: 20px 0; }
        .section { margin: 20px 0; }
        .field { margin: 8px 0; }
        .checkbox { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">CONSULATUL GENERAL AL ROMÂNIEI</div>
        <div class="logo">GENERAL CONSULATE OF ROMANIA</div>
        <div class="logo">{{consulate_location}}</div>
        <div class="document-title">CERERE DE VIZĂ DE LUNGĂ ȘEDERE</div>
        <div class="document-title">LONG-STAY VISA APPLICATION</div>
        <p>Nr. dosarului / File number: {{file_number}}</p>
    </div>

    <div class="section">
        <h3>1. DATE PERSONALE / PERSONAL DATA</h3>
        <div class="field"><strong>1.1 Nume / Surname:</strong> {{worker_surname}}</div>
        <div class="field"><strong>1.2 Prenume / Given names:</strong> {{worker_given_name}}</div>
        <div class="field"><strong>1.3 Data nașterii / Date of birth:</strong> {{date_of_birth}}</div>
        <div class="field"><strong>1.4 Locul nașterii / Place of birth:</strong> {{place_of_birth}}</div>
        <div class="field"><strong>1.5 Țara nașterii / Country of birth:</strong> {{country_of_birth}}</div>
        <div class="field"><strong>1.6 Cetățenia actuală / Current nationality:</strong> {{nationality}}</div>
        <div class="field"><strong>1.7 Sexul / Sex:</strong> {{gender}}</div>
        <div class="field"><strong>1.8 Starea civilă / Marital status:</strong> {{marital_status}}</div>
    </div>

    <div class="section">
        <h3>2. DOCUMENTUL DE CĂLĂTORIE / TRAVEL DOCUMENT</h3>
        <div class="field"><strong>2.1 Tipul documentului / Type of document:</strong> {{document_type}}</div>
        <div class="field"><strong>2.2 Numărul documentului / Document number:</strong> {{passport_number}}</div>
        <div class="field"><strong>2.3 Data eliberării / Date of issue:</strong> {{passport_issue_date}}</div>
        <div class="field"><strong>2.4 Valabil până la / Valid until:</strong> {{passport_expiry_date}}</div>
        <div class="field"><strong>2.5 Eliberat de / Issued by:</strong> {{passport_authority}}</div>
    </div>

    <div class="section">
        <h3>3. SCOPUL CĂLĂTORIEI / PURPOSE OF JOURNEY</h3>
        <div class="checkbox">☑ Activități economice / Economic activities</div>
        <div class="field"><strong>Detalii / Details:</strong> {{purpose_details}}</div>
        <div class="field"><strong>Angajator în România / Employer in Romania:</strong> {{employer_name}}</div>
    </div>

    <div class="section" style="margin-top: 50px;">
        <h3>DECLARAȚIE / DECLARATION</h3>
        <p>Declar pe propria răspundere că informațiile furnizate sunt corecte și complete.</p>
        <p><em>I hereby declare that the information provided is correct and complete.</em></p>
        
        <div style="margin-top: 30px; display: flex; justify-content: space-between;">
            <div>
                <p>Data / Date: {{application_date}}</p>
            </div>
            <div>
                <p>Semnătura solicitantului</p>
                <p>Applicant's signature</p>
                <p>_____________________</p>
            </div>
        </div>
    </div>
</body>
</html>`,

      default: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{document_title}}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .section { margin: 20px 0; }
        .field { margin: 10px 0; }
        .signature-area { margin-top: 50px; }
        .footer { border-top: 1px solid #333; padding-top: 20px; margin-top: 40px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{document_title}}</h1>
        <p>Document oficial pentru imigrare</p>
        <p>Nr. {{document_number}} / {{issue_date}}</p>
    </div>

    <div class="section">
        <h3>Informații Personale</h3>
        <div class="field"><strong>Nume complet:</strong> {{worker_name}}</div>
        <div class="field"><strong>Număr pașaport:</strong> {{passport_number}}</div>
        <div class="field"><strong>Cetățenie:</strong> {{nationality}}</div>
        <div class="field"><strong>Data nașterii:</strong> {{date_of_birth}}</div>
    </div>

    <div class="section">
        <h3>Detalii Document</h3>
        <div class="field"><strong>Tip document:</strong> {{document_type}}</div>
        <div class="field"><strong>Scop:</strong> {{purpose}}</div>
        <div class="field"><strong>Valabil de la:</strong> {{valid_from}}</div>
        <div class="field"><strong>Valabil până la:</strong> {{valid_until}}</div>
    </div>

    <div class="signature-area">
        <div style="float: left; width: 45%;">
            <p><strong>Autoritatea Emitentă</strong></p>
            <p>{{issuing_authority}}</p>
            <p>_____________________</p>
            <p>Semnătura oficială</p>
        </div>
        <div style="float: right; width: 45%; text-align: center;">
            <p><strong>Ștampila Oficială</strong></p>
            <p>{{current_date}}</p>
        </div>
        <div style="clear: both;"></div>
    </div>

    <div class="footer">
        <p><em>Document emis conform legislației românești pentru imigrare.</em></p>
        <p>Generat de Patra Immigration System la {{generation_date}}</p>
    </div>
</body>
</html>`
    };

    return templates[docTypeName] || templates.default.replace('{{document_title}}', docTypeName);
  };

  // Available merge fields for Romanian immigration documents
  const mergeFields = {
    personal: [
      'worker_name', 'worker_surname', 'worker_given_name', 'passport_number', 
      'nationality', 'date_of_birth', 'place_of_birth', 'country_of_birth',
      'gender', 'marital_status', 'maiden_name'
    ],
    employer: [
      'employer_name', 'employer_address', 'employer_tax_id', 'employer_phone',
      'employer_email', 'legal_representative', 'contact_person'
    ],
    work: [
      'occupation', 'cor_code', 'workplace_address', 'contract_duration',
      'monthly_salary', 'work_authorization', 'work_restrictions'
    ],
    document: [
      'document_number', 'permit_number', 'series', 'file_number',
      'issue_date', 'valid_from', 'valid_until', 'permit_type',
      'document_type', 'purpose_of_stay'
    ],
    official: [
      'issuing_authority', 'director_name', 'inspector_name',
      'consulate_location', 'current_date', 'generation_date'
    ]
  };

  const insertMergeField = (field: string) => {
    const textarea = document.querySelector('textarea[data-template-editor]') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newText = before + `{{${field}}}` + after;
      setTemplateContent(newText);
      textarea.value = newText;
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + field.length + 4;
        textarea.focus();
      }, 0);
    }
  };

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Settings', href: '/settings' }
    ]);
  }, [setBreadcrumbs]);

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
      description: 'Custom workflow for immigration process',
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
      description: 'New workflow stage',
      assignedRole: 'ADMIN',
      estimatedDays: 7,
      required: true,
      approvalRequired: false,
      statusLabel: 'Pending',
      responsible: 'ADMIN',
      timeframeDays: 7
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <PatraIcon className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Patra Settings</h1>
              <p className="text-muted-foreground">Configure your application settings and preferences</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setLocation('/')}
            className="flex items-center gap-2"
            data-testid="button-back-to-app"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to App
          </Button>
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
                  <div className="space-y-4">
                    {documentCategories.map((category) => {
                      const isExpanded = expandedDocuments.has(category.id);
                      return (
                        <Card key={category.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between cursor-pointer" 
                                   onClick={() => toggleDocumentExpansion(category.id)}>
                                <div className="flex items-center gap-2">
                                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                  <h4 className="font-medium text-lg">{category.name}</h4>
                                  <Badge variant="outline">{category.types.length} types</Badge>
                                </div>
                                <Button size="sm" variant="ghost" onClick={(e) => e.stopPropagation()}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              {!isExpanded && (
                                <p className="text-sm text-muted-foreground">{category.description}</p>
                              )}
                              
                              {isExpanded && (
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium">Category Name</Label>
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
                                      placeholder="Enter category name"
                                    />
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium">Description</Label>
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
                                  </div>
                                  
                                  {/* Document Types within Category */}
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                      <Label className="text-sm font-medium">Document Types</Label>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => {
                                          const newType = { 
                                            id: `type-${Date.now()}`, 
                                            name: 'New Document Type', 
                                            description: '',
                                            requiredFields: ['worker_name', 'passport_number'],
                                            templateRequired: false
                                          };
                                          setDocumentCategories(cats => 
                                            cats.map(cat => 
                                              cat.id === category.id 
                                                ? { ...cat, types: [...cat.types, newType] }
                                                : cat
                                            )
                                          );
                                        }}
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add Type
                                      </Button>
                                    </div>
                                    
                                    <div className="space-y-3">
                                      {category.types.map((type, typeIndex) => (
                                        <Card key={type.id} className="bg-muted/30">
                                          <CardContent className="p-4">
                                            <div className="space-y-3">
                                              <div className="flex items-start justify-between">
                                                <div className="flex-1 space-y-2">
                                                  <Input
                                                    value={type.name}
                                                    onChange={(e) => {
                                                      setDocumentCategories(cats => 
                                                        cats.map(cat => 
                                                          cat.id === category.id 
                                                            ? { 
                                                                ...cat, 
                                                                types: cat.types.map(t => 
                                                                  t.id === type.id ? { ...t, name: e.target.value } : t
                                                                )
                                                              }
                                                            : cat
                                                        )
                                                      );
                                                    }}
                                                    className="font-medium"
                                                    placeholder="Document type name"
                                                  />
                                                  
                                                  <Textarea
                                                    value={type.description || ''}
                                                    onChange={(e) => {
                                                      setDocumentCategories(cats => 
                                                        cats.map(cat => 
                                                          cat.id === category.id 
                                                            ? { 
                                                                ...cat, 
                                                                types: cat.types.map(t => 
                                                                  t.id === type.id ? { ...t, description: e.target.value } : t
                                                                )
                                                              }
                                                            : cat
                                                        )
                                                      );
                                                    }}
                                                    placeholder="Document type description..."
                                                    rows={2}
                                                    className="resize-none text-sm"
                                                  />
                                                  
                                                  <div className="flex items-center gap-4">
                                                    <Badge variant="secondary">{type.requiredFields.length} required fields</Badge>
                                                    <div className="flex items-center gap-2">
                                                      <Label className="text-xs">Template Required</Label>
                                                      <Switch 
                                                        checked={type.templateRequired}
                                                        onCheckedChange={(checked) => {
                                                          setDocumentCategories(cats => 
                                                            cats.map(cat => 
                                                              cat.id === category.id 
                                                                ? { 
                                                                    ...cat, 
                                                                    types: cat.types.map(t => 
                                                                      t.id === type.id ? { ...t, templateRequired: checked } : t
                                                                    )
                                                                  }
                                                                : cat
                                                            )
                                                          );
                                                        }}
                                                      />
                                                    </div>
                                                  </div>
                                                </div>
                                                
                                                <Button 
                                                  size="sm" 
                                                  variant="ghost"
                                                  onClick={() => {
                                                    setDocumentCategories(cats => 
                                                      cats.map(cat => 
                                                        cat.id === category.id 
                                                          ? { ...cat, types: cat.types.filter(t => t.id !== type.id) }
                                                          : cat
                                                      )
                                                    );
                                                  }}
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                              </div>
                                              
                                              {type.templateRequired && (
                                                <div className="mt-3 pt-3 border-t">
                                                  {showTemplateForm === type.id ? (
                                                    <Card className="border-dashed">
                                                      <CardContent className="p-4">
                                                        <div className="space-y-4">
                                                          <div className="flex items-center justify-between">
                                                            <h6 className="font-medium flex items-center gap-2">
                                                              <Code className="h-4 w-4" />
                                                              Template Editor - {type.name}
                                                            </h6>
                                                            <Button size="sm" variant="ghost" 
                                                                   onClick={() => setShowTemplateForm(null)}>
                                                              <XCircle className="h-4 w-4" />
                                                            </Button>
                                                          </div>
                                                          <div className="space-y-3">
                                                            <div>
                                                              <Label className="text-sm">Template Name</Label>
                                                              <Input defaultValue={`${type.name} Template`} className="mt-1" />
                                                            </div>
                                                            <div className="space-y-4">
                                                              <div className="flex items-center justify-between">
                                                                <Label className="text-sm font-medium">Professional Document Template</Label>
                                                                <div className="flex gap-2">
                                                                  <Button size="xs" variant="outline" 
                                                                          onClick={() => setTemplateContent(generateRealWorldTemplate(type.name))}
                                                                          title="Load authentic Romanian immigration template">
                                                                    Load Real Template
                                                                  </Button>
                                                                  <Button size="xs" variant="outline">
                                                                    Preview
                                                                  </Button>
                                                                </div>
                                                              </div>
                                                              
                                                              {/* Merge Field Widgets */}
                                                              <Card className="border-dashed">
                                                                <CardContent className="p-3">
                                                                  <div className="space-y-3">
                                                                    <Label className="text-xs font-medium">🎯 Merge Fields - Click to Insert</Label>
                                                                    {Object.entries(mergeFields).map(([category, fields]) => (
                                                                      <div key={category} className="space-y-2">
                                                                        <Label className="text-xs text-muted-foreground capitalize font-medium">
                                                                          {category.replace('_', ' ')} Data
                                                                        </Label>
                                                                        <div className="flex flex-wrap gap-1">
                                                                          {fields.map(field => (
                                                                            <Button
                                                                              key={field}
                                                                              size="xs"
                                                                              variant="secondary"
                                                                              className="h-6 text-xs hover:bg-blue-100"
                                                                              onClick={() => insertMergeField(field)}
                                                                              title={`Insert {{${field}}}`}
                                                                            >
                                                                              {field.replace(/_/g, ' ')}
                                                                            </Button>
                                                                          ))}
                                                                        </div>
                                                                      </div>
                                                                    ))}
                                                                  </div>
                                                                </CardContent>
                                                              </Card>

                                                              {/* Rich Text Template Editor */}
                                                              <div className="space-y-2">
                                                                <div className="flex items-center gap-2 p-2 border rounded-t-md bg-muted/30">
                                                                  <Button size="xs" variant="ghost" title="Bold">
                                                                    <strong>B</strong>
                                                                  </Button>
                                                                  <Button size="xs" variant="ghost" title="Italic">
                                                                    <em>I</em>
                                                                  </Button>
                                                                  <Button size="xs" variant="ghost" title="Underline">
                                                                    <u>U</u>
                                                                  </Button>
                                                                  <Separator orientation="vertical" className="h-4" />
                                                                  <Select defaultValue="p">
                                                                    <SelectTrigger className="w-20 h-6">
                                                                      <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                      <SelectItem value="p">P</SelectItem>
                                                                      <SelectItem value="h1">H1</SelectItem>
                                                                      <SelectItem value="h2">H2</SelectItem>
                                                                      <SelectItem value="h3">H3</SelectItem>
                                                                    </SelectContent>
                                                                  </Select>
                                                                  <Separator orientation="vertical" className="h-4" />
                                                                  <Button size="xs" variant="ghost" title="Insert Table">
                                                                    ⊞
                                                                  </Button>
                                                                  <Button size="xs" variant="ghost" title="Insert Image">
                                                                    🖼
                                                                  </Button>
                                                                </div>
                                                                <Textarea 
                                                                  className="rounded-t-none min-h-[400px] font-mono text-sm"
                                                                  data-template-editor
                                                                  value={templateContent || generateRealWorldTemplate(type.name)}
                                                                  onChange={(e) => setTemplateContent(e.target.value)}
                                                                  placeholder="Create your document template here. Use the merge fields above to insert dynamic content."
                                                                />
                                                              </div>
                                                              
                                                              <div className="text-xs text-muted-foreground p-3 bg-blue-50 rounded border-l-4 border-l-blue-400">
                                                                <strong>💡 Professional Tip:</strong> This template generates official Romanian immigration documents. 
                                                                Use merge fields like <code>{{worker_name}}</code> to automatically populate data from client and worker profiles.
                                                                The system includes authentic templates for Work Permits, Visa Applications, and Residence Permits.
                                                              </div>
                                                            </div>
                                                            <div className="flex justify-between">
                                                              <div className="flex gap-2">
                                                                <Button size="sm" variant="outline">
                                                                  <Upload className="h-4 w-4 mr-2" />
                                                                  Import Template
                                                                </Button>
                                                                <Button size="sm" variant="outline">
                                                                  <Code className="h-4 w-4 mr-2" />
                                                                  Export HTML
                                                                </Button>
                                                              </div>
                                                              <div className="flex gap-2">
                                                                <Button size="sm" variant="outline" 
                                                                        onClick={() => {
                                                                          setShowTemplateForm(null);
                                                                          setTemplateContent('');
                                                                        }}>
                                                                  Cancel
                                                                </Button>
                                                                <Button size="sm" onClick={() => {
                                                                  toast({ 
                                                                    title: 'Template Saved!', 
                                                                    description: `Professional template for ${type.name} saved with real-world Romanian immigration format.` 
                                                                  });
                                                                  setShowTemplateForm(null);
                                                                  setTemplateContent('');
                                                                }}>
                                                                  <Save className="h-4 w-4 mr-2" />
                                                                  Save Template
                                                                </Button>
                                                              </div>
                                                            </div>
                                                          </div>
                                                        </div>
                                                      </CardContent>
                                                    </Card>
                                                  ) : (
                                                    <Button size="sm" variant="outline" 
                                                           onClick={() => setShowTemplateForm(type.id)}>
                                                      <Code className="h-4 w-4 mr-2" />
                                                      Create/Edit Template
                                                    </Button>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          </CardContent>
                                        </Card>
                                      ))}
                                      
                                      {category.types.length === 0 && (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                          No document types added yet. Click "Add Type" to create one.
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
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
                  <div className="space-y-4">
                    {workflows.map((workflow) => {
                      const isExpanded = expandedWorkflows.has(workflow.id);
                      return (
                        <Card key={workflow.id} className="border-l-4 border-l-green-500">
                          <CardContent className="p-4">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between cursor-pointer" 
                                   onClick={() => toggleWorkflowExpansion(workflow.id)}>
                                <div className="flex items-center gap-2">
                                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                  <h4 className="font-medium text-lg">{workflow.name}</h4>
                                  <Badge variant="outline">{workflow.stages.length} stages</Badge>
                                  <Badge variant={workflow.isActive ? "default" : "secondary"}>
                                    {workflow.isActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                </div>
                                <Button size="sm" variant="ghost" onClick={(e) => e.stopPropagation()}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              {!isExpanded && (
                                <p className="text-sm text-muted-foreground">{workflow.description}</p>
                              )}
                              
                              {isExpanded && (
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium">Workflow Name</Label>
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
                                      placeholder="Enter workflow name"
                                    />
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium">Description</Label>
                                    <Textarea
                                      value={workflow.description || ''}
                                      onChange={(e) => {
                                        setWorkflows(wfs => 
                                          wfs.map(wf => 
                                            wf.id === workflow.id 
                                              ? { ...wf, description: e.target.value }
                                              : wf
                                          )
                                        );
                                      }}
                                      placeholder="Workflow description..."
                                      className="resize-none"
                                      rows={2}
                                    />
                                  </div>
                                  
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                      <Label className="text-sm">Active</Label>
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
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => addWorkflowStage(workflow.id)}>
                                      <Plus className="h-4 w-4 mr-2" />
                                      Add Stage
                                    </Button>
                                  </div>
                                  
                                  {/* Workflow Stages within Expanded Section */}
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
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
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
                      <h3 className="font-medium text-yellow-800">Document Type Expiry Tracking</h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        Configure automatic alerts for specific document types. Set different alert periods 
                        for each document type based on their importance and renewal requirements.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Document Type Selector */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Select Document Type to Configure</Label>
                    <Select 
                      value={selectedExpiryDocType} 
                      onValueChange={setSelectedExpiryDocType}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a document type to configure expiry alerts..." />
                      </SelectTrigger>
                      <SelectContent>
                        {documentCategories.length === 0 ? (
                          <SelectItem value="" disabled>No document types available</SelectItem>
                        ) : (
                          documentCategories.map((category) => (
                            <SelectGroup key={category.id}>
                              <SelectLabel>{category.name}</SelectLabel>
                              {category.types.map((docType) => (
                                <SelectItem key={docType.id} value={docType.id}>
                                  {docType.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedExpiryDocType && (() => {
                    const selectedType = documentCategories
                      .flatMap(cat => cat.types)
                      .find(type => type.id === selectedExpiryDocType);
                    
                    if (!selectedType) return null;
                    
                    return (
                      <Card className="border-l-4 border-l-orange-500">
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  {selectedType.name}
                                </h5>
                                <p className="text-sm text-muted-foreground">{selectedType.description}</p>
                                <Badge variant="outline" className="mt-2">
                                  {documentCategories.find(cat => cat.types.some(t => t.id === selectedType.id))?.name}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Label className="text-sm">Enable Alerts</Label>
                                <Switch defaultChecked />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm">Days Before Expiry to Send Alert</Label>
                                <Input 
                                  type="number" 
                                  min="1"
                                  max="365"
                                  defaultValue={selectedType.id.includes('work-permit') || selectedType.id.includes('renewal') ? "60" : "30"}
                                  className="w-32"
                                  placeholder="30"
                                />
                                <p className="text-xs text-muted-foreground">
                                  Alert will be sent this many days before {selectedType.name.toLowerCase()} expires
                                </p>
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
                                    <Label className="text-sm">Client Owner</Label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Switch />
                                    <Label className="text-sm">Worker</Label>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="border-t pt-4">
                              <div className="space-y-3">
                                <Label className="text-sm font-medium">Advanced Settings</Label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="space-y-2">
                                    <Label className="text-xs">Reminder Frequency</Label>
                                    <Select defaultValue="weekly">
                                      <SelectTrigger className="h-8">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label className="text-xs">Priority Level</Label>
                                    <Select defaultValue={selectedType.id.includes('work-permit') ? 'high' : 'medium'}>
                                      <SelectTrigger className="h-8">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="critical">Critical</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label className="text-xs">Auto-extend</Label>
                                    <div className="flex items-center gap-2">
                                      <Switch />
                                      <Label className="text-xs">Enable</Label>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })()}
                  
                  {documentCategories.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No document types configured yet.</p>
                      <p>Add document categories first to set up expiry alerts.</p>
                    </div>
                  )}
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
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Subscription Plans
                  </CardTitle>
                  <Button size="sm" onClick={() => {
                    const newPlan: SubscriptionPlan = {
                      id: `plan-${Date.now()}`,
                      name: 'New Plan',
                      clients: 10,
                      price: 100,
                      features: ['Basic features']
                    };
                    setSubscriptionPlans([...subscriptionPlans, newPlan]);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Plan
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Plan Configuration Forms */}
                <div className="space-y-4">
                  {subscriptionPlans.map((plan, index) => (
                    <Card key={plan.id} className="border">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Plan Name</Label>
                            <Input 
                              value={plan.name}
                              onChange={(e) => {
                                const updated = [...subscriptionPlans];
                                updated[index] = { ...plan, name: e.target.value };
                                setSubscriptionPlans(updated);
                              }}
                              placeholder="e.g., Premium Plan"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Price (RON/month)</Label>
                            <Input 
                              type="number"
                              min="0"
                              value={typeof plan.price === 'number' ? plan.price : 0}
                              onChange={(e) => {
                                const updated = [...subscriptionPlans];
                                updated[index] = { ...plan, price: parseInt(e.target.value) || 0 };
                                setSubscriptionPlans(updated);
                              }}
                              placeholder="299"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Max Clients</Label>
                            <Input 
                              type="number"
                              min="1"
                              value={plan.clients}
                              onChange={(e) => {
                                const updated = [...subscriptionPlans];
                                updated[index] = { ...plan, clients: parseInt(e.target.value) || 1 };
                                setSubscriptionPlans(updated);
                              }}
                              placeholder="50"
                            />
                          </div>
                        </div>
                        
                        <div className="mt-4 space-y-2">
                          <Label>Features (one per line)</Label>
                          <Textarea
                            value={plan.features.join('\n')}
                            onChange={(e) => {
                              const updated = [...subscriptionPlans];
                              updated[index] = { ...plan, features: e.target.value.split('\n').filter(f => f.trim()) };
                              setSubscriptionPlans(updated);
                            }}
                            placeholder="Advanced workflows&#10;Custom templates&#10;Priority support"
                            rows={4}
                          />
                        </div>
                        
                        <div className="mt-4 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={plan.id === 'premium'}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  const updated = subscriptionPlans.map(p => ({ ...p, id: p.id === plan.id ? 'premium' : p.id }));
                                  setSubscriptionPlans(updated);
                                }
                              }}
                            />
                            <Label className="text-sm">Mark as "Most Popular"</Label>
                          </div>
                          
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => {
                              setSubscriptionPlans(subscriptionPlans.filter((_, i) => i !== index));
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {/* Plan Preview */}
                <div className="border-t pt-6">
                  <h4 className="font-medium mb-4">Plan Preview</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {subscriptionPlans.map((plan) => (
                      <Card key={plan.id} className={`relative ${plan.id === 'premium' ? 'border-primary shadow-md' : ''}`}>
                        {plan.id === 'premium' && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                          </div>
                        )}
                        <CardContent className="p-4">
                          <div className="text-center space-y-3">
                            <h3 className="font-bold text-sm">{plan.name}</h3>
                            <div className="space-y-1">
                              <p className="text-xl font-bold">
                                {typeof plan.price === 'number' ? (
                                  <>
                                    <span className="text-sm">RON</span> {plan.price}
                                    <span className="text-xs font-normal">/month</span>
                                  </>
                                ) : (
                                  plan.price
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">Up to {plan.clients} clients</p>
                            </div>
                            <ul className="space-y-1 text-xs">
                              {plan.features.slice(0, 3).map((feature, index) => (
                                <li key={index} className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                                  {feature}
                                </li>
                              ))}
                              {plan.features.length > 3 && (
                                <li className="text-muted-foreground">+{plan.features.length - 3} more</li>
                              )}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={() => handleSaveSettings('Subscription Plans')}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Plan Settings
                  </Button>
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