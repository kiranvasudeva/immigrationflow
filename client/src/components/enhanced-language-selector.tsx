import { LanguageSelector } from '@/components/LanguageSelector';
import { useRoleBasedLanguage } from '@/hooks/useRoleBasedLanguage';
import { useTranslation } from '@/contexts/LanguageContext';

interface EnhancedLanguageSelectorProps {
  variant?: 'select' | 'button';
  className?: string;
}

export function EnhancedLanguageSelector({ variant = 'select', className }: EnhancedLanguageSelectorProps) {
  const { setLanguageManually } = useRoleBasedLanguage();
  const { currentLanguage } = useTranslation();

  const handleLanguageChange = (newLanguage: string) => {
    setLanguageManually(newLanguage);
  };

  return (
    <LanguageSelector 
      variant={variant} 
      className={className}
    />
  );
}