import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';

interface LanguageSelectorProps {
  variant?: 'select' | 'button';
  className?: string;
}

export function LanguageSelector({ variant = 'select', className }: LanguageSelectorProps) {
  const { currentLanguage, setLanguage, t, availableLanguages } = useTranslation();
  
  const handleLanguageChange = (language: string) => {
    setLanguage(language as any);
    // Mark as manually set to prevent role-based override
    localStorage.setItem('immigration-app-language-manually-set', 'true');
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
      <SelectTrigger className={`w-32 ${className}`} data-testid="language-selector">
        <Globe className="h-4 w-4 mr-2" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {availableLanguages.map(({ code, name }) => (
          <SelectItem key={code} value={code}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}