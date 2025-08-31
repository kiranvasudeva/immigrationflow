#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Add fetch polyfill for Node.js if needed
if (!global.fetch) {
  const { default: fetch } = await import('node-fetch');
  global.fetch = fetch;
}

const serverUrl = 'http://localhost:5000';

// Critical missing translations that need to be added to database
const missingTranslations = {
  // Navigation keys
  'nav.dashboard': {
    en: 'Dashboard',
    ro: 'Panou de Control',
    es: 'Tablero',
    fr: 'Tableau de Bord'
  },
  'nav.clients': {
    en: 'Clients',
    ro: 'Clienți',
    es: 'Clientes',
    fr: 'Clients'
  },
  'nav.workers': {
    en: 'Workers',
    ro: 'Lucrători',
    es: 'Trabajadores',
    fr: 'Travailleurs'
  },
  'nav.templates': {
    en: 'Templates',
    ro: 'Șabloane',
    es: 'Plantillas',
    fr: 'Modèles'
  },
  'nav.analytics': {
    en: 'Analytics',
    ro: 'Analize',
    es: 'Análisis',
    fr: 'Analyses'
  },
  'nav.requirements': {
    en: 'Requirements',
    ro: 'Cerințe',
    es: 'Requisitos',
    fr: 'Exigences'
  },
  'nav.reminders': {
    en: 'Reminders',
    ro: 'Memento',
    es: 'Recordatorios',
    fr: 'Rappels'
  },
  'nav.auditLogs': {
    en: 'Audit Logs',
    ro: 'Jurnale de Audit',
    es: 'Registros de Auditoría',
    fr: 'Journaux d\'Audit'
  },
  'nav.deadlines': {
    en: 'Deadlines',
    ro: 'Termene',
    es: 'Plazos',
    fr: 'Échéances'
  },
  'nav.profile': {
    en: 'Profile',
    ro: 'Profil',
    es: 'Perfil',
    fr: 'Profil'
  },
  'nav.settings': {
    en: 'Settings',
    ro: 'Setări',
    es: 'Configuración',
    fr: 'Paramètres'
  },
  'nav.logout': {
    en: 'Logout',
    ro: 'Deconectare',
    es: 'Cerrar Sesión',
    fr: 'Déconnexion'
  },

  // Common keys
  'common.welcome': {
    en: 'Welcome',
    ro: 'Bun venit',
    es: 'Bienvenido',
    fr: 'Bienvenue'
  },
  'common.dashboard': {
    en: 'Dashboard',
    ro: 'Panou de Control',
    es: 'Tablero',
    fr: 'Tableau de Bord'
  },
  'common.clients': {
    en: 'Clients',
    ro: 'Clienți',
    es: 'Clientes',
    fr: 'Clients'
  },
  'common.workers': {
    en: 'Workers',
    ro: 'Lucrători',
    es: 'Trabajadores',
    fr: 'Travailleurs'
  },
  'common.templates': {
    en: 'Templates',
    ro: 'Șabloane',
    es: 'Plantillas',
    fr: 'Modèles'
  },
  'common.analytics': {
    en: 'Analytics',
    ro: 'Analize',
    es: 'Análisis',
    fr: 'Analyses'
  },
  'common.profile': {
    en: 'Profile',
    ro: 'Profil',
    es: 'Perfil',
    fr: 'Profil'
  },
  'common.documents': {
    en: 'Documents',
    ro: 'Documente',
    es: 'Documentos',
    fr: 'Documents'
  },
  'common.deadlines': {
    en: 'Deadlines',
    ro: 'Termene',
    es: 'Plazos',
    fr: 'Échéances'
  },
  'common.logout': {
    en: 'Logout',
    ro: 'Deconectare',
    es: 'Cerrar Sesión',
    fr: 'Déconnexion'
  },
  'common.generating': {
    en: 'Generating...',
    ro: 'Se generează...',
    es: 'Generando...',
    fr: 'Génération...'
  },

  // Landing page
  'landing.title': {
    en: 'Romanian Immigration Management',
    ro: 'Managementul Imigrației Românești',
    es: 'Gestión de Inmigración Rumana',
    fr: 'Gestion de l\'Immigration Roumaine'
  },
  'landing.subtitle': {
    en: 'Streamline your Romanian immigration workflows',
    ro: 'Eficientizați fluxurile de imigrare românești',
    es: 'Optimiza tus flujos de inmigración rumanos',
    fr: 'Rationalisez vos flux d\'immigration roumains'
  },
  'landing.description': {
    en: 'Complete solution for managing work permits, visas, and residence permits',
    ro: 'Soluție completă pentru gestionarea permiselor de muncă, vizelor și permiselor de ședere',
    es: 'Solución completa para gestionar permisos de trabajo, visas y permisos de residencia',
    fr: 'Solution complète pour gérer les permis de travail, visas et permis de séjour'
  },
  'landing.login': {
    en: 'Login',
    ro: 'Autentificare',
    es: 'Iniciar Sesión',
    fr: 'Connexion'
  },

  // Navigation features
  'nav.features': {
    en: 'Features',
    ro: 'Funcționalități',
    es: 'Características',
    fr: 'Fonctionnalités'
  },
  'nav.pricing': {
    en: 'Pricing',
    ro: 'Prețuri',
    es: 'Precios',
    fr: 'Tarifs'
  },
  'nav.support': {
    en: 'Support',
    ro: 'Suport',
    es: 'Soporte',
    fr: 'Support'
  },

  // Worker invitation
  'worker.invite': {
    en: 'Invite Worker',
    ro: 'Invită Lucrător',
    es: 'Invitar Trabajador',
    fr: 'Inviter Travailleur'
  },
  'worker.inviteTitle': {
    en: 'Worker Invitation',
    ro: 'Invitație Lucrător',
    es: 'Invitación de Trabajador',
    fr: 'Invitation de Travailleur'
  },
  'worker.generateInvite': {
    en: 'Generate Invitation Link',
    ro: 'Generează Link de Invitație',
    es: 'Generar Enlace de Invitación',
    fr: 'Générer Lien d\'Invitation'
  },
  'worker.invitationLink': {
    en: 'Invitation Link',
    ro: 'Link Invitație',
    es: 'Enlace de Invitación',
    fr: 'Lien d\'Invitation'
  },
  'worker.linkDescription': {
    en: 'Share this link with workers to allow them to register',
    ro: 'Partajează acest link cu lucrătorii pentru a le permite să se înregistreze',
    es: 'Comparte este enlace con los trabajadores para permitirles registrarse',
    fr: 'Partagez ce lien avec les travailleurs pour leur permettre de s\'inscrire'
  },

  // Form fields
  'form.email': {
    en: 'Email',
    ro: 'Email',
    es: 'Correo Electrónico',
    fr: 'Email'
  },

  // Dashboard stats
  'dashboard.stats.totalWorkers': {
    en: 'Total Workers',
    ro: 'Total Lucrători',
    es: 'Total Trabajadores',
    fr: 'Total Travailleurs'
  },
  'dashboard.stats.pendingActions': {
    en: 'Pending Actions',
    ro: 'Acțiuni în Așteptare',
    es: 'Acciones Pendientes',
    fr: 'Actions en Attente'
  },
  'dashboard.stats.completed': {
    en: 'Completed',
    ro: 'Completate',
    es: 'Completadas',
    fr: 'Terminées'
  },
  'dashboard.stats.completedThisMonth': {
    en: 'Completed This Month',
    ro: 'Completate Luna Aceasta',
    es: 'Completadas Este Mes',
    fr: 'Terminées ce Mois'
  },

  // Actions
  'action.newClient': {
    en: 'New Client',
    ro: 'Client Nou',
    es: 'Nuevo Cliente',
    fr: 'Nouveau Client'
  },

  // Profile related
  'pages.profile.title': {
    en: 'Profile',
    ro: 'Profil',
    es: 'Perfil',
    fr: 'Profil'
  },
  'profile.manageInfo': {
    en: 'Manage your account information',
    ro: 'Gestionează informațiile contului tău',
    es: 'Gestiona la información de tu cuenta',
    fr: 'Gérer les informations de votre compte'
  },
  'actions.saveChanges': {
    en: 'Save Changes',
    ro: 'Salvează Modificările',
    es: 'Guardar Cambios',
    fr: 'Enregistrer les Modifications'
  },
  'actions.editProfile': {
    en: 'Edit Profile',
    ro: 'Editează Profilul',
    es: 'Editar Perfil',
    fr: 'Modifier le Profil'
  },
  'profile.joined': {
    en: 'Joined',
    ro: 'Înregistrat',
    es: 'Registrado',
    fr: 'Inscrit'
  },
  'profile.personalInfo': {
    en: 'Personal Information',
    ro: 'Informații Personale',
    es: 'Información Personal',
    fr: 'Informations Personnelles'
  },
  'form.labels.email': {
    en: 'Email Address',
    ro: 'Adresa de Email',
    es: 'Dirección de Correo',
    fr: 'Adresse Email'
  },
  'form.labels.phoneNumber': {
    en: 'Phone Number',
    ro: 'Număr de Telefon',
    es: 'Número de Teléfono',
    fr: 'Numéro de Téléphone'
  },
  'profile.workPermitStatus': {
    en: 'Work Permit Status',
    ro: 'Starea Permisului de Muncă',
    es: 'Estado del Permiso de Trabajo',
    fr: 'Statut du Permis de Travail'
  },

  // Worker dashboard
  'dashboard.worker.title': {
    en: 'Worker Dashboard',
    ro: 'Panou Lucrător',
    es: 'Panel de Trabajador',
    fr: 'Tableau de Bord Travailleur'
  },
  'dashboard.worker.subtitle': {
    en: 'Track your immigration process',
    ro: 'Urmărește procesul tău de imigrare',
    es: 'Sigue tu proceso de inmigración',
    fr: 'Suivez votre processus d\'immigration'
  },
  'worker.urgentActions': {
    en: 'Urgent Actions Required',
    ro: 'Acțiuni Urgente Necesare',
    es: 'Acciones Urgentes Requeridas',
    fr: 'Actions Urgentes Requises'
  },
  'status.overdue': {
    en: 'Overdue',
    ro: 'Întârziat',
    es: 'Vencido',
    fr: 'En Retard'
  },
  'action.uploadDocument': {
    en: 'Upload Document',
    ro: 'Încarcă Document',
    es: 'Subir Documento',
    fr: 'Télécharger Document'
  },
  'worker.nextSteps': {
    en: 'Next Steps',
    ro: 'Pași Următori',
    es: 'Próximos Pasos',
    fr: 'Prochaines Étapes'
  },
  'worker.myDocuments': {
    en: 'My Documents',
    ro: 'Documentele Mele',
    es: 'Mis Documentos',
    fr: 'Mes Documents'
  },

  // Table headers
  'table.headers.document': {
    en: 'Document',
    ro: 'Document',
    es: 'Documento',
    fr: 'Document'
  },
  'table.headers.stage': {
    en: 'Stage',
    ro: 'Etapa',
    es: 'Etapa',
    fr: 'Étape'
  },
  'table.headers.status': {
    en: 'Status',
    ro: 'Status',
    es: 'Estado',
    fr: 'Statut'
  },
  'table.headers.dueDate': {
    en: 'Due Date',
    ro: 'Data Scadentă',
    es: 'Fecha de Vencimiento',
    fr: 'Date d\'Échéance'
  },
  'table.headers.actions': {
    en: 'Actions',
    ro: 'Acțiuni',
    es: 'Acciones',
    fr: 'Actions'
  }
};

async function addTranslations() {
  console.log('🔧 Starting translation database fix...');
  
  let addedCount = 0;
  let errorCount = 0;
  
  for (const [key, translations] of Object.entries(missingTranslations)) {
    for (const [language, value] of Object.entries(translations)) {
      try {
        const response = await fetch(`${serverUrl}/api/translations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key,
            language,
            value
          })
        });
        
        if (response.ok) {
          addedCount++;
          console.log(`✅ Added: ${key} (${language}) = "${value}"`);
        } else {
          const errorData = await response.text();
          console.log(`⚠️  Skipped: ${key} (${language}) - ${response.status}: ${errorData}`);
        }
      } catch (error) {
        errorCount++;
        console.log(`❌ Error adding ${key} (${language}): ${error.message}`);
      }
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`✅ Successfully added: ${addedCount} translations`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📈 Total keys processed: ${Object.keys(missingTranslations).length} keys × 4 languages = ${Object.keys(missingTranslations).length * 4} entries`);
}

// Main execution
await addTranslations();
console.log('\n🎉 Translation fix complete! Run test_translations again to verify improvements.');