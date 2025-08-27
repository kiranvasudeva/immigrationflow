import { useEffect, useState } from "react";
import { Settings, FileText, Workflow, Bell, Building, CreditCard, Calendar, Shield } from "lucide-react";
import { useLocation } from "wouter";
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
  const [location, setLocation] = useLocation();

  const handleMenuClick = (path: string) => {
    setLocation(path);
  };

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
        
        <DropdownMenuItem 
          data-testid="settings-general"
          onClick={() => handleMenuClick('/settings?tab=general')}
        >
          {t('settings.general') || 'General Settings'}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          data-testid="settings-document-categories"
          onClick={() => handleMenuClick('/settings?tab=documents')}
        >
          {t('settings.documentCategories') || 'Document Categories'}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          data-testid="settings-workflows"
          onClick={() => handleMenuClick('/settings?tab=workflows')}
        >
          {t('settings.workflows') || 'Workflow Management'}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          data-testid="settings-expiry-alerts"
          onClick={() => handleMenuClick('/settings?tab=expiry')}
        >
          {t('settings.expiryAlerts') || 'Document Expiry Alerts'}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          data-testid="settings-company-info"
          onClick={() => handleMenuClick('/settings?tab=company')}
        >
          {t('settings.companyInfo') || 'Company Information'}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          data-testid="settings-subscriptions"
          onClick={() => handleMenuClick('/settings?tab=subscription')}
        >
          {t('settings.subscriptions') || 'Subscription Management'}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          data-testid="settings-notifications"
          onClick={() => handleMenuClick('/settings?tab=notifications')}
        >
          {t('settings.notifications') || 'Notifications'}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          data-testid="settings-security"
          onClick={() => handleMenuClick('/settings?tab=security')}
        >
          {t('settings.security') || 'Security'}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          data-testid="settings-system"
          onClick={() => handleMenuClick('/settings?tab=system')}
        >
          {t('settings.system') || 'System Settings'}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          data-testid="settings-backup"
          onClick={() => handleMenuClick('/settings?tab=backup')}
        >
          {t('settings.backup') || 'Backup & Restore'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
