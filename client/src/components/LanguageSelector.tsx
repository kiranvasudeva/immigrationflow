import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useTranslation } from '@/contexts/I18nProvider';

interface LanguageSelectorProps {
  variant?: 'select' | 'button';
  className?: string;
}

export function LanguageSelector({ variant = 'select', className }: LanguageSelectorProps) {
  const { language: currentLanguage, changeLanguage: setLanguage, availableLanguages } = useTranslation();
  
  console.log('LanguageSelector render:', { currentLanguage, availableLanguages });
  
  const handleLanguageChange = async (language: string) => {
    console.log('Language selector changing to:', language);
    try {
      await setLanguage(language);
      // Mark as manually set to prevent role-based override
      localStorage.setItem('immigration-app-language-manually-set', 'true');
      console.log('Language changed successfully to:', language);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        size="sm"
        className={className}
        data-testid="language-toggle-button"
      >
        <Globe className="h-4 w-4 mr-2" />
        {availableLanguages.find(lang => lang.code === currentLanguage)?.name}
      </Button>
    );
  }

  return (
    <Select value={currentLanguage} onValueChange={handleLanguageChange}>
      <SelectTrigger 
        className={`w-32 ${className}`} 
        data-testid="language-selector"
        onClick={() => console.log('Language selector clicked')}
      >
        <Globe className="h-4 w-4 mr-2" />
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent className="z-[9999]">
        {availableLanguages.map(({ code, name }) => (
          <SelectItem key={code} value={code} onClick={() => console.log('Language item clicked:', code, name)}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}