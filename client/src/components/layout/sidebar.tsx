import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useLocation } from "wouter";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useTranslation } from "@/contexts/LanguageContext";
import { Menu } from "lucide-react";

interface SidebarProps {
  userRole: 'ADMIN' | 'OWNER' | 'WORKER' | 'VIEWER';
  onSectionChange?: (section: string) => void;
  currentSection?: string;
}

export default function Sidebar({ userRole, onSectionChange, currentSection }: SidebarProps) {
  const { t } = useTranslation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getUserInitials = () => {
    switch (userRole) {
      case 'ADMIN': return 'AD';
      case 'OWNER': return 'TC';
      case 'WORKER': return 'JS';
      default: return 'VW';
    }
  };

  const getUserName = () => {
    switch (userRole) {
      case 'ADMIN': return 'Admin User';
      case 'OWNER': return 'TechCorp SRL';
      case 'WORKER': return 'John Smith';
      default: return 'Viewer';
    }
  };

  const [location] = useLocation();
  
  const handleNavigation = (href: string, sectionKey: string) => {
    if (onSectionChange && userRole === 'ADMIN') {
      onSectionChange(sectionKey);
    } else {
      window.location.href = href;
    }
  };

  const getNavItems = () => {
    const isActive = (href: string, sectionKey?: string) => {
      // For admin users, use currentSection if available
      if (userRole === 'ADMIN' && currentSection && sectionKey) {
        return currentSection === sectionKey;
      }
      // Fallback to URL-based matching for non-admin or when no currentSection
      if (href === '/' && (location === '/' || location === '/dashboard')) return true;
      return location.startsWith(href) && href !== '/';
    };

    const commonItems = [
      { icon: 'fas fa-chart-bar', label: 'Dashboard', href: '/dashboard', sectionKey: 'overview', active: isActive('/dashboard', 'overview') }
    ];

    switch (userRole) {
      case 'ADMIN':
        return [
          ...commonItems,
          { icon: 'fas fa-building', label: 'Clients & Workers', href: '/clients', sectionKey: 'clients', active: isActive('/clients', 'clients') },
          { icon: 'fas fa-file-text', label: 'Templates', href: '/templates', sectionKey: 'documents', active: isActive('/templates', 'documents') },
          { icon: 'fas fa-chart-line', label: 'Reports', href: '/reports', sectionKey: 'reports', active: isActive('/reports', 'reports') },
          { icon: 'fas fa-clipboard-list', label: 'Requirements', href: '/requirements', sectionKey: 'requirements', active: isActive('/requirements', 'requirements') },
          { icon: 'fas fa-bell', label: 'Reminders', href: '/reminders', sectionKey: 'reminders', active: isActive('/reminders', 'reminders') },
          { icon: 'fas fa-history', label: 'Audit Logs', href: '/audit', sectionKey: 'audit', active: isActive('/audit', 'audit') }
        ];
      case 'OWNER':
        return [
          ...commonItems,
          { icon: 'fas fa-building', label: t('nav.companyProfile') || 'Company Profile', href: '/profile', active: isActive('/profile') },
          { icon: 'fas fa-users', label: t('common.workers') || 'Workers', href: '/workers', active: isActive('/workers') },
          { icon: 'fas fa-file-alt', label: t('nav.documents') || 'Documents', href: '/documents', active: isActive('/documents') },
          { icon: 'fas fa-chart-line', label: t('nav.reports') || 'Reports', href: '/reports', active: isActive('/reports') },
          { icon: 'fas fa-euro-sign', label: t('nav.payments') || 'Payments', href: '/payments', active: isActive('/payments') }
        ];
      case 'WORKER':
        return [
          { icon: 'fas fa-chart-bar', label: t('nav.myProgress') || 'My Progress', href: '/dashboard', active: isActive('/dashboard') || isActive('/') },
          { icon: 'fas fa-file-alt', label: t('nav.documents') || 'Documents', href: '/documents', active: isActive('/documents') },
          { icon: 'fas fa-calendar', label: t('nav.deadlines') || 'Deadlines', href: '/deadlines', active: isActive('/deadlines') },
          { icon: 'fas fa-user', label: t('nav.profile') || 'Profile', href: '/profile', active: isActive('/profile') }
        ];
      default:
        return commonItems;
    }
  };

  const SidebarContent = () => (
    <div className="h-full bg-surface border-r border-gray-200 flex flex-col">
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <i className="fas fa-passport text-primary text-xl mr-3"></i>
        <span className="font-bold text-lg text-gray-900 hidden lg:inline">ImmigrationFlow</span>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-6">
        <div className="px-6 mb-4">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              userRole === 'ADMIN' ? 'bg-primary' :
              userRole === 'OWNER' ? 'bg-indigo-600' :
              userRole === 'WORKER' ? 'bg-green-600' : 'bg-gray-600'
            }`}>
              <span className="text-white text-sm font-medium">{getUserInitials()}</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{getUserName()}</p>
              <p className="text-xs text-secondary">{userRole === 'OWNER' ? 'Client Owner' : userRole.charAt(0) + userRole.slice(1).toLowerCase()}</p>
            </div>
          </div>
        </div>

        <div className="space-y-1 px-3">
          {getNavItems().map((item, index) => (
            <Button
              key={index}
              variant={(item as any).active ? "default" : "ghost"}
              className={`w-full justify-start ${
                (item as any).active 
                  ? 'bg-blue-50 text-primary hover:bg-blue-100' 
                  : 'text-secondary hover:bg-gray-50'
              }`}
              onClick={() => {
                handleNavigation((item as any).href || '/', (item as any).sectionKey || 'overview');
                setIsMobileOpen(false);
              }}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <i className={`${item.icon} mr-3`}></i>
              {item.label}
            </Button>
          ))}
        </div>
      </nav>

      <div className="p-3 space-y-2 border-t border-gray-200">
        <div className="px-3">
          <LanguageSelector className="w-full" />
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-secondary hover:bg-gray-50"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <i className="fas fa-sign-out-alt mr-3"></i>
          {t('actions.signOut') || 'Sign Out'}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="fixed top-4 left-4 z-[60] bg-white shadow-lg border-2 hover:bg-gray-50"
              data-testid="mobile-menu-button"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 z-[55]">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <SidebarContent />
      </div>
    </>
  );
}
