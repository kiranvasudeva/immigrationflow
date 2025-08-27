import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/contexts/I18nProvider";

interface HeaderProps {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(() => window.scrollY > 0);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 0;
      setIsScrolled(scrolled);
    };

    // Set initial state based on current scroll position
    const currentScrolled = window.scrollY > 0;
    setIsScrolled(currentScrolled);

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent flicker by maintaining scroll state during re-renders
  useEffect(() => {
    const currentScrolled = window.scrollY > 0;
    if (currentScrolled !== isScrolled) {
      setIsScrolled(currentScrolled);
    }
  }, [title, subtitle, isScrolled]);

  return (
    <header className={`sticky z-50 border-b border-gray-200 px-4 lg:px-8 py-3 lg:py-4 transition-all duration-200 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-sm shadow-sm' 
        : 'bg-surface'
    }`} style={{ top: 'var(--alert-height, 0px)' }}>
      <div className="flex items-center justify-between min-h-[56px] lg:min-h-[64px]">
        <div className="ml-16 lg:ml-0">
          <h1 className="text-lg lg:text-2xl font-bold text-gray-900 leading-tight">{title}</h1>
          <p className="text-secondary text-xs lg:text-base leading-tight">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {actions && <div className="flex-shrink-0">{actions}</div>}
          <SettingsMenu />
        </div>
      </div>
    </header>
  );
}

function SettingsMenu() {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" data-testid="settings-menu-button">
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem data-testid="settings-general">
          <Settings className="mr-2 h-4 w-4" />
          {t('settings.general') || 'General Settings'}
        </DropdownMenuItem>
        <DropdownMenuItem data-testid="settings-notifications">
          <Settings className="mr-2 h-4 w-4" />
          {t('settings.notifications') || 'Notifications'}
        </DropdownMenuItem>
        <DropdownMenuItem data-testid="settings-security">
          <Settings className="mr-2 h-4 w-4" />
          {t('settings.security') || 'Security'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem data-testid="settings-system">
          <Settings className="mr-2 h-4 w-4" />
          {t('settings.system') || 'System Settings'}
        </DropdownMenuItem>
        <DropdownMenuItem data-testid="settings-backup">
          <Settings className="mr-2 h-4 w-4" />
          {t('settings.backup') || 'Backup & Restore'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
