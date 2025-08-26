import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/contexts/LanguageContext';

export function useRoleBasedLanguage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { currentLanguage, setLanguage } = useTranslation();

  useEffect(() => {
    if (isAuthLoading || !user) return;

    // Check if language has already been manually set by user
    const savedLanguage = localStorage.getItem('immigration-app-language');
    const manuallySet = localStorage.getItem('immigration-app-language-manually-set');
    
    // If user hasn't manually set language, set default based on role
    if (!manuallySet && !savedLanguage) {
      let defaultLanguage: 'ro' | 'en' = 'en';
      
      if (user.role === 'ADMIN' || user.role === 'OWNER') {
        defaultLanguage = 'ro'; // Romanian for admins and owners
      } else if (user.role === 'WORKER' || user.role === 'VIEWER') {
        defaultLanguage = 'en'; // English for workers and viewers
      }
      
      if (currentLanguage !== defaultLanguage) {
        setLanguage(defaultLanguage);
      }
    }
  }, [user, isAuthLoading, currentLanguage, setLanguage]);

  const setLanguageManually = (lang: string) => {
    setLanguage(lang as any);
    localStorage.setItem('immigration-app-language-manually-set', 'true');
  };

  return { setLanguageManually };
}