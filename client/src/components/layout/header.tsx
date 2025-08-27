import { useEffect, useState } from "react";
import { Settings, FileText, Workflow, Bell, Building, CreditCard, Calendar, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/contexts/I18nProvider";
import PatraIcon from "@/components/icons/PatraIcon";

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
        <div className="ml-16 lg:ml-0 flex items-center gap-3">
          <PatraIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-lg lg:text-2xl font-bold text-gray-900 leading-tight">{title}</h1>
            <p className="text-secondary text-xs lg:text-base leading-tight">{subtitle}</p>
          </div>
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
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-3 py-2 border-b">
          <p className="text-sm font-semibold">{t('settings.title') || 'Patra Settings'}</p>
        </div>
        
        <DropdownMenuItem data-testid="settings-general">
          <Settings className="mr-2 h-4 w-4" />
          {t('settings.general') || 'General Settings'}
        </DropdownMenuItem>
        
        <DropdownMenuItem data-testid="settings-document-categories">
          <FileText className="mr-2 h-4 w-4" />
          {t('settings.documentCategories') || 'Document Categories'}
        </DropdownMenuItem>
        
        <DropdownMenuItem data-testid="settings-workflows">
          <Workflow className="mr-2 h-4 w-4" />
          {t('settings.workflows') || 'Workflow Management'}
        </DropdownMenuItem>
        
        <DropdownMenuItem data-testid="settings-expiry-alerts">
          <Calendar className="mr-2 h-4 w-4" />
          {t('settings.expiryAlerts') || 'Document Expiry Alerts'}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem data-testid="settings-company-info">
          <Building className="mr-2 h-4 w-4" />
          {t('settings.companyInfo') || 'Company Information'}
        </DropdownMenuItem>
        
        <DropdownMenuItem data-testid="settings-subscriptions">
          <CreditCard className="mr-2 h-4 w-4" />
          {t('settings.subscriptions') || 'Subscription Management'}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem data-testid="settings-notifications">
          <Bell className="mr-2 h-4 w-4" />
          {t('settings.notifications') || 'Notifications'}
        </DropdownMenuItem>
        
        <DropdownMenuItem data-testid="settings-security">
          <Shield className="mr-2 h-4 w-4" />
          {t('settings.security') || 'Security'}
        </DropdownMenuItem>
        
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
