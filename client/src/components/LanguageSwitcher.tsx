import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useTranslation } from '@/contexts/I18nProvider';

interface LanguageSwitcherProps {
  variant?: 'select' | 'button';
  className?: string;
}

export function LanguageSwitcher({ variant = 'select', className }: LanguageSwitcherProps) {
  const { language, changeLanguage, availableLanguages } = useTranslation();
  
  const handleLanguageChange = async (newLanguage: string) => {
    await changeLanguage(newLanguage);
  };

  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        size="sm"
        className={className}
        onClick={() => {
          const currentIndex = availableLanguages.findIndex(lang => lang.code === language);
          const nextIndex = (currentIndex + 1) % availableLanguages.length;
          handleLanguageChange(availableLanguages[nextIndex].code);
        }}
        data-testid="language-toggle-button"
      >
        <Globe className="h-4 w-4 mr-2" />
        {availableLanguages.find(lang => lang.code === language)?.name}
      </Button>
    );
  }

  return (
    <Select value={language} onValueChange={handleLanguageChange}>
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