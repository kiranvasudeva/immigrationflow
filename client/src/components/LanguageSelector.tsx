import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useTranslation } from '@/contexts/I18nProvider';

interface LanguageSelectorProps {
  variant?: 'select' | 'button' | 'toggle';
  className?: string;
}

export function LanguageSelector({ variant = 'select', className }: LanguageSelectorProps) {
  const { language: currentLanguage, changeLanguage: setLanguage, availableLanguages } = useTranslation();
  
  const handleLanguageChange = async (language: string) => {
    try {
      await setLanguage(language);
      // Mark as manually set to prevent role-based override
      localStorage.setItem('immigration-app-language-manually-set', 'true');
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const handleToggleLanguage = () => {
    const currentIndex = availableLanguages.findIndex(lang => lang.code === currentLanguage);
    const nextIndex = (currentIndex + 1) % availableLanguages.length;
    handleLanguageChange(availableLanguages[nextIndex].code);
  };

  // Toggle button variant that cycles through languages
  if (variant === 'toggle') {
    return (
      <Button
        variant="outline"
        size="sm"
        className={className}
        onClick={handleToggleLanguage}
        data-testid="language-toggle-button"
      >
        <Globe className="h-4 w-4 mr-2" />
        {availableLanguages.find(lang => lang.code === currentLanguage)?.name}
      </Button>
    );
  }

  // Static button variant (display only)
  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        size="sm"
        className={className}
        data-testid="language-display-button"
        disabled
      >
        <Globe className="h-4 w-4 mr-2" />
        {availableLanguages.find(lang => lang.code === currentLanguage)?.name}
      </Button>
    );
  }

  // Default select dropdown variant
  return (
    <Select value={currentLanguage} onValueChange={handleLanguageChange}>
      <SelectTrigger 
        className={`w-32 ${className}`} 
        data-testid="language-selector"
      >
        <Globe className="h-4 w-4 mr-2" />
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent className="z-[9999]">
        {availableLanguages.map(({ code, name }) => (
          <SelectItem key={code} value={code}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}