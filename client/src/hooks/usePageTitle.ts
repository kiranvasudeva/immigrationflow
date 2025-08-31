import { useEffect } from 'react';
import { useTranslation } from '@/contexts/I18nProvider';
import { useLocation } from 'wouter';

/**
 * Custom hook for managing dynamic page titles with internationalization support
 * 
 * This hook automatically sets the document title based on the current route
 * and provides a method to set custom titles. All titles are properly translated
 * and include the application name as a suffix.
 */
export function usePageTitle(pageKey?: string, customTitle?: string) {
  const { t } = useTranslation();
  const [location] = useLocation();

  useEffect(() => {
    let title = 'ImmigrationFlow';
    
    try {
      if (customTitle) {
        // Use custom title if provided
        title = `${customTitle} - ImmigrationFlow`;
      } else if (pageKey) {
        // Use translation key if provided
        const translatedTitle = t(pageKey);
        title = `${translatedTitle} - ImmigrationFlow`;
      } else {
        // Auto-detect title based on current route
        const routeTitleMap: Record<string, string> = {
          '/': 'dashboard.title',
          '/clients': 'nav.clients',
          '/workers': 'nav.workers', 
          '/assignments': 'nav.requirements',
          '/workflow': 'nav.requirements',
          '/documents': 'nav.documents',
          '/templates': 'nav.templates',
          '/analytics': 'nav.analytics',
          '/deadlines': 'nav.deadlines',
          '/audit': 'nav.audit',
          '/settings': 'nav.settings',
          '/profile': 'nav.profile',
          '/requirements': 'nav.requirements',
          '/reminders': 'nav.reminders',
          '/payments': 'nav.payments'
        };

        const titleKey = routeTitleMap[location] || 'landing.title';
        const translatedTitle = t(titleKey);
        
        // Only append "- ImmigrationFlow" if translation is different from key
        if (translatedTitle && translatedTitle !== titleKey) {
          title = `${translatedTitle} - ImmigrationFlow`;
        } else {
          // Fallback to route-based title
          const routeName = location === '/' ? 'Dashboard' : 
                           location.slice(1).charAt(0).toUpperCase() + location.slice(2);
          title = `${routeName} - ImmigrationFlow`;
        }
      }

      // Set the document title
      document.title = title;

    } catch (error) {
      console.error('Error setting page title:', error);
      // Fallback to basic title
      document.title = 'ImmigrationFlow - Romanian Immigration Workflow Management';
    }
  }, [t, location, pageKey, customTitle]);

  // Return a function to set custom titles programmatically
  const setTitle = (newTitle: string) => {
    try {
      document.title = `${newTitle} - ImmigrationFlow`;
    } catch (error) {
      console.error('Error setting custom title:', error);
    }
  };

  return { setTitle };
}

/**
 * Hook for setting a one-time page title
 * Useful for pages that don't need dynamic title updates
 */
export function useStaticPageTitle(titleKey: string, fallbackTitle?: string) {
  const { t } = useTranslation();

  useEffect(() => {
    try {
      const translatedTitle = t(titleKey);
      const title = translatedTitle && translatedTitle !== titleKey 
        ? translatedTitle 
        : fallbackTitle || titleKey;
      
      document.title = `${title} - ImmigrationFlow`;
    } catch (error) {
      console.error('Error setting static page title:', error);
      if (fallbackTitle) {
        document.title = `${fallbackTitle} - ImmigrationFlow`;
      }
    }
  }, [t, titleKey, fallbackTitle]);
}