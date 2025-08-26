import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TranslationContextType {
  currentLanguage: string;
  setLanguage: (language: string) => void;
  t: (key: string) => string;
  availableLanguages: { code: string; name: string }[];
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

interface Translation {
  id: string;
  key: string;
  language: string;
  value: string;
}

// Comprehensive fallback translations for all languages
const fallbackTranslations = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.clients': 'Clients',
    'nav.workers': 'Workers',
    'nav.templates': 'Templates',
    'nav.analytics': 'Analytics',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    'nav.features': 'Features',
    'nav.pricing': 'Pricing',
    'nav.support': 'Support',
    'nav.requirements': 'Requirements',
    'nav.reminders': 'Reminders',
    'nav.auditLogs': 'Audit Logs',
    'nav.deadlines': 'Deadlines',
    'nav.profile': 'Profile',
    
    // Landing page
    'landing.title': 'Romanian Immigration Management',
    'landing.subtitle': 'Streamline your Romanian immigration workflows',
    'landing.description': 'Complete SaaS platform for managing work permits, visa applications, and residence permits. From AJOFM labor market tests to final IGI approvals.',
    'landing.login': 'Login',
    
    // Common elements
    'common.generating': 'Generating...',
    'common.welcome': 'Welcome',
    'common.dashboard': 'Dashboard',
    'common.clients': 'Clients',
    'common.workers': 'Workers',
    'common.templates': 'Templates',
    'common.analytics': 'Analytics',
    'common.profile': 'Profile',
    'common.documents': 'Documents',
    'common.deadlines': 'Deadlines',
    'common.logout': 'Logout',
    'common.view': 'View',
    
    // Worker invitations
    'worker.invite': 'Invite Worker',
    'worker.inviteTitle': 'Invite Worker to Access Profile',
    'worker.generateInvite': 'Generate Invitation Link',
    'worker.invitationLink': 'Invitation Link',
    'worker.linkDescription': 'Share this link with the worker to give them access to their profile and document upload area.',
    'worker.list': 'Worker List',
    'worker.add': 'Add Worker',
    'worker.status': 'Worker Status',
    'worker.documents': 'Worker Documents',
    'worker.progress': 'Progress',
    'worker.assignments': 'Assignments',
    'worker.dashboard': 'Worker Dashboard',
    'worker.myDocuments': 'My Documents',
    'worker.uploadDocument': 'Upload Document',
    'worker.nextSteps': 'Next Steps',
    'worker.urgentActions': 'Urgent Actions Required',
    'worker.welcome': 'Welcome',
    'worker.getStarted': 'Get Started',
    'worker.uploadDocuments': 'Upload Documents',
    'worker.completed': 'Completed',
    'worker.notifications': 'Notifications',
    
    // Dashboard stats
    'dashboard.title': 'Dashboard',
    'dashboard.totalClients': 'Total Clients',
    'dashboard.activeWorkers': 'Active Workers',
    'dashboard.pendingActions': 'Pending Actions',
    'dashboard.completedMonth': 'Completed This Month',
    'dashboard.stats.totalClients': 'Total Clients',
    'dashboard.stats.totalWorkers': 'Total Workers',
    'dashboard.stats.pendingActions': 'Pending Actions',
    'dashboard.stats.completed': 'Completed',
    'dashboard.stats.completedThisMonth': 'Completed This Month',
    'dashboard.welcome': 'Welcome',
    'dashboard.worker.title': 'Worker Dashboard',
    'dashboard.worker.subtitle': 'Track your immigration process',
    
    // Client management
    'client.list': 'Client List',
    'client.add': 'Add Client',
    'client.edit': 'Edit Client',
    'client.delete': 'Delete Client',
    'client.company': 'Company',
    'client.contact': 'Contact',
    'client.dashboard': 'Client Dashboard',
    'client.workers': 'Client Workers',
    'client.addWorker': 'Add Worker',
    'client.viewProgress': 'View Progress',
    'client.settings': 'Client Settings',
    'client.register': 'Register Client',
    'client.companyInfo': 'Company Information',
    'client.contactDetails': 'Contact Details',
    'client.verification': 'Verification',
    'client.termsAccept': 'Accept Terms',
    'client.submitRegistration': 'Submit Registration',
    
    // Actions
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.edit': 'Edit',
    'action.delete': 'Delete',
    'action.create': 'Create',
    'action.view': 'View',
    'action.close': 'Close',
    'action.submit': 'Submit',
    'action.search': 'Search',
    'action.filter': 'Filter',
    'action.export': 'Export',
    'action.upload': 'Upload',
    'action.newClient': 'New Client',
    'actions.saveChanges': 'Save Changes',
    'actions.editProfile': 'Edit Profile',
    
    // Status labels
    'status.active': 'Active',
    'status.inactive': 'Inactive',
    'status.pending': 'Pending',
    'status.approved': 'Approved',
    'status.rejected': 'Rejected',
    'status.in_progress': 'In Progress',
    'status.completed': 'Completed',
    'status.overdue': 'Overdue',
    'status.draft': 'Draft',
    'status.view': 'View Status',
    
    // Form labels
    'form.firstName': 'First Name',
    'form.lastName': 'Last Name',
    'form.email': 'Email',
    'form.phone': 'Phone',
    'form.address': 'Address',
    'form.dateOfBirth': 'Date of Birth',
    'form.nationality': 'Nationality',
    'form.passport': 'Passport Number',
    'form.companyName': 'Company Name',
    'form.position': 'Position',
    'form.salary': 'Salary',
    'form.startDate': 'Start Date',
    'form.endDate': 'End Date',
    'form.description': 'Description',
    'form.labels.email': 'Email Address',
    'form.labels.phoneNumber': 'Phone Number',
    'form.required': 'Required',
    'form.optional': 'Optional',
    'form.save': 'Save',
    'form.cancel': 'Cancel',
    'form.validation.required': 'This field is required',
    'form.validation.email': 'Please enter a valid email',
    'form.validation.phone': 'Please enter a valid phone number',
    
    // Table headers
    'table.headers.name': 'Name',
    'table.headers.document': 'Document',
    'table.headers.stage': 'Stage',
    'table.headers.status': 'Status',
    'table.headers.date': 'Date',
    'table.headers.dueDate': 'Due Date',
    'table.headers.actions': 'Actions',
    'table.noData': 'No data available',
    'table.loading': 'Loading...',
    'table.rowsPerPage': 'Rows per page',
    
    // Messages
    'message.success': 'Success',
    'message.error': 'Error',
    'message.loading': 'Loading...',
    'message.noData': 'No data available',
    'message.confirmDelete': 'Are you sure you want to delete this item?',
    
    // Templates
    'templates.title': 'Document Templates',
    'templates.description': 'Create and manage document templates for Romanian immigration forms',
    'templates.createFirst': 'Create First Template',
    'templates.noTemplates': 'No Templates Yet',
    'templates.createButton': 'Create Template',
    'templates.create': 'Create Template',
    'templates.edit': 'Edit Template',
    'templates.delete': 'Delete Template',
    'template.builder': 'Template Builder',
    'template.fields': 'Template Fields',
    'template.preview': 'Template Preview',
    
    // Analytics
    'analytics.title': 'Analytics Dashboard',
    'analytics.description': 'Comprehensive analytics and reporting for immigration workflows',
    'analytics.recentActivity': 'Recent Activity',
    'analytics.statusDistribution': 'Assignment Status Distribution',
    'analytics.stageProgress': 'Stage Progress',
    'analytics.monthlyTrend': 'Monthly Progress Trend',
    'analytics.clientPerformance': 'Client Performance',
    'analytics.advanced': 'Advanced Analytics',
    'analytics.charts': 'Charts',
    'analytics.reports': 'Reports',
    'analytics.export': 'Export',
    'analytics.dateRange': 'Date Range',
    'analytics.filters': 'Filters',
    'analytics.performance': 'Performance',
    
    // Profile
    'profile.title': 'Profile',
    'profile.personalInfo': 'Personal Information',
    'profile.edit': 'Edit Profile',
    'profile.settings': 'Profile Settings',
    'profile.changePassword': 'Change Password',
    'profile.notifications': 'Notifications',
    'profile.preferences': 'Preferences',
    'profile.manageInfo': 'Manage your account information',
    'profile.joined': 'Joined',
    'profile.workPermitStatus': 'Work Permit Status',
    'pages.profile.title': 'Profile',
    
    // Authentication
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.welcome': 'Welcome',
    'auth.unauthorized': 'Unauthorized',
    'auth.sessionExpired': 'Session Expired',
    'auth.permissions': 'Permissions',
    
    // Admin features
    'admin.dashboard': 'Admin Dashboard',
    'admin.userManagement': 'User Management',
    'admin.systemSettings': 'System Settings',
    'admin.createUser': 'Create User',
    'admin.deleteUser': 'Delete User',
    'admin.permissions': 'Permissions',
    'system.maintenance': 'System Maintenance',
    'audit.logs': 'Audit Logs',
    
    // Viewer features
    'viewer.dashboard': 'Viewer Dashboard',
    'viewer.readOnly': 'Read Only',
    'document.preview': 'Document Preview',
    'progress.view': 'Progress View',
    'document.status': 'Document Status',
    'deadline.upcoming': 'Upcoming Deadlines',
    
    // Modal dialogs
    'modal.confirm': 'Confirm',
    'modal.cancel': 'Cancel',
    'modal.close': 'Close',
    'modal.title': 'Modal',
    'modal.delete.title': 'Delete Item',
    'modal.delete.message': 'Are you sure you want to delete this item?',
    'modal.save.title': 'Save Changes',
    'modal.login.adminDesc': 'Administrative access to manage users, settings, and system configuration.',
    'modal.login.ownerDesc': 'Full access to manage clients, workers, and business operations.',
    'modal.login.workerDesc': 'Personal workspace to upload documents and track immigration progress.',
    'modal.login.viewerDesc': 'Read-only access to view documents and progress information.',
    'modal.login.invitationText': 'Workers can only access through invitation links provided by client owners.',
    'modal.login.supportText': 'Need help?',
    'modal.login.supportLink': 'Contact Support',
    
    // Notifications
    'notification.success': 'Success',
    'notification.error': 'Error',
    'notification.warning': 'Warning',
    'notification.info': 'Information',
    'notification.loading': 'Loading',
    'notification.saved': 'Saved',
    
    // User flows
    'onboarding.step1': 'Step 1',
    'onboarding.step2': 'Step 2',
    'onboarding.step3': 'Step 3',
    'onboarding.finish': 'Finish',
    'upload.selectFile': 'Select File',
    'upload.dragDrop': 'Drag and Drop',
    'upload.progress': 'Upload Progress',
    'upload.success': 'Upload Success',
    'upload.error': 'Upload Error',
    'upload.requirements': 'Requirements',
    'upload.validation': 'Validation',
    'upload.fileTypes': 'File Types',
    'upload.maxSize': 'Maximum Size',
    'payment.method': 'Payment Method',
    'payment.amount': 'Amount',
    'payment.confirm': 'Confirm Payment',
    'payment.processing': 'Processing',
    'payment.success': 'Payment Successful',
    'payment.failed': 'Payment Failed',
    'payment.receipt': 'Receipt',
    'payment.history': 'Payment History',
    'review.pending': 'Pending Review',
    'review.inProgress': 'Review in Progress',
    'review.approved': 'Approved',
    'review.rejected': 'Rejected',
    'review.comments': 'Comments',
    'review.resubmit': 'Resubmit',
    'menu.collapse': 'Collapse',
    'menu.expand': 'Expand',
    'menu.search': 'Search'
  },
  ro: {
    // Navigation
    'nav.dashboard': 'Panou de Control',
    'nav.clients': 'Clienți',
    'nav.workers': 'Lucrători',
    'nav.templates': 'Șabloane',
    'nav.analytics': 'Analize',
    'nav.settings': 'Setări',
    'nav.logout': 'Deconectare',
    'nav.features': 'Funcționalități',
    'nav.pricing': 'Prețuri',
    'nav.support': 'Suport',
    'nav.requirements': 'Cerințe',
    'nav.reminders': 'Memento-uri',
    'nav.auditLogs': 'Jurnale de Audit',
    'nav.deadlines': 'Termene',
    'nav.profile': 'Profil',
    
    // Landing page
    'landing.title': 'Managementul Imigrației Românești',
    'landing.subtitle': 'Eficientizați fluxurile de imigrare românești',
    'landing.description': 'Platformă SaaS completă pentru gestionarea permiselor de muncă, cererilor de viză și permiselor de ședere. De la testele pieței muncii AJOFM la aprobările finale IGI.',
    'landing.login': 'Autentificare',
    
    // Common elements
    'common.generating': 'Generare...',
    'common.welcome': 'Bun venit',
    'common.dashboard': 'Panou de Control',
    'common.clients': 'Clienți',
    'common.workers': 'Lucrători',
    'common.templates': 'Șabloane',
    'common.analytics': 'Analize',
    'common.profile': 'Profil',
    'common.documents': 'Documente',
    'common.deadlines': 'Termene',
    'common.logout': 'Deconectare',
    'common.view': 'Vizualizează',
    
    // Worker invitations
    'worker.invite': 'Invită Lucrător',
    'worker.inviteTitle': 'Invită Lucrătorul să Acceseze Profilul',
    'worker.generateInvite': 'Generează Link de Invitație',
    'worker.invitationLink': 'Link Invitație',
    'worker.linkDescription': 'Trimite acest link lucrătorului pentru a-i da acces la profilul său și zona de încărcare documente.',
    'worker.list': 'Lista Lucrătorilor',
    'worker.add': 'Adaugă Lucrător',
    'worker.status': 'Status Lucrător',
    'worker.documents': 'Documente Lucrător',
    'worker.progress': 'Progres',
    'worker.assignments': 'Atribuiri',
    'worker.dashboard': 'Panou Lucrător',
    'worker.myDocuments': 'Documentele Mele',
    'worker.uploadDocument': 'Încarcă Document',
    'worker.nextSteps': 'Pași Următori',
    'worker.urgentActions': 'Acțiuni Urgente Necesare',
    'worker.welcome': 'Bun venit',
    'worker.getStarted': 'Începe',
    'worker.uploadDocuments': 'Încarcă Documente',
    'worker.completed': 'Finalizat',
    'worker.notifications': 'Notificări',
    
    // Dashboard stats
    'dashboard.title': 'Panou de Control',
    'dashboard.totalClients': 'Total Clienți',
    'dashboard.activeWorkers': 'Lucrători Activi',
    'dashboard.pendingActions': 'Acțiuni în Așteptare',
    'dashboard.completedMonth': 'Completate Luna Aceasta',
    'dashboard.stats.totalClients': 'Total Clienți',
    'dashboard.stats.totalWorkers': 'Total Lucrători',
    'dashboard.stats.pendingActions': 'Acțiuni în Așteptare',
    'dashboard.stats.completed': 'Completate',
    'dashboard.stats.completedThisMonth': 'Completate Luna Aceasta',
    'dashboard.welcome': 'Bun venit',
    'dashboard.worker.title': 'Panou Lucrător',
    'dashboard.worker.subtitle': 'Urmărește procesul tău de imigrare',
    
    // Client management
    'client.list': 'Lista Clienților',
    'client.add': 'Adaugă Client',
    'client.edit': 'Editează Client',
    'client.delete': 'Șterge Client',
    'client.company': 'Companie',
    'client.contact': 'Contact',
    'client.dashboard': 'Panou Client',
    'client.workers': 'Lucrători Client',
    'client.addWorker': 'Adaugă Lucrător',
    'client.viewProgress': 'Vezi Progresul',
    'client.settings': 'Setări Client',
    'client.register': 'Înregistrează Client',
    'client.companyInfo': 'Informații Companie',
    'client.contactDetails': 'Detalii Contact',
    'client.verification': 'Verificare',
    'client.termsAccept': 'Acceptă Termenii',
    'client.submitRegistration': 'Trimite Înregistrarea',
    
    // Actions
    'action.save': 'Salvează',
    'action.cancel': 'Anulează',
    'action.edit': 'Editează',
    'action.delete': 'Șterge',
    'action.create': 'Creează',
    'action.view': 'Vizualizează',
    'action.close': 'Închide',
    'action.submit': 'Trimite',
    'action.search': 'Caută',
    'action.filter': 'Filtrează',
    'action.export': 'Exportă',
    'action.upload': 'Încarcă',
    'action.newClient': 'Client Nou',
    'actions.saveChanges': 'Salvează Modificările',
    'actions.editProfile': 'Editează Profilul',
    
    // Status labels
    'status.active': 'Activ',
    'status.inactive': 'Inactiv',
    'status.pending': 'În așteptare',
    'status.approved': 'Aprobat',
    'status.rejected': 'Respins',
    'status.in_progress': 'În desfășurare',
    'status.completed': 'Finalizat',
    'status.overdue': 'Întârziat',
    'status.draft': 'Ciornă',
    'status.view': 'Vezi Status',
    
    // Form labels
    'form.firstName': 'Prenume',
    'form.lastName': 'Nume',
    'form.email': 'Email',
    'form.phone': 'Telefon',
    'form.address': 'Adresă',
    'form.dateOfBirth': 'Data nașterii',
    'form.nationality': 'Naționalitate',
    'form.passport': 'Numărul pașaportului',
    'form.companyName': 'Numele companiei',
    'form.position': 'Poziție',
    'form.salary': 'Salariu',
    'form.startDate': 'Data de început',
    'form.endDate': 'Data de încheiere',
    'form.description': 'Descriere',
    'form.labels.email': 'Adresa de Email',
    'form.labels.phoneNumber': 'Număr de Telefon',
    'form.required': 'Obligatoriu',
    'form.optional': 'Opțional',
    'form.save': 'Salvează',
    'form.cancel': 'Anulează',
    'form.validation.required': 'Acest câmp este obligatoriu',
    'form.validation.email': 'Vă rugăm să introduceți un email valid',
    'form.validation.phone': 'Vă rugăm să introduceți un număr de telefon valid',
    
    // Table headers
    'table.headers.name': 'Nume',
    'table.headers.document': 'Document',
    'table.headers.stage': 'Etapa',
    'table.headers.status': 'Status',
    'table.headers.date': 'Dată',
    'table.headers.dueDate': 'Data Scadentă',
    'table.headers.actions': 'Acțiuni',
    'table.noData': 'Nu există date disponibile',
    'table.loading': 'Se încarcă...',
    'table.rowsPerPage': 'Rânduri per pagină',
    
    // Messages
    'message.success': 'Succes',
    'message.error': 'Eroare',
    'message.loading': 'Se încarcă...',
    'message.noData': 'Nu există date disponibile',
    'message.confirmDelete': 'Sigur doriți să ștergeți acest element?',
    
    // Templates
    'templates.title': 'Șabloane de Documente',
    'templates.description': 'Creează și gestionează șabloane pentru formularele de imigrare românești',
    'templates.createFirst': 'Creează Primul Șablon',
    'templates.noTemplates': 'Nu Există Șabloane Încă',
    'templates.createButton': 'Creează Șablon',
    'templates.create': 'Creează Șablon',
    'templates.edit': 'Editează Șablon',
    'templates.delete': 'Șterge Șablon',
    'template.builder': 'Constructor Șablon',
    'template.fields': 'Câmpuri Șablon',
    'template.preview': 'Previzualizare Șablon',
    
    // Analytics
    'analytics.title': 'Panou de Analize',
    'analytics.description': 'Analize și raportări complete pentru fluxurile de imigrare',
    'analytics.recentActivity': 'Activitate Recentă',
    'analytics.statusDistribution': 'Distribuția Status-ului Atribuirilor',
    'analytics.stageProgress': 'Progresul Etapelor',
    'analytics.monthlyTrend': 'Tendința Progresului Lunar',
    'analytics.clientPerformance': 'Performanța Clientului',
    'analytics.advanced': 'Analize Avansate',
    'analytics.charts': 'Diagrame',
    'analytics.reports': 'Rapoarte',
    'analytics.export': 'Exportă',
    'analytics.dateRange': 'Interval de Dată',
    'analytics.filters': 'Filtre',
    'analytics.performance': 'Performanță',
    
    // Profile
    'profile.title': 'Profil',
    'profile.personalInfo': 'Informații Personale',
    'profile.edit': 'Editează Profilul',
    'profile.settings': 'Setări Profil',
    'profile.changePassword': 'Schimbă Parola',
    'profile.notifications': 'Notificări',
    'profile.preferences': 'Preferințe',
    'profile.manageInfo': 'Gestionează informațiile contului tău',
    'profile.joined': 'Înregistrat',
    'profile.workPermitStatus': 'Starea Permisului de Muncă',
    'pages.profile.title': 'Profil',
    
    // Authentication
    'auth.login': 'Autentificare',
    'auth.logout': 'Deconectare',
    'auth.welcome': 'Bun venit',
    'auth.unauthorized': 'Neautorizat',
    'auth.sessionExpired': 'Sesiunea a Expirat',
    'auth.permissions': 'Permisiuni',
    
    // Admin features
    'admin.dashboard': 'Panou Admin',
    'admin.userManagement': 'Gestionarea Utilizatorilor',
    'admin.systemSettings': 'Setări Sistem',
    'admin.createUser': 'Creează Utilizator',
    'admin.deleteUser': 'Șterge Utilizator',
    'admin.permissions': 'Permisiuni',
    'system.maintenance': 'Mentenanță Sistem',
    'audit.logs': 'Jurnale de Audit',
    
    // Viewer features
    'viewer.dashboard': 'Panou Vizualizator',
    'viewer.readOnly': 'Doar Citire',
    'document.preview': 'Previzualizare Document',
    'progress.view': 'Vezi Progresul',
    'document.status': 'Status Document',
    'deadline.upcoming': 'Termene Aproape',
    
    // Modal dialogs
    'modal.confirm': 'Confirmă',
    'modal.cancel': 'Anulează',
    'modal.close': 'Închide',
    'modal.title': 'Modal',
    'modal.delete.title': 'Șterge Element',
    'modal.delete.message': 'Sigur doriți să ștergeți acest element?',
    'modal.save.title': 'Salvează Modificările',
    'modal.login.adminDesc': 'Acces administrativ pentru gestionarea utilizatorilor, setărilor și configurației sistemului.',
    'modal.login.ownerDesc': 'Acces complet pentru gestionarea clienților, lucrătorilor și operațiunilor de afaceri.',
    'modal.login.workerDesc': 'Spațiu de lucru personal pentru încărcarea documentelor și urmărirea progresului imigrării.',
    'modal.login.viewerDesc': 'Acces doar pentru citire pentru vizualizarea documentelor și informațiilor de progres.',
    'modal.login.invitationText': 'Lucrătorii pot accesa doar prin linkurile de invitație furnizate de proprietarii clienților.',
    'modal.login.supportText': 'Ai nevoie de ajutor?',
    'modal.login.supportLink': 'Contactează Suportul',
    
    // Notifications
    'notification.success': 'Succes',
    'notification.error': 'Eroare',
    'notification.warning': 'Avertisment',
    'notification.info': 'Informație',
    'notification.loading': 'Se încarcă',
    'notification.saved': 'Salvat',
    
    // User flows
    'onboarding.step1': 'Pasul 1',
    'onboarding.step2': 'Pasul 2',
    'onboarding.step3': 'Pasul 3',
    'onboarding.finish': 'Finalizează',
    'upload.selectFile': 'Selectează Fișier',
    'upload.dragDrop': 'Trage și Plasează',
    'upload.progress': 'Progres Încărcare',
    'upload.success': 'Încărcare Reușită',
    'upload.error': 'Eroare Încărcare',
    'upload.requirements': 'Cerințe',
    'upload.validation': 'Validare',
    'upload.fileTypes': 'Tipuri de Fișiere',
    'upload.maxSize': 'Dimensiune Maximă',
    'payment.method': 'Metodă de Plată',
    'payment.amount': 'Sumă',
    'payment.confirm': 'Confirmă Plata',
    'payment.processing': 'Se procesează',
    'payment.success': 'Plată Reușită',
    'payment.failed': 'Plată Eșuată',
    'payment.receipt': 'Chitanță',
    'payment.history': 'Istoric Plăți',
    'review.pending': 'În Așteptarea Revizuirii',
    'review.inProgress': 'Revizuire în Desfășurare',
    'review.approved': 'Aprobat',
    'review.rejected': 'Respins',
    'review.comments': 'Comentarii',
    'review.resubmit': 'Retrimite',
    'menu.collapse': 'Restrânge',
    'menu.expand': 'Extinde',
    'menu.search': 'Caută'
  },
  es: {
    // Navigation
    'nav.dashboard': 'Tablero',
    'nav.clients': 'Clientes',
    'nav.workers': 'Trabajadores',
    'nav.templates': 'Plantillas',
    'nav.analytics': 'Análisis',
    'nav.settings': 'Configuración',
    'nav.logout': 'Cerrar Sesión',
    'nav.features': 'Características',
    'nav.pricing': 'Precios',
    'nav.support': 'Soporte',
    'nav.requirements': 'Requisitos',
    'nav.reminders': 'Recordatorios',
    'nav.auditLogs': 'Registros de Auditoría',
    'nav.deadlines': 'Plazos',
    'nav.profile': 'Perfil',
    
    // Landing page
    'landing.title': 'Gestión de Inmigración Rumana',
    'landing.subtitle': 'Optimiza tus flujos de inmigración rumanos',
    'landing.description': 'Plataforma SaaS completa para gestionar permisos de trabajo, solicitudes de visa y permisos de residencia. Desde las pruebas del mercado laboral AJOFM hasta las aprobaciones finales IGI.',
    'landing.login': 'Iniciar Sesión',
    
    // Common elements
    'common.generating': 'Generando...',
    'common.welcome': 'Bienvenido',
    'common.dashboard': 'Tablero',
    'common.clients': 'Clientes',
    'common.workers': 'Trabajadores',
    'common.templates': 'Plantillas',
    'common.analytics': 'Análisis',
    'common.profile': 'Perfil',
    'common.documents': 'Documentos',
    'common.deadlines': 'Plazos',
    'common.logout': 'Cerrar Sesión',
    'common.view': 'Ver',
    
    // Worker invitations
    'worker.invite': 'Invitar Trabajador',
    'worker.inviteTitle': 'Invitar Trabajador a Acceder al Perfil',
    'worker.generateInvite': 'Generar Enlace de Invitación',
    'worker.invitationLink': 'Enlace de Invitación',
    'worker.linkDescription': 'Comparte este enlace con el trabajador para darle acceso a su perfil y área de carga de documentos.',
    'worker.list': 'Lista de Trabajadores',
    'worker.add': 'Agregar Trabajador',
    'worker.status': 'Estado del Trabajador',
    'worker.documents': 'Documentos del Trabajador',
    'worker.progress': 'Progreso',
    'worker.assignments': 'Asignaciones',
    'worker.dashboard': 'Panel de Trabajador',
    'worker.myDocuments': 'Mis Documentos',
    'worker.uploadDocument': 'Subir Documento',
    'worker.nextSteps': 'Próximos Pasos',
    'worker.urgentActions': 'Acciones Urgentes Requeridas',
    'worker.welcome': 'Bienvenido',
    'worker.getStarted': 'Empezar',
    'worker.uploadDocuments': 'Subir Documentos',
    'worker.completed': 'Completado',
    'worker.notifications': 'Notificaciones',
    
    // Dashboard stats
    'dashboard.title': 'Tablero',
    'dashboard.totalClients': 'Total Clientes',
    'dashboard.activeWorkers': 'Trabajadores Activos',
    'dashboard.pendingActions': 'Acciones Pendientes',
    'dashboard.completedMonth': 'Completadas Este Mes',
    'dashboard.stats.totalClients': 'Total Clientes',
    'dashboard.stats.totalWorkers': 'Total Trabajadores',
    'dashboard.stats.pendingActions': 'Acciones Pendientes',
    'dashboard.stats.completed': 'Completadas',
    'dashboard.stats.completedThisMonth': 'Completadas Este Mes',
    'dashboard.welcome': 'Bienvenido',
    'dashboard.worker.title': 'Panel de Trabajador',
    'dashboard.worker.subtitle': 'Sigue tu proceso de inmigración',
    
    // Client management
    'client.list': 'Lista de Clientes',
    'client.add': 'Agregar Cliente',
    'client.edit': 'Editar Cliente',
    'client.delete': 'Eliminar Cliente',
    'client.company': 'Empresa',
    'client.contact': 'Contacto',
    'client.dashboard': 'Panel de Cliente',
    'client.workers': 'Trabajadores del Cliente',
    'client.addWorker': 'Agregar Trabajador',
    'client.viewProgress': 'Ver Progreso',
    'client.settings': 'Configuración del Cliente',
    'client.register': 'Registrar Cliente',
    'client.companyInfo': 'Información de la Empresa',
    'client.contactDetails': 'Detalles de Contacto',
    'client.verification': 'Verificación',
    'client.termsAccept': 'Aceptar Términos',
    'client.submitRegistration': 'Enviar Registro',
    
    // Actions
    'action.save': 'Guardar',
    'action.cancel': 'Cancelar',
    'action.edit': 'Editar',
    'action.delete': 'Eliminar',
    'action.create': 'Crear',
    'action.view': 'Ver',
    'action.close': 'Cerrar',
    'action.submit': 'Enviar',
    'action.search': 'Buscar',
    'action.filter': 'Filtrar',
    'action.export': 'Exportar',
    'action.upload': 'Subir',
    'action.newClient': 'Nuevo Cliente',
    'actions.saveChanges': 'Guardar Cambios',
    'actions.editProfile': 'Editar Perfil',
    
    // Status labels
    'status.active': 'Activo',
    'status.inactive': 'Inactivo',
    'status.pending': 'Pendiente',
    'status.approved': 'Aprobado',
    'status.rejected': 'Rechazado',
    'status.in_progress': 'En Progreso',
    'status.completed': 'Completado',
    'status.overdue': 'Vencido',
    'status.draft': 'Borrador',
    'status.view': 'Ver Estado',
    
    // Form labels
    'form.firstName': 'Nombre',
    'form.lastName': 'Apellido',
    'form.email': 'Correo Electrónico',
    'form.phone': 'Teléfono',
    'form.address': 'Dirección',
    'form.dateOfBirth': 'Fecha de Nacimiento',
    'form.nationality': 'Nacionalidad',
    'form.passport': 'Número de Pasaporte',
    'form.companyName': 'Nombre de la Empresa',
    'form.position': 'Puesto',
    'form.salary': 'Salario',
    'form.startDate': 'Fecha de Inicio',
    'form.endDate': 'Fecha de Fin',
    'form.description': 'Descripción',
    'form.labels.email': 'Dirección de Correo',
    'form.labels.phoneNumber': 'Número de Teléfono',
    'form.required': 'Requerido',
    'form.optional': 'Opcional',
    'form.save': 'Guardar',
    'form.cancel': 'Cancelar',
    'form.validation.required': 'Este campo es obligatorio',
    'form.validation.email': 'Por favor ingresa un correo válido',
    'form.validation.phone': 'Por favor ingresa un número de teléfono válido',
    
    // Table headers
    'table.headers.name': 'Nombre',
    'table.headers.document': 'Documento',
    'table.headers.stage': 'Etapa',
    'table.headers.status': 'Estado',
    'table.headers.date': 'Fecha',
    'table.headers.dueDate': 'Fecha de Vencimiento',
    'table.headers.actions': 'Acciones',
    'table.noData': 'No hay datos disponibles',
    'table.loading': 'Cargando...',
    'table.rowsPerPage': 'Filas por página',
    
    // Messages
    'message.success': 'Éxito',
    'message.error': 'Error',
    'message.loading': 'Cargando...',
    'message.noData': 'No hay datos disponibles',
    'message.confirmDelete': '¿Estás seguro de que quieres eliminar este elemento?',
    
    // Templates
    'templates.title': 'Plantillas de Documentos',
    'templates.description': 'Crear y gestionar plantillas para formularios de inmigración rumanos',
    'templates.createFirst': 'Crear Primera Plantilla',
    'templates.noTemplates': 'No Hay Plantillas Aún',
    'templates.createButton': 'Crear Plantilla',
    'templates.create': 'Crear Plantilla',
    'templates.edit': 'Editar Plantilla',
    'templates.delete': 'Eliminar Plantilla',
    'template.builder': 'Constructor de Plantillas',
    'template.fields': 'Campos de Plantilla',
    'template.preview': 'Vista Previa de Plantilla',
    
    // Analytics
    'analytics.title': 'Panel de Análisis',
    'analytics.description': 'Análisis integral y reportes para flujos de inmigración',
    'analytics.recentActivity': 'Actividad Reciente',
    'analytics.statusDistribution': 'Distribución de Estado de Asignaciones',
    'analytics.stageProgress': 'Progreso de Etapas',
    'analytics.monthlyTrend': 'Tendencia Mensual de Progreso',
    'analytics.clientPerformance': 'Rendimiento del Cliente',
    'analytics.advanced': 'Análisis Avanzados',
    'analytics.charts': 'Gráficos',
    'analytics.reports': 'Informes',
    'analytics.export': 'Exportar',
    'analytics.dateRange': 'Rango de Fechas',
    'analytics.filters': 'Filtros',
    'analytics.performance': 'Rendimiento',
    
    // Profile
    'profile.title': 'Perfil',
    'profile.personalInfo': 'Información Personal',
    'profile.edit': 'Editar Perfil',
    'profile.settings': 'Configuración de Perfil',
    'profile.changePassword': 'Cambiar Contraseña',
    'profile.notifications': 'Notificaciones',
    'profile.preferences': 'Preferencias',
    'profile.manageInfo': 'Gestiona la información de tu cuenta',
    'profile.joined': 'Registrado',
    'profile.workPermitStatus': 'Estado del Permiso de Trabajo',
    'pages.profile.title': 'Perfil',
    
    // Authentication
    'auth.login': 'Iniciar Sesión',
    'auth.logout': 'Cerrar Sesión',
    'auth.welcome': 'Bienvenido',
    'auth.unauthorized': 'No Autorizado',
    'auth.sessionExpired': 'Sesión Expirada',
    'auth.permissions': 'Permisos',
    
    // Admin features
    'admin.dashboard': 'Panel de Administración',
    'admin.userManagement': 'Gestión de Usuarios',
    'admin.systemSettings': 'Configuración del Sistema',
    'admin.createUser': 'Crear Usuario',
    'admin.deleteUser': 'Eliminar Usuario',
    'admin.permissions': 'Permisos',
    'system.maintenance': 'Mantenimiento del Sistema',
    'audit.logs': 'Registros de Auditoría',
    
    // Viewer features
    'viewer.dashboard': 'Panel de Visor',
    'viewer.readOnly': 'Solo Lectura',
    'document.preview': 'Vista Previa de Documento',
    'progress.view': 'Ver Progreso',
    'document.status': 'Estado del Documento',
    'deadline.upcoming': 'Plazos Próximos',
    
    // Modal dialogs
    'modal.confirm': 'Confirmar',
    'modal.cancel': 'Cancelar',
    'modal.close': 'Cerrar',
    'modal.title': 'Modal',
    'modal.delete.title': 'Eliminar Elemento',
    'modal.delete.message': '¿Estás seguro de que quieres eliminar este elemento?',
    'modal.save.title': 'Guardar Cambios',
    'modal.login.adminDesc': 'Acceso administrativo para gestionar usuarios, configuraciones y configuración del sistema.',
    'modal.login.ownerDesc': 'Acceso completo para gestionar clientes, trabajadores y operaciones comerciales.',
    'modal.login.workerDesc': 'Espacio de trabajo personal para subir documentos y rastrear el progreso de inmigración.',
    'modal.login.viewerDesc': 'Acceso de solo lectura para ver documentos e información de progreso.',
    'modal.login.invitationText': 'Los trabajadores solo pueden acceder a través de enlaces de invitación proporcionados por los propietarios de clientes.',
    'modal.login.supportText': '¿Necesitas ayuda?',
    'modal.login.supportLink': 'Contactar Soporte',
    
    // Notifications
    'notification.success': 'Éxito',
    'notification.error': 'Error',
    'notification.warning': 'Advertencia',
    'notification.info': 'Información',
    'notification.loading': 'Cargando',
    'notification.saved': 'Guardado',
    
    // User flows
    'onboarding.step1': 'Paso 1',
    'onboarding.step2': 'Paso 2',
    'onboarding.step3': 'Paso 3',
    'onboarding.finish': 'Finalizar',
    'upload.selectFile': 'Seleccionar Archivo',
    'upload.dragDrop': 'Arrastrar y Soltar',
    'upload.progress': 'Progreso de Carga',
    'upload.success': 'Carga Exitosa',
    'upload.error': 'Error de Carga',
    'upload.requirements': 'Requisitos',
    'upload.validation': 'Validación',
    'upload.fileTypes': 'Tipos de Archivo',
    'upload.maxSize': 'Tamaño Máximo',
    'payment.method': 'Método de Pago',
    'payment.amount': 'Cantidad',
    'payment.confirm': 'Confirmar Pago',
    'payment.processing': 'Procesando',
    'payment.success': 'Pago Exitoso',
    'payment.failed': 'Pago Fallido',
    'payment.receipt': 'Recibo',
    'payment.history': 'Historial de Pagos',
    'review.pending': 'Revisión Pendiente',
    'review.inProgress': 'Revisión en Progreso',
    'review.approved': 'Aprobado',
    'review.rejected': 'Rechazado',
    'review.comments': 'Comentarios',
    'review.resubmit': 'Reenviar',
    'menu.collapse': 'Colapsar',
    'menu.expand': 'Expandir',
    'menu.search': 'Buscar'
  },
  fr: {
    // Navigation
    'nav.dashboard': 'Tableau de Bord',
    'nav.clients': 'Clients',
    'nav.workers': 'Travailleurs',
    'nav.templates': 'Modèles',
    'nav.analytics': 'Analyses',
    'nav.settings': 'Paramètres',
    'nav.logout': 'Déconnexion',
    'nav.features': 'Fonctionnalités',
    'nav.pricing': 'Tarifs',
    'nav.support': 'Support',
    'nav.requirements': 'Exigences',
    'nav.reminders': 'Rappels',
    'nav.auditLogs': 'Journaux d\'Audit',
    'nav.deadlines': 'Échéances',
    'nav.profile': 'Profil',
    
    // Landing page
    'landing.title': 'Gestion de l\'Immigration Roumaine',
    'landing.subtitle': 'Rationalisez vos flux d\'immigration roumains',
    'landing.description': 'Plateforme SaaS complète pour gérer les permis de travail, les demandes de visa et les permis de séjour. Des tests du marché du travail AJOFM aux approbations finales IGI.',
    'landing.login': 'Connexion',
    
    // Common elements
    'common.generating': 'Génération...',
    'common.welcome': 'Bienvenue',
    'common.dashboard': 'Tableau de Bord',
    'common.clients': 'Clients',
    'common.workers': 'Travailleurs',
    'common.templates': 'Modèles',
    'common.analytics': 'Analyses',
    'common.profile': 'Profil',
    'common.documents': 'Documents',
    'common.deadlines': 'Échéances',
    'common.logout': 'Déconnexion',
    'common.view': 'Voir',
    
    // Worker invitations
    'worker.invite': 'Inviter Travailleur',
    'worker.inviteTitle': 'Inviter le Travailleur à Accéder au Profil',
    'worker.generateInvite': 'Générer Lien d\'Invitation',
    'worker.invitationLink': 'Lien d\'Invitation',
    'worker.linkDescription': 'Partagez ce lien avec le travailleur pour lui donner accès à son profil et à la zone de téléchargement de documents.',
    'worker.list': 'Liste des Travailleurs',
    'worker.add': 'Ajouter Travailleur',
    'worker.status': 'Statut du Travailleur',
    'worker.documents': 'Documents du Travailleur',
    'worker.progress': 'Progrès',
    'worker.assignments': 'Affectations',
    'worker.dashboard': 'Tableau de Bord Travailleur',
    'worker.myDocuments': 'Mes Documents',
    'worker.uploadDocument': 'Télécharger Document',
    'worker.nextSteps': 'Prochaines Étapes',
    'worker.urgentActions': 'Actions Urgentes Requises',
    'worker.welcome': 'Bienvenue',
    'worker.getStarted': 'Commencer',
    'worker.uploadDocuments': 'Télécharger Documents',
    'worker.completed': 'Terminé',
    'worker.notifications': 'Notifications',
    
    // Dashboard stats
    'dashboard.title': 'Tableau de Bord',
    'dashboard.totalClients': 'Total Clients',
    'dashboard.activeWorkers': 'Travailleurs Actifs',
    'dashboard.pendingActions': 'Actions en Attente',
    'dashboard.completedMonth': 'Terminées ce Mois',
    'dashboard.stats.totalClients': 'Total Clients',
    'dashboard.stats.totalWorkers': 'Total Travailleurs',
    'dashboard.stats.pendingActions': 'Actions en Attente',
    'dashboard.stats.completed': 'Terminées',
    'dashboard.stats.completedThisMonth': 'Terminées ce Mois',
    'dashboard.welcome': 'Bienvenue',
    'dashboard.worker.title': 'Tableau de Bord Travailleur',
    'dashboard.worker.subtitle': 'Suivez votre processus d\'immigration',
    
    // Client management
    'client.list': 'Liste des Clients',
    'client.add': 'Ajouter Client',
    'client.edit': 'Modifier Client',
    'client.delete': 'Supprimer Client',
    'client.company': 'Entreprise',
    'client.contact': 'Contact',
    'client.dashboard': 'Tableau de Bord Client',
    'client.workers': 'Travailleurs Client',
    'client.addWorker': 'Ajouter Travailleur',
    'client.viewProgress': 'Voir Progrès',
    'client.settings': 'Paramètres Client',
    'client.register': 'Enregistrer Client',
    'client.companyInfo': 'Informations Entreprise',
    'client.contactDetails': 'Détails Contact',
    'client.verification': 'Vérification',
    'client.termsAccept': 'Accepter Conditions',
    'client.submitRegistration': 'Soumettre Inscription',
    
    // Actions
    'action.save': 'Enregistrer',
    'action.cancel': 'Annuler',
    'action.edit': 'Modifier',
    'action.delete': 'Supprimer',
    'action.create': 'Créer',
    'action.view': 'Voir',
    'action.close': 'Fermer',
    'action.submit': 'Soumettre',
    'action.search': 'Rechercher',
    'action.filter': 'Filtrer',
    'action.export': 'Exporter',
    'action.upload': 'Télécharger',
    'action.newClient': 'Nouveau Client',
    'actions.saveChanges': 'Enregistrer les Modifications',
    'actions.editProfile': 'Modifier le Profil',
    
    // Status labels
    'status.active': 'Actif',
    'status.inactive': 'Inactif',
    'status.pending': 'En Attente',
    'status.approved': 'Approuvé',
    'status.rejected': 'Rejeté',
    'status.in_progress': 'En Cours',
    'status.completed': 'Terminé',
    'status.overdue': 'En Retard',
    'status.draft': 'Brouillon',
    'status.view': 'Voir Statut',
    
    // Form labels
    'form.firstName': 'Prénom',
    'form.lastName': 'Nom',
    'form.email': 'Email',
    'form.phone': 'Téléphone',
    'form.address': 'Adresse',
    'form.dateOfBirth': 'Date de Naissance',
    'form.nationality': 'Nationalité',
    'form.passport': 'Numéro de Passeport',
    'form.companyName': 'Nom de l\'Entreprise',
    'form.position': 'Poste',
    'form.salary': 'Salaire',
    'form.startDate': 'Date de Début',
    'form.endDate': 'Date de Fin',
    'form.description': 'Description',
    'form.labels.email': 'Adresse Email',
    'form.labels.phoneNumber': 'Numéro de Téléphone',
    'form.required': 'Obligatoire',
    'form.optional': 'Optionnel',
    'form.save': 'Enregistrer',
    'form.cancel': 'Annuler',
    'form.validation.required': 'Ce champ est obligatoire',
    'form.validation.email': 'Veuillez entrer un email valide',
    'form.validation.phone': 'Veuillez entrer un numéro de téléphone valide',
    
    // Table headers
    'table.headers.name': 'Nom',
    'table.headers.document': 'Document',
    'table.headers.stage': 'Étape',
    'table.headers.status': 'Statut',
    'table.headers.date': 'Date',
    'table.headers.dueDate': 'Date d\'Échéance',
    'table.headers.actions': 'Actions',
    'table.noData': 'Aucune donnée disponible',
    'table.loading': 'Chargement...',
    'table.rowsPerPage': 'Lignes par page',
    
    // Messages
    'message.success': 'Succès',
    'message.error': 'Erreur',
    'message.loading': 'Chargement...',
    'message.noData': 'Aucune donnée disponible',
    'message.confirmDelete': 'Êtes-vous sûr de vouloir supprimer cet élément?',
    
    // Templates
    'templates.title': 'Modèles de Documents',
    'templates.description': 'Créer et gérer des modèles pour les formulaires d\'immigration roumains',
    'templates.createFirst': 'Créer Premier Modèle',
    'templates.noTemplates': 'Aucun Modèle Encore',
    'templates.createButton': 'Créer Modèle',
    'templates.create': 'Créer Modèle',
    'templates.edit': 'Modifier Modèle',
    'templates.delete': 'Supprimer Modèle',
    'template.builder': 'Constructeur de Modèles',
    'template.fields': 'Champs de Modèle',
    'template.preview': 'Aperçu de Modèle',
    
    // Analytics
    'analytics.title': 'Tableau de Bord d\'Analyses',
    'analytics.description': 'Analyses complètes et rapports pour les flux d\'immigration',
    'analytics.recentActivity': 'Activité Récente',
    'analytics.statusDistribution': 'Distribution du Statut des Affectations',
    'analytics.stageProgress': 'Progrès des Étapes',
    'analytics.monthlyTrend': 'Tendance Mensuelle du Progrès',
    'analytics.clientPerformance': 'Performance Client',
    'analytics.advanced': 'Analyses Avancées',
    'analytics.charts': 'Graphiques',
    'analytics.reports': 'Rapports',
    'analytics.export': 'Exporter',
    'analytics.dateRange': 'Plage de Dates',
    'analytics.filters': 'Filtres',
    'analytics.performance': 'Performance',
    
    // Profile
    'profile.title': 'Profil',
    'profile.personalInfo': 'Informations Personnelles',
    'profile.edit': 'Modifier Profil',
    'profile.settings': 'Paramètres de Profil',
    'profile.changePassword': 'Changer Mot de Passe',
    'profile.notifications': 'Notifications',
    'profile.preferences': 'Préférences',
    'profile.manageInfo': 'Gérer les informations de votre compte',
    'profile.joined': 'Inscrit',
    'profile.workPermitStatus': 'Statut du Permis de Travail',
    'pages.profile.title': 'Profil',
    
    // Authentication
    'auth.login': 'Connexion',
    'auth.logout': 'Déconnexion',
    'auth.welcome': 'Bienvenue',
    'auth.unauthorized': 'Non Autorisé',
    'auth.sessionExpired': 'Session Expirée',
    'auth.permissions': 'Permissions',
    
    // Admin features
    'admin.dashboard': 'Tableau de Bord Admin',
    'admin.userManagement': 'Gestion des Utilisateurs',
    'admin.systemSettings': 'Paramètres Système',
    'admin.createUser': 'Créer Utilisateur',
    'admin.deleteUser': 'Supprimer Utilisateur',
    'admin.permissions': 'Permissions',
    'system.maintenance': 'Maintenance Système',
    'audit.logs': 'Journaux d\'Audit',
    
    // Viewer features
    'viewer.dashboard': 'Tableau de Bord Visualiseur',
    'viewer.readOnly': 'Lecture Seule',
    'document.preview': 'Aperçu Document',
    'progress.view': 'Voir Progrès',
    'document.status': 'Statut Document',
    'deadline.upcoming': 'Échéances Prochaines',
    
    // Modal dialogs
    'modal.confirm': 'Confirmer',
    'modal.cancel': 'Annuler',
    'modal.close': 'Fermer',
    'modal.title': 'Modal',
    'modal.delete.title': 'Supprimer Élément',
    'modal.delete.message': 'Êtes-vous sûr de vouloir supprimer cet élément?',
    'modal.save.title': 'Enregistrer les Modifications',
    'modal.login.adminDesc': 'Accès administratif pour gérer les utilisateurs, paramètres et configuration système.',
    'modal.login.ownerDesc': 'Accès complet pour gérer les clients, travailleurs et opérations commerciales.',
    'modal.login.workerDesc': 'Espace de travail personnel pour télécharger des documents et suivre le progrès d\'immigration.',
    'modal.login.viewerDesc': 'Accès en lecture seule pour voir les documents et informations de progrès.',
    'modal.login.invitationText': 'Les travailleurs ne peuvent accéder que via les liens d\'invitation fournis par les propriétaires de clients.',
    'modal.login.supportText': 'Besoin d\'aide?',
    'modal.login.supportLink': 'Contacter le Support',
    
    // Notifications
    'notification.success': 'Succès',
    'notification.error': 'Erreur',
    'notification.warning': 'Avertissement',
    'notification.info': 'Information',
    'notification.loading': 'Chargement',
    'notification.saved': 'Enregistré',
    
    // User flows
    'onboarding.step1': 'Étape 1',
    'onboarding.step2': 'Étape 2',
    'onboarding.step3': 'Étape 3',
    'onboarding.finish': 'Terminer',
    'upload.selectFile': 'Sélectionner Fichier',
    'upload.dragDrop': 'Glisser-Déposer',
    'upload.progress': 'Progrès de Téléchargement',
    'upload.success': 'Téléchargement Réussi',
    'upload.error': 'Erreur de Téléchargement',
    'upload.requirements': 'Exigences',
    'upload.validation': 'Validation',
    'upload.fileTypes': 'Types de Fichiers',
    'upload.maxSize': 'Taille Maximale',
    'payment.method': 'Méthode de Paiement',
    'payment.amount': 'Montant',
    'payment.confirm': 'Confirmer Paiement',
    'payment.processing': 'Traitement',
    'payment.success': 'Paiement Réussi',
    'payment.failed': 'Paiement Échoué',
    'payment.receipt': 'Reçu',
    'payment.history': 'Historique des Paiements',
    'review.pending': 'Révision en Attente',
    'review.inProgress': 'Révision en Cours',
    'review.approved': 'Approuvé',
    'review.rejected': 'Rejeté',
    'review.comments': 'Commentaires',
    'review.resubmit': 'Resoumettre',
    'menu.collapse': 'Réduire',
    'menu.expand': 'Étendre',
    'menu.search': 'Rechercher'
  }
};

interface TranslationProviderProps {
  children: ReactNode;
}

export function TranslationProvider({ children }: TranslationProviderProps) {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'ro', name: 'Română' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' }
  ];

  useEffect(() => {
    loadTranslations();
  }, [currentLanguage]);

  const loadTranslations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/translations');
      const data: Translation[] = await response.json();
      
      const translationMap: Record<string, string> = {};
      
      data.forEach((translation) => {
        if (translation.language === currentLanguage) {
          translationMap[translation.key] = translation.value;
        }
      });
      
      setTranslations(translationMap);
    } catch (error) {
      console.error('Failed to load translations:', error);
      // Use fallback translations on error
      setTranslations(fallbackTranslations[currentLanguage as keyof typeof fallbackTranslations] || {});
    } finally {
      setLoading(false);
    }
  };

  const t = (key: string): string => {
    if (loading) return key;
    
    // First try database translations
    if (translations[key]) {
      return translations[key];
    }
    
    // Fallback to hardcoded translations
    const fallback = fallbackTranslations[currentLanguage as keyof typeof fallbackTranslations]?.[key];
    if (fallback) {
      return fallback;
    }
    
    // Final fallback to English
    if (currentLanguage !== 'en') {
      const englishFallback = fallbackTranslations.en[key];
      if (englishFallback) {
        return englishFallback;
      }
    }
    
    return key; // Return key if no translation found
  };

  const setLanguage = (language: string) => {
    setCurrentLanguage(language);
    localStorage.setItem('preferred-language', language);
  };

  const value: TranslationContextType = {
    currentLanguage,
    setLanguage,
    t,
    availableLanguages
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}