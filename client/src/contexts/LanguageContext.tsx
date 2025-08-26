import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

type Language = 'en' | 'ro' | 'es' | 'fr';
type Translations = Record<string, string>;

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const SUPPORTED_LANGUAGES = {
  en: 'English',
  ro: 'Română',
  es: 'Español',
  fr: 'Français'
};

const FALLBACK_TRANSLATIONS: Record<string, Translations> = {
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
    'landing.title': 'Streamline Romanian',
    'landing.subtitle': 'Immigration Workflows',
    'landing.description': 'Complete SaaS platform for managing work permits, visa applications, and residence permits. From AJOFM labor market tests to final IGI approvals.',
    'landing.login': 'Login',
    
    // Worker invitations
    'worker.invite': 'Invite Worker',
    'worker.inviteTitle': 'Invite Worker to Access Profile',
    'worker.generateInvite': 'Generate Invitation Link',
    'worker.invitationLink': 'Invitation Link',
    'worker.linkDescription': 'Share this link with the worker to give them access to their profile and document upload area.',
    
    // Common
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

    // Landing page
    'landing.title': 'Romanian Immigration Management',
    'landing.subtitle': 'Streamline your Romanian immigration workflows',
    'landing.description': 'Complete solution for managing work permits, visas, and residence permits',
    'landing.login': 'Login',

    // Navigation features
    'nav.features': 'Features',
    'nav.pricing': 'Pricing',
    'nav.support': 'Support',

    // Worker invitation
    'worker.invite': 'Invite Worker',
    'worker.inviteTitle': 'Worker Invitation',
    'worker.generateInvite': 'Generate Invitation Link',
    'worker.invitationLink': 'Invitation Link',

    // Dashboard stats
    'dashboard.stats.totalWorkers': 'Total Workers',
    'dashboard.stats.pendingActions': 'Pending Actions',
    'dashboard.stats.completed': 'Completed',
    'dashboard.stats.completedThisMonth': 'Completed This Month',

    // Actions
    'action.newClient': 'New Client',

    // Profile related
    'pages.profile.title': 'Profile',
    'profile.manageInfo': 'Manage your account information',
    'actions.saveChanges': 'Save Changes',
    'actions.editProfile': 'Edit Profile',
    'profile.joined': 'Joined',
    'profile.personalInfo': 'Personal Information',
    'form.labels.email': 'Email Address',
    'form.labels.phoneNumber': 'Phone Number',
    'profile.workPermitStatus': 'Work Permit Status',

    // Worker dashboard
    'dashboard.worker.title': 'Worker Dashboard',
    'dashboard.worker.subtitle': 'Track your immigration process',
    'worker.urgentActions': 'Urgent Actions Required',
    'status.overdue': 'Overdue',
    'action.uploadDocument': 'Upload Document',
    'worker.nextSteps': 'Next Steps',
    'worker.myDocuments': 'My Documents',

    // Table headers
    'table.headers.document': 'Document',
    'table.headers.stage': 'Stage',
    'table.headers.status': 'Status',
    'table.headers.dueDate': 'Due Date',
    'table.headers.actions': 'Actions',
    
    // Common actions
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
    
    // Status labels
    'status.active': 'Active',
    'status.inactive': 'Inactive',
    'status.pending': 'Pending',
    'status.approved': 'Approved',
    'status.rejected': 'Rejected',
    'status.in_progress': 'In Progress',
    'status.completed': 'Completed',
    
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
    
    // Messages
    'message.success': 'Success',
    'message.error': 'Error',
    'message.loading': 'Loading...',
    'message.noData': 'No data available',
    'message.confirmDelete': 'Are you sure you want to delete this item?',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.totalClients': 'Total Clients',
    'dashboard.activeWorkers': 'Active Workers',
    'dashboard.pendingActions': 'Pending Actions',
    'dashboard.completedMonth': 'Completed This Month',
    
    // Templates
    'templates.title': 'Document Templates',
    'templates.description': 'Create and manage document templates for Romanian immigration forms',
    'templates.createFirst': 'Create First Template',
    'templates.noTemplates': 'No Templates Yet',
    'templates.createButton': 'Create Template',
    
    // Analytics
    'analytics.title': 'Analytics Dashboard',
    'analytics.description': 'Comprehensive analytics and reporting for immigration workflows',
    'analytics.recentActivity': 'Recent Activity',
    'analytics.statusDistribution': 'Assignment Status Distribution',
    'analytics.stageProgress': 'Stage Progress',
    'analytics.monthlyTrend': 'Monthly Progress Trend',
    'analytics.clientPerformance': 'Client Performance',
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
    'nav.features': 'Caracteristici',
    'nav.pricing': 'Prețuri',
    'nav.support': 'Suport',
    'nav.requirements': 'Cerințe',
    'nav.reminders': 'Memento',
    'nav.auditLogs': 'Jurnale de Audit',
    'nav.deadlines': 'Termene Limită',
    'nav.profile': 'Profil',
    
    // Landing page
    'landing.title': 'Optimizează procesele de',
    'landing.subtitle': 'Imigrație Românească',
    'landing.description': 'Platformă SaaS completă pentru gestionarea autorizațiilor de muncă, vizelor și permiselor de ședere. De la testele AJOFM la aprobările finale IGI.',
    'landing.login': 'Autentificare',
    
    // Worker invitations
    'worker.invite': 'Invită Lucrătorul',
    'worker.inviteTitle': 'Invită Lucrătorul să acceseze Profilul',
    'worker.generateInvite': 'Generează Link de Invitație',
    'worker.invitationLink': 'Link de Invitație',
    'worker.linkDescription': 'Trimite acest link lucrătorului pentru a-i da acces la profilul său și zona de încărcare documente.',
    
    // Common
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

    // Landing page
    'landing.title': 'Managementul Imigrației Românești',
    'landing.subtitle': 'Eficientizați fluxurile de imigrare românești',
    'landing.description': 'Soluție completă pentru gestionarea permiselor de muncă, vizelor și permiselor de ședere',
    'landing.login': 'Autentificare',

    // Navigation features
    'nav.features': 'Funcționalități',
    'nav.pricing': 'Prețuri',
    'nav.support': 'Suport',

    // Worker invitation
    'worker.invite': 'Invită Lucrător',
    'worker.inviteTitle': 'Invitație Lucrător',
    'worker.generateInvite': 'Generează Link de Invitație',
    'worker.invitationLink': 'Link Invitație',

    // Dashboard stats
    'dashboard.stats.totalWorkers': 'Total Lucrători',
    'dashboard.stats.pendingActions': 'Acțiuni în Așteptare',
    'dashboard.stats.completed': 'Completate',
    'dashboard.stats.completedThisMonth': 'Completate Luna Aceasta',

    // Actions
    'action.newClient': 'Client Nou',

    // Profile related
    'pages.profile.title': 'Profil',
    'profile.manageInfo': 'Gestionează informațiile contului tău',
    'actions.saveChanges': 'Salvează Modificările',
    'actions.editProfile': 'Editează Profilul',
    'profile.joined': 'Înregistrat',
    'profile.personalInfo': 'Informații Personale',
    'form.labels.email': 'Adresa de Email',
    'form.labels.phoneNumber': 'Număr de Telefon',
    'profile.workPermitStatus': 'Starea Permisului de Muncă',

    // Worker dashboard
    'dashboard.worker.title': 'Panou Lucrător',
    'dashboard.worker.subtitle': 'Urmărește procesul tău de imigrare',
    'worker.urgentActions': 'Acțiuni Urgente Necesare',
    'status.overdue': 'Întârziat',
    'action.uploadDocument': 'Încarcă Document',
    'worker.nextSteps': 'Pași Următori',
    'worker.myDocuments': 'Documentele Mele',

    // Table headers
    'table.headers.document': 'Document',
    'table.headers.stage': 'Etapa',
    'table.headers.status': 'Status',
    'table.headers.dueDate': 'Data Scadentă',
    'table.headers.actions': 'Acțiuni',
    
    // Common actions
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
    
    // Status labels
    'status.active': 'Activ',
    'status.inactive': 'Inactiv',
    'status.pending': 'În așteptare',
    'status.approved': 'Aprobat',
    'status.rejected': 'Respins',
    'status.in_progress': 'În desfășurare',
    'status.completed': 'Finalizat',
    
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
    
    // Messages
    'message.success': 'Succes',
    'message.error': 'Eroare',
    'message.loading': 'Se încarcă...',
    'message.noData': 'Nu există date disponibile',
    'message.confirmDelete': 'Sigur doriți să ștergeți acest element?',
    
    // Dashboard
    'dashboard.title': 'Panou de Control',
    'dashboard.totalClients': 'Total Clienți',
    'dashboard.activeWorkers': 'Lucrători Activi',
    'dashboard.pendingActions': 'Acțiuni în Așteptare',
    'dashboard.completedMonth': 'Finalizate Luna Aceasta',
    
    // Templates
    'templates.title': 'Șabloane Documente',
    'templates.description': 'Creați și gestionați șabloane pentru formularele de imigrare românești',
    'templates.createFirst': 'Creați primul șablon',
    'templates.noTemplates': 'Nu există șabloane încă',
    'templates.createButton': 'Creează Șablon',
    
    // Analytics
    'analytics.title': 'Panou Analize',
    'analytics.description': 'Analize și raportare comprehensivă pentru fluxurile de imigrare',
    'analytics.recentActivity': 'Activitate Recentă',
    'analytics.statusDistribution': 'Distribuția Statutului Atribuirilor',
    'analytics.stageProgress': 'Progresul Etapelor',
    'analytics.monthlyTrend': 'Tendința Lunară de Progres',
    'analytics.clientPerformance': 'Performanța Clienților',
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
    'nav.requirements': 'Requisitos',
    'nav.reminders': 'Recordatorios',
    'nav.auditLogs': 'Registros de Auditoría',
    'nav.deadlines': 'Plazos',
    'nav.profile': 'Perfil',
    
    // Common actions
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
    
    // Status labels
    'status.active': 'Activo',
    'status.inactive': 'Inactivo',
    'status.pending': 'Pendiente',
    'status.approved': 'Aprobado',
    'status.rejected': 'Rechazado',
    'status.in_progress': 'En Progreso',
    'status.completed': 'Completado',
    
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
    
    // Messages
    'message.success': 'Éxito',
    'message.error': 'Error',
    'message.loading': 'Cargando...',
    
    // Common
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

    // Landing page
    'landing.title': 'Gestión de Inmigración Rumana',
    'landing.subtitle': 'Optimiza tus flujos de inmigración rumanos',
    'landing.description': 'Solución completa para gestionar permisos de trabajo, visas y permisos de residencia',
    'landing.login': 'Iniciar Sesión',

    // Navigation features
    'nav.features': 'Características',
    'nav.pricing': 'Precios',
    'nav.support': 'Soporte',

    // Worker invitation
    'worker.invite': 'Invitar Trabajador',
    'worker.inviteTitle': 'Invitación de Trabajador',
    'worker.generateInvite': 'Generar Enlace de Invitación',
    'worker.invitationLink': 'Enlace de Invitación',

    // Dashboard stats
    'dashboard.stats.totalWorkers': 'Total Trabajadores',
    'dashboard.stats.pendingActions': 'Acciones Pendientes',
    'dashboard.stats.completed': 'Completadas',
    'dashboard.stats.completedThisMonth': 'Completadas Este Mes',

    // Actions
    'action.newClient': 'Nuevo Cliente',

    // Profile related
    'pages.profile.title': 'Perfil',
    'profile.manageInfo': 'Gestiona la información de tu cuenta',
    'actions.saveChanges': 'Guardar Cambios',
    'actions.editProfile': 'Editar Perfil',
    'profile.joined': 'Registrado',
    'profile.personalInfo': 'Información Personal',
    'form.labels.email': 'Dirección de Correo',
    'form.labels.phoneNumber': 'Número de Teléfono',
    'profile.workPermitStatus': 'Estado del Permiso de Trabajo',

    // Worker dashboard
    'dashboard.worker.title': 'Panel de Trabajador',
    'dashboard.worker.subtitle': 'Sigue tu proceso de inmigración',
    'worker.urgentActions': 'Acciones Urgentes Requeridas',
    'status.overdue': 'Vencido',
    'action.uploadDocument': 'Subir Documento',
    'worker.nextSteps': 'Próximos Pasos',
    'worker.myDocuments': 'Mis Documentos',

    // Table headers
    'table.headers.document': 'Documento',
    'table.headers.stage': 'Etapa',
    'table.headers.status': 'Estado',
    'table.headers.dueDate': 'Fecha de Vencimiento',
    'table.headers.actions': 'Acciones',
    'message.noData': 'No hay datos disponibles',
    'message.confirmDelete': '¿Estás seguro de que quieres eliminar este elemento?',
    
    // Dashboard
    'dashboard.title': 'Tablero',
    'dashboard.totalClients': 'Total Clientes',
    'dashboard.activeWorkers': 'Trabajadores Activos',
    'dashboard.pendingActions': 'Acciones Pendientes',
    'dashboard.completedMonth': 'Completados Este Mes',
    
    // Templates
    'templates.title': 'Plantillas de Documentos',
    'templates.description': 'Crear y gestionar plantillas para formularios de inmigración rumanos',
    'templates.createFirst': 'Crear Primera Plantilla',
    'templates.noTemplates': 'No Hay Plantillas Aún',
    'templates.createButton': 'Crear Plantilla',
    
    // Analytics
    'analytics.title': 'Panel de Análisis',
    'analytics.description': 'Análisis integral y reportes para flujos de inmigración',
    'analytics.recentActivity': 'Actividad Reciente',
    'analytics.statusDistribution': 'Distribución de Estado de Asignaciones',
    'analytics.stageProgress': 'Progreso de Etapas',
    'analytics.monthlyTrend': 'Tendencia Mensual de Progreso',
    'analytics.clientPerformance': 'Rendimiento del Cliente',
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
    'nav.requirements': 'Exigences',
    'nav.reminders': 'Rappels',
    'nav.auditLogs': 'Journaux d\'Audit',
    'nav.deadlines': 'Échéances',
    'nav.profile': 'Profil',
    
    // Common actions
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
    
    // Status labels
    'status.active': 'Actif',
    'status.inactive': 'Inactif',
    'status.pending': 'En Attente',
    'status.approved': 'Approuvé',
    'status.rejected': 'Rejeté',
    'status.in_progress': 'En Cours',
    'status.completed': 'Terminé',
    
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
    
    // Messages
    'message.success': 'Succès',
    'message.error': 'Erreur',
    'message.loading': 'Chargement...',
    
    // Common
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

    // Landing page
    'landing.title': 'Gestion de l\'Immigration Roumaine',
    'landing.subtitle': 'Rationalisez vos flux d\'immigration roumains',
    'landing.description': 'Solution complète pour gérer les permis de travail, visas et permis de séjour',
    'landing.login': 'Connexion',

    // Navigation features
    'nav.features': 'Fonctionnalités',
    'nav.pricing': 'Tarifs',
    'nav.support': 'Support',

    // Worker invitation
    'worker.invite': 'Inviter Travailleur',
    'worker.inviteTitle': 'Invitation de Travailleur',
    'worker.generateInvite': 'Générer Lien d\'Invitation',
    'worker.invitationLink': 'Lien d\'Invitation',

    // Dashboard stats
    'dashboard.stats.totalWorkers': 'Total Travailleurs',
    'dashboard.stats.pendingActions': 'Actions en Attente',
    'dashboard.stats.completed': 'Terminées',
    'dashboard.stats.completedThisMonth': 'Terminées ce Mois',

    // Actions
    'action.newClient': 'Nouveau Client',

    // Profile related
    'pages.profile.title': 'Profil',
    'profile.manageInfo': 'Gérer les informations de votre compte',
    'actions.saveChanges': 'Enregistrer les Modifications',
    'actions.editProfile': 'Modifier le Profil',
    'profile.joined': 'Inscrit',
    'profile.personalInfo': 'Informations Personnelles',
    'form.labels.email': 'Adresse Email',
    'form.labels.phoneNumber': 'Numéro de Téléphone',
    'profile.workPermitStatus': 'Statut du Permis de Travail',

    // Worker dashboard
    'dashboard.worker.title': 'Tableau de Bord Travailleur',
    'dashboard.worker.subtitle': 'Suivez votre processus d\'immigration',
    'worker.urgentActions': 'Actions Urgentes Requises',
    'status.overdue': 'En Retard',
    'action.uploadDocument': 'Télécharger Document',
    'worker.nextSteps': 'Prochaines Étapes',
    'worker.myDocuments': 'Mes Documents',

    // Table headers
    'table.headers.document': 'Document',
    'table.headers.stage': 'Étape',
    'table.headers.status': 'Statut',
    'table.headers.dueDate': 'Date d\'Échéance',
    'table.headers.actions': 'Actions',
    'message.noData': 'Aucune donnée disponible',
    'message.confirmDelete': 'Êtes-vous sûr de vouloir supprimer cet élément?',
    
    // Dashboard
    'dashboard.title': 'Tableau de Bord',
    'dashboard.totalClients': 'Total Clients',
    'dashboard.activeWorkers': 'Travailleurs Actifs',
    'dashboard.pendingActions': 'Actions en Attente',
    'dashboard.completedMonth': 'Terminés ce Mois',
    
    // Templates
    'templates.title': 'Modèles de Documents',
    'templates.description': 'Créer et gérer des modèles pour les formulaires d\'immigration roumains',
    'templates.createFirst': 'Créer le Premier Modèle',
    'templates.noTemplates': 'Aucun Modèle Pour l\'Instant',
    'templates.createButton': 'Créer un Modèle',
    
    // Analytics
    'analytics.title': 'Tableau de Bord d\'Analyses',
    'analytics.description': 'Analyses complètes et rapports pour les flux d\'immigration',
    'analytics.recentActivity': 'Activité Récente',
    'analytics.statusDistribution': 'Distribution du Statut des Affectations',
    'analytics.stageProgress': 'Progrès des Étapes',
    'analytics.monthlyTrend': 'Tendance Mensuelle des Progrès',
    'analytics.clientPerformance': 'Performance du Client',
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('immigration-app-language');
    return (saved as Language) || 'en';
  });

  const { data: translations = {}, isLoading } = useQuery({
    queryKey: ['/api/translations', currentLanguage],
    queryFn: async () => {
      const response = await fetch(`/api/translations?language=${currentLanguage}`);
      const translationArray = await response.json();
      
      // Convert array format to key-value object format
      const translationObject: Record<string, string> = {};
      translationArray.forEach((translation: any) => {
        translationObject[translation.key] = translation.value;
      });
      
      return translationObject;
    },
    enabled: true,
  });

  const setLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
    localStorage.setItem('immigration-app-language', lang);
  };

  const t = (key: string): string => {
    // First try to get from API translations
    const apiTranslations = translations as Record<string, string>;
    if (apiTranslations[key]) {
      return apiTranslations[key];
    }

    // Fall back to hardcoded translations
    if (FALLBACK_TRANSLATIONS[currentLanguage]?.[key]) {
      return FALLBACK_TRANSLATIONS[currentLanguage][key];
    }

    // Fall back to English if available
    if (currentLanguage !== 'en' && FALLBACK_TRANSLATIONS.en[key]) {
      return FALLBACK_TRANSLATIONS.en[key];
    }

    // Return the key if no translation found
    return key;
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, t, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LANGUAGES = SUPPORTED_LANGUAGES;